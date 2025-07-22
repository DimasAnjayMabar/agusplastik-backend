import bcrypt from "bcrypt"
import {v4 as uuid} from "uuid";
import { prismaClient } from "../application/database.js"
import { ResponseError } from "../error/response_error.js"
import { validate } from "../validation/validation.js"
import { createTransactionSchema } from "../validation/cashier_validation.js";

// ================================= LOGIN =================================
const loginStaffKasir = async (request) => {
  try{
    const loginrequest = validate(login, request);

    const user = await prismaClient.user.findUnique({
      where: { username: loginrequest.username },
      select: {
        id: true,
        username: true,
        password: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new ResponseError(401, "Username atau password salah");
    }

    const passwordIsValid = await bcrypt.compare(loginrequest.password, user.password);
    if (!passwordIsValid) {
      throw new ResponseError(401, "Username atau password salah");
    }

    if (user.role !== "kasir") {
      throw new ResponseError(403, "Akses hanya untuk staff gudang");
    }

    const token = uuid();

    await prismaClient.userToken.create({
      data: {
        userId: user.id,
        token: token,
        lastActive: new Date(),
        expiresIn: 7 * 24 * 60 * 60, 
      },
    });

    return { token };
  }catch(e){
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Login gagal", e)
  }
};

// ================================= GET ALL =================================
const getAllTransaction = async (req) => {
    try{

    }catch(e){
        if (e instanceof ResponseError) throw e;
        throw new ResponseError(500, "Login gagal", e)
    }
}

const getAllCustomer = async (req) => {
    try{

    }catch(e){
        if (e instanceof ResponseError) throw e;
        throw new ResponseError(500, "Login gagal", e)
    }
}

// ================================= GET BY ID =================================
const getTransactionDetail = async (req) => {
    try{

    }catch(e){
        if (e instanceof ResponseError) throw e;
        throw new ResponseError(500, "Login gagal", e)
    }
}

const getCustomerDetail = async (req) => {
    try{

    }catch(e){
        if (e instanceof ResponseError) throw e;
        throw new ResponseError(500, "Login gagal", e)
    }
}

const getStaffProfile = async (req) => {
    try{

    }catch(e){
        if (e instanceof ResponseError) throw e;
        throw new ResponseError(500, "Login gagal", e)
    }
}

// ================================= UPDATE =================================
const updateTransaction = async (req) => {
    try{

    }catch(e){
        if (e instanceof ResponseError) throw e;
        throw new ResponseError(500, "Login gagal", e)
    }
}

const updateCustomer = async (req) => { 
    try{

    }catch(e){
        if (e instanceof ResponseError) throw e;
        throw new ResponseError(500, "Login gagal", e)
    }
}

const updateStaffProfile = async (req) => {
    try{

    }catch(e){
        if (e instanceof ResponseError) throw e;
        throw new ResponseError(500, "Login gagal", e)
    }
}

// ================================= DELETE =================================
const deleteTransaction = async(req) => {
    try{

    }catch(e){
        if (e instanceof ResponseError) throw e;
        throw new ResponseError(500, "Login gagal", e)
    }
}

const deleteCustomer = async (req) => {
    try{

    }catch(e){
        if (e instanceof ResponseError) throw e;
        throw new ResponseError(500, "Login gagal", e)
    }
}

// ================================= CREATE =================================
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

const createInstallment = async (req) => {
    try{

    }catch(e){
        if (e instanceof ResponseError) throw e;
        throw new ResponseError(500, "Login gagal", e)
    }
}

// Fungsi generate invoice yang lebih robust
function generateInvoice(prefix) {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timePart = now.getTime().toString().slice(-6);
    const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${datePart}-${timePart}-${randomPart}`;
}

export default {
    loginStaffKasir,
    createTransaction,
    createInstallment,
    getAllCustomer,
    getAllTransaction,
    getTransactionDetail,
    getCustomerDetail,
    getStaffProfile,
    updateCustomer,
    updateTransaction,
    updateStaffProfile,
    deleteCustomer,
    deleteTransaction
}