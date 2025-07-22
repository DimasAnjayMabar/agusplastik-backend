import bcrypt from "bcrypt"
import {v4 as uuid} from "uuid";
import { prismaClient } from "../application/database.js"
import { ResponseError } from "../error/response_error.js"
import { validate } from "../validation/validation.js"
import { createTransactionSchema } from "../validation/cashier_validation.js";

const createTransaction = async (req) => {
    try {
        // Validasi input menggunakan schema Joi
        const data = validate(createTransactionSchema, req.body);
        const { customer, payment, paidAmount = 0, items, discountId } = data;
        const staffId = req.user.id;
        const shopId = req.user.shopId;

        // Validasi dasar sudah ditangani oleh Joi schema, jadi bisa dihapus:
        // if (!payment || !items || items.length === 0) {...}

        // Hitung total amount
        const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

        // Validasi khusus untuk transaksi kredit
        if (payment === 'credit') {
            if (paidAmount > totalAmount) {
                throw new ResponseError(400, 'Jumlah pembayaran awal melebihi total transaksi');
            }
        }

        // Generate invoice number
        const transactionInvoice = generateInvoice('TRX');
        const stockOutInvoice = generateInvoice('STO');

        // Mulai transaksi database
        return await prisma.$transaction(async (prisma) => {
            // 1. Validasi stok dan harga untuk semua item
            for (const item of items) {
                const shopProduct = await prisma.shopProduct.findUnique({
                    where: {
                        shopId_productId: {
                            shopId,
                            productId: item.productId
                        }
                    },
                    include: {
                        product: true
                    }
                });

                if (!shopProduct) {
                    throw new ResponseError(400, `Produk dengan ID ${item.productId} tidak tersedia di toko ini`);
                }

                if (shopProduct.stock < item.quantity) {
                    throw new ResponseError(400, `Stok ${shopProduct.product.name} tidak mencukupi. Stok tersedia: ${shopProduct.stock}`);
                }

                const expectedSubtotal = parseFloat(shopProduct.product.sellPrice) * item.quantity;
                if (Math.abs(expectedSubtotal - parseFloat(item.subtotal)) > 0.01) { // Tolerance untuk floating point
                    throw new ResponseError(400, `Subtotal untuk produk ${shopProduct.product.name} tidak sesuai dengan harga jual`);
                }
            }

            // 2. Buat transaksi utama
            const transaction = await prisma.transaction.create({
                data: {
                    invoice: transactionInvoice,
                    customerId: payment === 'credit' ? customer.id : null,
                    totalAmount,
                    paidAmount: payment === 'credit' ? parseFloat(paidAmount) : totalAmount,
                    status: payment === 'credit' 
                        ? (paidAmount >= totalAmount ? 'paid' 
                           : (paidAmount > 0 ? 'partial' : 'unpaid'))
                        : 'paid',
                    payment,
                    createdBy: staffId,
                    discountId: discountId || null,
                    shopId // Tambahkan shopId ke transaction
                }
            });

            // 3. Buat stock out
            const stockOut = await prisma.stockOut.create({
                data: {
                    invoice: stockOutInvoice,
                    reason: `Penjualan - ${transactionInvoice}`,
                    totalAmount,
                    createdBy: staffId,
                    transactionId: transaction.id,
                    shopId
                }
            });

            // 4. Proses setiap item
            const transactionDetails = await Promise.all(items.map(async (item) => {
                // Buat detail transaksi
                const detail = await prisma.transactionDetail.create({
                    data: {
                        productId: item.productId,
                        transactionId: transaction.id,
                        quantity: item.quantity,
                        subtotal: item.subtotal,
                        discountId: item.discountId || null
                    }
                });

                // Buat detail stock out
                await prisma.stockOutDetail.create({
                    data: {
                        productId: item.productId,
                        stockOutId: stockOut.id,
                        quantity: item.quantity,
                        subtotal: item.subtotal
                    }
                });

                // Update stok
                await prisma.shopProduct.update({
                    where: {
                        shopId_productId: {
                            shopId,
                            productId: item.productId
                        }
                    },
                    data: {
                        stock: {
                            decrement: item.quantity
                        }
                    }
                });

                return detail;
            }));

            // 5. Jika transaksi kredit dan ada pembayaran, buat installment
            if (payment === 'credit' && paidAmount > 0) {
                await prisma.installment.create({
                    data: {
                        transactionId: transaction.id,
                        amountPaid: parseFloat(paidAmount),
                        method: 'cash',
                        note: 'Pembayaran awal'
                    }
                });
            }

            return {
                transaction,
                stockOut,
                details: transactionDetails,
                message: 'Transaksi berhasil dibuat'
            };
        });

    } catch (e) {
        if (e instanceof ResponseError) throw e;
        throw new ResponseError(500, "Gagal menambah transaksi", e);
    }
};

// Fungsi generate invoice yang lebih robust
function generateInvoice(prefix) {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timePart = now.getTime().toString().slice(-6);
    const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${datePart}-${timePart}-${randomPart}`;
}