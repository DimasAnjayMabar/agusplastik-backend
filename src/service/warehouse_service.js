import bcrypt from "bcrypt"
import {v4 as uuid} from "uuid";
import { prismaClient } from "../application/database.js"
import { ResponseError } from "../error/response_error.js"
import { validate } from "../validation/validation.js"
import { login } from "../validation/warehouse_validation.js"

// ================================= LOGIN =================================
const loginStaffGudang = async (request) => {
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

    if (user.role !== "gudang") {
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
const getShopProducts = async (req) => {
    try {
        const shopId = req.user.shopId;

        if (!shopId) {
            throw new ResponseError(403, "User tidak terkait dengan toko manapun");
        }

        const shopProducts = await prismaClient.shopProduct.findMany({
            where: { shopId },
            include: {
                product: true // ambil detail produk
            }
        });

        // Kalau kamu ingin hanya list produk saja (tanpa stock), bisa mapping
        const products = shopProducts.map((sp) => ({
            ...sp.product,
            stock: sp.stock // tetap tambahkan stok dari ShopProduct
        }));

        return products;

    } catch (e) {
        if (e instanceof ResponseError) throw e;
        throw new ResponseError(500, "Gagal mengambil data produk");
    }
};

const getShopDistributor = async (req) => {
  try {
    const shopId = req.user.shopId;

    if (!shopId) {
      throw new ResponseError(403, "User tidak terkait dengan toko manapun");
    }

    const distributorShops = await prismaClient.distributorShop.findMany({
      where: {
        shopId: shopId,
        distributor: {
          isActive: true
        }
      },
      include: {
        distributor: true
      },
      orderBy: {
        distributor: {
          name: 'asc'
        }
      }
    });

    // Kembalikan hanya data distributor-nya
    return distributorShops.map((ds) => ds.distributor);

  } catch (e) {
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal mengambil data distributor");
  }
};

const getProductTypes = async (req) => {
  try {
    const types = await prisma.type.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc', // optional: agar tersortir rapi
      }
    });

    return types; // hasil ini bisa langsung digunakan di frontend dropdown
  } catch (e) {
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal mengambil tipe produk");
  }
};

// ================================= GET BY ID =================================
const getProductById = async (req) => {
  try {
    const productId = parseInt(req.params);
    if (isNaN(productId)) {
      throw new ResponseError(400, "ID produk tidak valid");
    }

    const product = await prismaClient.product.findUnique({
      where: { id: productId },
      include: {
        distributor: true,
        type: true,
      },
    });

    if (!product) {
      throw new ResponseError(404, "Produk tidak ditemukan");
    }

    return product;
  } catch (e) {
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal menambil data produk");
  }
};

const getDistributorById = async (req) => {
  try {
    const distributorId = parseInt(req.params);
    if (isNaN(distributorId)) {
      throw new ResponseError(400, "ID distributor tidak valid");
    }

    const distributor = await prismaClient.distributor.findUnique({
      where: { id: distributorId },
      include: {
        shop: true, // Tampilkan data toko yang dilayani distributor ini
      },
    });

    if (!distributor) {
      throw new ResponseError(404, "Distributor tidak ditemukan");
    }

    return distributor;
  } catch (e) {
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal mengambil data distributor");
  }
};

const getStaffProfile = async (req) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        nik: true,
        imagePath: true,
        role: true,
        isActive: true,
        createdAt: true,
        shop: {
          select: {
            id: true,
            name: true,
            address: true,
            admin: {
              select: {
                id: true,
                name: true, // Nama admin
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new ResponseError(404, "Pengguna tidak ditemukan");
    }

    return user;

  } catch (e) {
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal mengambil profil", e);
  }
};

// ================================= CREATE =================================
const createDistributor = async (req) => {
  try {
    const shopId = req.user.shopId;

    if (!shopId) {
      throw new ResponseError(403, "User tidak terkait dengan toko manapun");
    }

    const data = validate(createDistributor, req.body);

    const distributor = await prismaClient.distributor.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        ecommerceLink: data.ecommerceLink,
        imagePath: data.imagePath,
        address: data.address,
        isActive: true,
        shops: {
          create: {
            shop: { connect: { id: shopId } }
          }
        }
      },
      include: {
        shops: {
          include: {
            shop: true
          }
        }
      }
    });

    return distributor;

  } catch (e) {
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal menambah distributor");
  }
};

