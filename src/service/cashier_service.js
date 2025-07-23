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
      throw new ResponseError(403, "Akses hanya untuk staff kasir");
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
    try {
        const { 
            search, 
            sortBy, 
            sortOrder = 'desc', 
            minAmount, 
            maxAmount 
        } = req.query;

        // Build base query
        let whereClause = {};
        let orderByClause = { createdAt: 'desc' }; // Default sort

        // Search by date or customer name
        if (search) {
            whereClause.OR = [
                // Search by date (format: dd-mm-yyyy or yyyy-mm-dd)
                { createdAt: { equals: new Date(search) } },
                // Search by customer name (for credit transactions)
                { 
                    AND: [
                        { payment: 'credit' },
                        { customer: { name: { contains: search, mode: 'insensitive' } } }
                    ]
                }
            ];
        }

        // Filter by amount range
        if (minAmount || maxAmount) {
            whereClause.totalAmount = {};
            if (minAmount) whereClause.totalAmount.gte = parseFloat(minAmount);
            if (maxAmount) whereClause.totalAmount.lte = parseFloat(maxAmount);
        }

        // Sorting options
        if (sortBy) {
            if (sortBy === 'date') {
                orderByClause = { createdAt: sortOrder };
            } else if (sortBy === 'amount') {
                orderByClause = { totalAmount: sortOrder };
            }
        }

        const transactions = await prismaClient.transaction.findMany({
            where: whereClause,
            select: {
                id: true,
                invoice: true,
                createdAt: true,
                totalAmount: true,
                paidAmount: true,
                status: true,
                payment: true,
                customer: {
                    select: {
                        name: true,
                        phone: true
                    },
                    where: {
                        payment: 'credit'
                    }
                }
            },
            orderBy: orderByClause
        });

        // Format data untuk frontend
        const formattedTransactions = transactions.map(transaction => ({
            id: transaction.id,
            invoice: transaction.invoice,
            tanggal: transaction.createdAt.toLocaleDateString('id-ID', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
            }),
            customer: transaction.payment === 'credit' 
                ? `${transaction.customer?.name || '-'} (${transaction.customer?.phone || '-'})` 
                : '-',
            totalBelanja: transaction.totalAmount.toFixed(2),
            payment: transaction.payment.toUpperCase(),
            statusPembayaran: getPaymentStatusText(transaction.status, transaction.paidAmount, transaction.totalAmount),
            rawDate: transaction.createdAt, // Untuk sorting di frontend
            rawAmount: transaction.totalAmount // Untuk sorting di frontend
        }));

        return formattedTransactions;

    } catch(e) {
        if (e instanceof ResponseError) throw e;
        throw new ResponseError(500, "Gagal mengambil data transaksi", e);
    }
};

// Helper function untuk menentukan teks status pembayaran
function getPaymentStatusText(status, paidAmount, totalAmount) {
    if (status === 'paid') return 'LUNAS';
    if (status === 'unpaid') return 'BELUM BAYAR';
    if (status === 'partial') {
        const percentage = (paidAmount / totalAmount * 100).toFixed(0);
        return `CICILAN (${percentage}%)`;
    }
    return status.toUpperCase();
};

const getAllCustomer = async (req) => {
    try {
        const { search = '' } = req.query;
        
        // Buat kondisi pencarian
        const whereCondition = {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { nik: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } }
            ]
        };

        // Jika tidak ada parameter search, tampilkan semua customer
        if (!search) {
            delete whereCondition.OR;
        }

        const customers = await prismaClient.customer.findMany({
            where: whereCondition,
            select: {
                id: true,
                name: true,
                nik: true,
                imagePath: true,
                address: true,
                phone: true,
                Transaction: false // Tidak menampilkan data transaksi
            }
        });

        return customers;
    } catch (e) {
        if (e instanceof ResponseError) throw e;
        throw new ResponseError(500, "Gagal mengambil data customer", e);
    }
};