const createProduct = async (req) => {
  try{
    const { shopId, id: userId } = req.user;
    if (!shopId) throw new ResponseError(400, "Toko tidak ditemukan");

    const { distributorId, invoiceDate, products } = await validate(createStockInSchema, req.body);
    const now = invoiceDate ? new Date(invoiceDate) : new Date();

    return await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const createdProducts = [];

      for (const item of products) {
        const buyPrice = parseFloat((item.subtotal / item.stock).toFixed(2));
        const sellPrice = parseFloat((buyPrice * (1 + item.profitPercent / 100)).toFixed(2));
        const barcode = generateBarcode();

        // 1. Cek apakah produk sudah ada
        let product = await tx.product.findFirst({
          where: {
            name: item.name,
            typeId: item.typeId,
            distributorId: distributorId ?? null
          }
        });

        if (!product) {
          // 2. Jika belum ada, buat baru
          const buyPrice = parseFloat((item.subtotal / item.stock).toFixed(2));
          const sellPrice = parseFloat((buyPrice * (1 + item.profitPercent / 100)).toFixed(2));
          const barcode = generateBarcode();

          product = await tx.product.create({
            data: {
              name: item.name,
              buyPrice,
              sellPrice,
              imagePath: item.imagePath,
              barcode,
              typeId: item.typeId,
              distributorId: distributorId ?? null
            }
          });

          // 3. Tambahkan juga ke ShopProduct
          await tx.shopProduct.create({
            data: {
              shopId,
              productId: product.id,
              stock: item.stock
            }
          });

        } else {
          const currentBuyPrice = Number(product.buyPrice);

          if (currentBuyPrice !== buyPrice) {
            const updatedSellPrice = parseFloat((buyPrice * (1 + item.profitPercent / 100)).toFixed(2));

            await tx.product.update({
              where: { id: product.id },
              data: {
                buyPrice: buyPrice,
                sellPrice: updatedSellPrice
              }
            });

            await tx.productHistory.create({
              data: {
                productId: product.id,
                description: `Perubahan harga beli dari ${currentBuyPrice} menjadi ${buyPrice}, harga jual disesuaikan menjadi ${updatedSellPrice}`
              }
            });
          }

          await tx.shopProduct.upsert({
            where: {
              shopId_productId: {
                shopId,
                productId: product.id
              }
            },
            update: {
              stock: {
                increment: item.stock
              }
            },
            create: {
              shopId,
              productId: product.id,
              stock: item.stock
            }
          });
        }

        await tx.shopProduct.create({
          data: {
            shopId,
            productId: product.id,
            stock: item.stock
          }
        });

        createdProducts.push({
          productId: product.id,
          quantity: item.stock,
          subtotal: item.subtotal
        });

        totalAmount += item.subtotal;
      }

      const stockIn = await tx.stockIn.create({
        data: {
          invoice: generateInvoiceNumber(),
          reason: "Pembelian Produk Baru",
          totalAmount,
          createdBy: userId,
          createdAt: now,
          distributorId: distributorId ?? null,
          sourceShopId: shopId
        }
      });

      for (const detail of createdProducts) {
        await tx.stockInDetail.create({
          data: {
            productId: detail.productId,
            stockInId: stockIn.id,
            quantity: detail.quantity,
            subtotal: detail.subtotal
          }
        });
      }

      return {
        message: "Transaksi stock in berhasil",
        stockInId: stockIn.id,
        totalProduct: createdProducts.length
      };
    });
  }catch(e){
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal menambah distributor");
  }
};

// ================================= UPDATE =================================
const updateDistributor = async (req) => {
  try {
    const distributorId = parseInt(req.params);
    if (isNaN(distributorId)) throw new ResponseError(400, "ID distributor tidak valid");

    // Validasi input
    const updateRequest = validate(updateDistributor, req.body);

    // Ambil data distributor lama
    const existingDistributor = await prisma.distributor.findUnique({
      where: { id: distributorId },
    });

    if (!existingDistributor) throw new ResponseError(404, "Distributor tidak ditemukan");

    // Bandingkan field dan buat deskripsi perubahan
    const changes = [];
    const fields = ["name", "phone", "email", "ecommerceLink", "imagePath", "address"];

    for (const field of fields) {
      const newValue = updateRequest[field];
      const oldValue = existingDistributor[field];

      if (
        newValue !== undefined &&
        newValue !== oldValue &&
        !(newValue === null && oldValue === null)
      ) {
        changes.push(`"${field}" diubah dari "${oldValue ?? 'null'}" menjadi "${newValue ?? 'null'}"`);
      }
    }

    // Kalau tidak ada perubahan, return saja
    if (changes.length === 0) {
      return { message: "Tidak ada perubahan data" };
    }

    // Simpan perubahan ke tabel Distributor
    await prisma.distributor.update({
      where: { id: distributorId },
      data: updateRequest,
    });

    // Simpan riwayat perubahan
    await prisma.distributorHistory.create({
      data: {
        description: changes.join("; "),
        distributorId: distributorId,
      },
    });

    return { message: "Distributor berhasil diperbarui" };

  } catch (e) {
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal mengupdate data distributor");
  }
};