// ================================= GET BY ID =================================
const getTransactionDetail = async (req) => {
    try {
        const { id } = req.params;

        // Get transaction with all related data
        const transaction = await prismaClient.transaction.findUnique({
            where: { id: parseInt(id) },
            include: {
                staff: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                customer: true,
                discount: true,
                details: {
                    include: {
                        product: {
                            include: {
                                type: {
                                    select: {
                                        name: true
                                    }
                                },
                                distributor: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        },
                        discount: true
                    }
                },
                installments: {
                    orderBy: {
                        paidAt: 'desc'
                    }
                }
            }
        });

        if (!transaction) {
            throw new ResponseError(404, "Transaksi tidak ditemukan");
        }

        // Calculate remaining amount
        const remainingAmount = transaction.totalAmount - transaction.paidAmount;

        // Format the response
        const response = {
            id: transaction.id,
            invoice: transaction.invoice,
            tanggal: transaction.createdAt.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            payment: transaction.payment.toUpperCase(),
            status: transaction.status.toUpperCase(),
            totalAmount: transaction.totalAmount,
            paidAmount: transaction.paidAmount,
            remainingAmount: remainingAmount,
            dueDate: transaction.dueDate?.toLocaleDateString('id-ID') || null,
            staff: transaction.staff.name,
            
            // Customer data if credit transaction
            customer: transaction.payment === 'credit' ? {
                name: transaction.customer?.name,
                nik: transaction.customer?.nik,
                phone: transaction.customer?.phone,
                address: transaction.customer?.address,
                imagePath: transaction.customer?.imagePath
            } : null,
            
            // Transaction discount if exists
            transactionDiscount: transaction.discount ? {
                name: transaction.discount.name,
                type: transaction.discount.type,
                percent: transaction.discount.percentDiscount
            } : null,
            
            // Product details
            products: transaction.details.map(detail => ({
                id: detail.product.id,
                name: detail.product.name,
                barcode: detail.product.barcode,
                type: detail.product.type.name,
                distributor: detail.product.distributor?.name || '-',
                quantity: detail.quantity,
                price: detail.product.sellPrice,
                subtotal: detail.subtotal,
                // Product discount if exists
                discount: detail.discount ? {
                    name: detail.discount.name,
                    percent: detail.discount.percentDiscount
                } : null
            })),
            
            // Installment history
            paymentHistory: transaction.installments.map(installment => ({
                date: installment.paidAt.toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                amount: installment.amountPaid,
                method: installment.method.toUpperCase(),
                note: installment.note || '-'
            })),
            
            // Summary for credit transactions
            ...(transaction.payment === 'credit' && {
                creditSummary: {
                    totalInstallments: transaction.installments.length,
                    totalPaid: transaction.installments.reduce(
                        (sum, installment) => sum + installment.amountPaid, 0
                    ),
                    lastPayment: transaction.installments[0]?.paidAt.toLocaleDateString('id-ID') || '-'
                }
            })
        };

        return response;

    } catch(e) {
        if (e instanceof ResponseError) throw e;
        throw new ResponseError(500, "Gagal mengambil detail transaksi", e);
    }
};

const getCustomerDetail = async (req) => {
    try {
        const { id } = req.params; // Mengambil ID dari route parameter
        
        // Validasi ID
        if (!id || isNaN(Number(id))) {
            throw new ResponseError(400, "ID customer tidak valid");
        }

        const customer = await prismaClient.customer.findUnique({
            where: { id: Number(id) },
            include: {
                Transaction: true // Opsional: include transaksi jika diperlukan
            }
        });

        // Jika customer tidak ditemukan
        if (!customer) {
            throw new ResponseError(404, "Customer tidak ditemukan");
        }

        return customer;
    } catch (e) {
        if (e instanceof ResponseError) throw e;
        throw new ResponseError(500, "Gagal mengambil detail customer", e);
    }
};

const getStaffProfile = async (req) => {
    try {
        const staff = await prismaClient.user.findUnique({
            where: {
                id: parseInt(req.user.id),
                role: 'kasir', // Pastikan yang login adalah kasir
                isActive: true // Pastikan akunnya aktif
            },
            select: {
                id: true,
                username: true,
                name: true,
                email: true,
                phone: true,
                nik: true,
                imagePath: true,
                role: true,
                createdAt: true,
                shop: {
                    select: {
                        id: true,
                        name: true,
                        address: true
                        // Tambahkan field lain yang diperlukan dari toko
                    }
                }
            }
        });

        if (!staff) {
            throw new ResponseError(404, "Staff kasir tidak ditemukan atau tidak aktif");
        }

        return staff;
    } catch(e) {
        if (e instanceof ResponseError) throw e;
        throw new ResponseError(500, "Gagal mengambil profil staff", e);
    }
};

// ================================= UPDATE =================================
const updateCustomer = async (req) => {
    const { id } = req.params;
    const { name, nik, imagePath, address, phone } = req.body;
    const customerId = Number(id);

    try {
        // 1. Validasi ID
        if (isNaN(customerId) || customerId <= 0) {
            throw new ResponseError(400, "ID customer tidak valid");
        }

        // 2. Dapatkan data customer saat ini untuk komparasi
        const existingCustomer = await prismaClient.customer.findUnique({
            where: { id: customerId }
        });

        if (!existingCustomer) {
            throw new ResponseError(404, "Customer tidak ditemukan");
        }

        // 3. Siapkan data update dan perubahan
        const updateData = {};
        const changes = [];

        // Fungsi helper untuk mencatat perubahan
        const recordChange = (field, displayName, newValue) => {
            if (newValue !== undefined && newValue !== existingCustomer[field]) {
                updateData[field] = newValue;
                changes.push(`${displayName} diubah dari "${existingCustomer[field]}" menjadi "${newValue}"`);
            }
        };

        recordChange('name', 'Nama', name);
        recordChange('nik', 'NIK', nik);
        recordChange('imagePath', 'Foto Profil', imagePath);
        recordChange('address', 'Alamat', address);
        recordChange('phone', 'Nomor Telepon', phone);

        // 4. Validasi ada perubahan
        if (Object.keys(updateData).length === 0) {
            throw new ResponseError(400, "Tidak ada perubahan data");
        }

        // 5. Eksekusi dalam transaction
        const [updatedCustomer] = await prismaClient.$transaction([
            // Update customer
            prismaClient.customer.update({
                where: { id: customerId },
                data: updateData,
                select: {
                    id: true,
                    name: true,
                    nik: true,
                    imagePath: true,
                    address: true,
                    phone: true
                }
            }),
            // Catat history
            prismaClient.customerHistory.create({
                data: {
                    description: `Perubahan data: ${changes.join(', ')}`,
                    customerId: customerId
                }
            })
        ]);

        return updatedCustomer;

    } catch (error) {
        if (error instanceof ResponseError) throw error;
        throw new ResponseError(500, "Gagal mengupdate customer", error);
    }
};

const updateStaffProfile = async (req) => {
    try {
        const { name, email, phone, nik, imagePath } = req.body;
        
        if (!name && !email && !phone && !nik && !imagePath) {
            throw new ResponseError(400, "Minimal satu field harus diisi untuk diupdate");
        }

        // Dapatkan data lama untuk perbandingan
        const oldData = await prismaClient.user.findUnique({
            where: { id: req.user.id },
            select: { name: true, email: true, phone: true, nik: true, imagePath: true }
        });

        if (!oldData) {
            throw new ResponseError(404, "Staff tidak ditemukan");
        }

        const updateData = {};
        const changes = [];
        
        // Buat log perubahan
        if (name && name !== oldData.name) {
            updateData.name = name;
            changes.push(`Nama diubah dari '${oldData.name}' menjadi '${name}'`);
        }
        if (email && email !== oldData.email) {
            updateData.email = email;
            changes.push(`Email diubah dari '${oldData.email || '[kosong]'}' menjadi '${email}'`);
        }
        if (phone && phone !== oldData.phone) {
            updateData.phone = phone;
            changes.push(`Nomor telepon diubah dari '${oldData.phone || '[kosong]'}' menjadi '${phone}'`);
        }
        if (nik && nik !== oldData.nik) {
            updateData.nik = nik;
            changes.push(`NIK diubah dari '${oldData.nik || '[kosong]'}' menjadi '${nik}'`);
        }
        if (imagePath && imagePath !== oldData.imagePath) {
            updateData.imagePath = imagePath;
            changes.push(`Foto profil diubah`);
        }

        if (changes.length === 0) {
            throw new ResponseError(400, "Tidak ada perubahan yang dilakukan");
        }

        // Gunakan transaction untuk update user dan buat history
        const [updatedStaff] = await prismaClient.$transaction([
            prismaClient.user.update({
                where: {
                    id: req.user.id,
                    role: 'kasir',
                    isActive: true
                },
                data: updateData,
                select: {
                    id: true,
                    username: true,
                    name: true,
                    email: true,
                    phone: true,
                    nik: true,
                    imagePath: true,
                    role: true,
                    updatedAt: true
                }
            }),
            prismaClient.userHistory.create({
                data: {
                    description: `Update profil: ${changes.join(', ')}`,
                    userId: req.user.id
                }
            })
        ]);

        if (!updatedStaff) {
            throw new ResponseError(404, "Staff kasir tidak ditemukan atau tidak aktif");
        }

        return updatedStaff;
    } catch(e) {
        if (e instanceof ResponseError) throw e;
        throw new ResponseError(500, "Gagal mengupdate profil staff", e);
    }
};

// ================================= DELETE =================================
const deleteCustomer = async (req) => {
    const { id } = req.params;
    const customerId = Number(id);

    try {
        // 1. Validasi ID
        if (isNaN(customerId)) {
            throw new ResponseError(400, "ID customer tidak valid");
        }

        // 2. Cek apakah customer ada dan aktif
        const existingCustomer = await prismaClient.customer.findUnique({
            where: { id: customerId }
        });

        if (!existingCustomer) {
            throw new ResponseError(404, "Customer tidak ditemukan");
        }

        if (existingCustomer.isActive === false) {
            throw new ResponseError(400, "Customer sudah tidak aktif");
        }

        // 3. Lakukan soft delete dalam transaction
        const [deletedCustomer] = await prismaClient.$transaction([
            // Update status isActive
            prismaClient.customer.update({
                where: { id: customerId },
                data: { isActive: false },
                select: {
                    id: true,
                    name: true,
                    nik: true,
                    isActive: true
                }
            }),
            // Catat history
            prismaClient.customerHistory.create({
                data: {
                    description: `Customer dinonaktifkan (soft delete)`,
                    customerId: customerId
                }
            })
        ]);

        return {
            message: "Customer berhasil dinonaktifkan",
            data: deletedCustomer
        };

    } catch (error) {
        if (error instanceof ResponseError) throw error;
        throw new ResponseError(500, "Gagal menonaktifkan customer", error);
    }
};

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
        return await prismaClient.$transaction(async (prisma) => {
            // 1. Validasi stok dan harga untuk semua item
            for (const item of items) {
                const shopProduct = await prismaClient.shopProduct.findUnique({
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
            const transaction = await prismaClient.transaction.create({
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
            const stockOut = await prismaClient.stockOut.create({
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
                const detail = await prismaClient.transactionDetail.create({
                    data: {
                        productId: item.productId,
                        transactionId: transaction.id,
                        quantity: item.quantity,
                        subtotal: item.subtotal,
                        discountId: item.discountId || null
                    }
                });

                // Buat detail stock out
                await prismaClient.stockOutDetail.create({
                    data: {
                        productId: item.productId,
                        stockOutId: stockOut.id,
                        quantity: item.quantity,
                        subtotal: item.subtotal
                    }
                });

                // Update stok
                await prismaClient.shopProduct.update({
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
                await prismaClient.installment.create({
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
};

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
    updateStaffProfile,
    deleteCustomer,
}