const updateProduct = async (req) => {
  try {
    const productId = parseInt(req.params);
    if (isNaN(productId)) throw new ResponseError(400, "ID produk tidak valid");

    // Validasi input
    const updateRequest = validate(updateProduct, req.body);

    // Ambil data produk lama
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) throw new ResponseError(404, "Produk tidak ditemukan");

    // Bandingkan field dan buat deskripsi perubahan
    const changes = [];
    const fields = ["name", "imagePath", "distributorId", "typeId"];

    for (const field of fields) {
      const newValue = updateRequest[field];
      const oldValue = existingProduct[field];

      if (
        newValue !== undefined &&
        newValue !== oldValue &&
        !(newValue === null && oldValue === null)
      ) {
        changes.push(`"${field}" diubah dari "${oldValue ?? 'null'}" menjadi "${newValue ?? 'null'}"`);
      }
    }

    // Kalau tidak ada perubahan, return saja
    if (changes.length === 0) {
      return { message: "Tidak ada perubahan data" };
    }

    // Update ke tabel Product
    await prisma.product.update({
      where: { id: productId },
      data: updateRequest,
    });

    // Catat ke dalam ProductHistory
    await prisma.productHistory.create({
      data: {
        description: changes.join("; "),
        productId: productId,
      },
    });

    return { message: "Produk berhasil diperbarui" };

  } catch (e) {
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal mengupdate data produk");
  }
};

const updateStaffProfile = async (req) => {
  try {
    const staffId = req.user.id;

    if (req.user.role !== "gudang") {
      throw new ResponseError(403, "Hanya staff gudang yang dapat mengubah profilnya");
    }

    const updateRequest = validate(updateAdminValidation, req.body);

    const staffGudang = await prismaClient.user.findFirst({
      where: {
        id: staffId,
        role: "gudang",
        isActive: true,
      },
    });

    if (!staffGudang) {
      throw new ResponseError(404, "Admin tidak ditemukan");
    }

    const changes = [];
    const fields = ['name', 'email', 'phone', 'nik', 'photoPath'];

    for (const field of fields) {
      const oldValue = staffGudang[field];
      const newValue = updateRequest[field];

      if (typeof newValue !== 'undefined' && newValue !== oldValue) {
        changes.push(`${field} dari '${oldValue ?? "-"}' ke '${newValue ?? "-"}'`);
      }
    }

    if (changes.length === 0) {
      throw new ResponseError(400, "Tidak ada perubahan yang dilakukan");
    }

    const updated = await prismaClient.user.update({
      where: { id: staffId },
      data: updateRequest,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        phone: true,
        email: true,
        nik: true,
        photoPath: true,
        isActive: true,
        shopId: true,
      },
    });

    await prismaClient.userHistory.create({
      data: {
        userId: staffGudang,
        description: `Staff Gudang '${req.user.username}' mengubah ${changes.join(', ')}`,
      },
    });

    return updated;
  } catch (e) {
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal mengupdate profil staff gudang", e);
  }
};

// ================================= DELETE =================================
const deleteProduct = async (req) => {
  try {
    const productId = parseInt(req.params);
    if (isNaN(productId)) throw new ResponseError(400, "ID produk tidak valid");

    // Cek apakah produk ada
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) throw new ResponseError(404, "Produk tidak ditemukan");

    if (!existingProduct.isActive) {
      return { message: "Produk sudah tidak aktif" };
    }

    // Update isActive menjadi false
    await prisma.product.update({
      where: { id: productId },
      data: {
        isActive: false,
      },
    });

    // Catat perubahan ke riwayat
    await prisma.productHistory.create({
      data: {
        productId,
        description: `Produk dinonaktifkan`,
      },
    });

    return { message: "Produk berhasil dinonaktifkan" };

  } catch (e) {
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal menonaktifkan produk");
  }
};

const deleteDistributor = async (req) => {
  try {
    const distributorId = parseInt(req.params.id);
    if (isNaN(distributorId)) throw new ResponseError(400, "ID distributor tidak valid");

    const existingDistributor = await prisma.distributor.findUnique({
      where: { id: distributorId },
    });

    if (!existingDistributor) throw new ResponseError(404, "Distributor tidak ditemukan");

    if (!existingDistributor.isActive) {
      return { message: "Distributor sudah dalam status tidak aktif" };
    }

    // Update status ke tidak aktif
    await prisma.distributor.update({
      where: { id: distributorId },
      data: { isActive: false },
    });

    // Catat riwayat perubahan
    await prisma.distributorHistory.create({
      data: {
        description: `Status distributor dinonaktifkan`,
        distributorId: distributorId,
      },
    });

    return { message: "Distributor berhasil dinonaktifkan" };
  } catch (e) {
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal menonaktifkan distributor");
  }
};

export default {
    loginStaffGudang,
    getShopProducts,
    getShopDistributor,
    getProductTypes,
    createDistributor,
    createProduct,
    getProductById,
    getDistributorById,
    getStaffProfile,
    updateDistributor,
    updateProduct,
    updateStaffProfile,
    deleteDistributor,
    deleteProduct
}
