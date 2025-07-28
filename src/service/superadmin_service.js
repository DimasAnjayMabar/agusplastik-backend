import bcrypt from "bcrypt"
import {v4 as uuid} from "uuid";
import { prismaClient } from "../application/database.js"
import { ResponseError } from "../error/response_error.js"
import { validate } from "../validation/validation.js"
import { registerSuperadminValidation, login, updateAdminValidation, updateStaffValidation, registerAdminValidation, updateSuperadminValidation, registerShopValidation } from "../validation/superadmin_validation.js";

// ================================= REGISTRASI =================================
const registerSuperadmin = async (request) => {
  try{
    const register = validate(registerSuperadminValidation, request.body) 

    const findExistingUser = await prismaClient.user.count({
        where : {
            username : register.username
        }
    })

    if(findExistingUser === 1){
        throw new ResponseError(400, "Username terdaftar")
    }

    register.password = await bcrypt.hash(register.password, 10);

    register.role = "superadmin";

    const result = await prismaClient.user.create({
        data : register,
        select : {
            username : true
        }
    })

    return result
  }catch(e){
    console.error('Error :', e);
    
    if (e instanceof ResponseError) {
      throw e;
    }
    
    if (e instanceof Prisma.PrismaClientKnownrequestError) {
      throw new ResponseError(400, "Kesalahan dalam permintaan database", {
        code: e.code,
        meta: e.meta,
        cause: e
      });
    }
    
    throw new ResponseError(500, "Gagal registrasi superadmin", {
      originalError: e.message,
      stack: e.stack
    });
  }
}

const registerAdmin = async (request) => {
  try {
    if (request.user.role !== 'superadmin') {
      throw new ResponseError(403, "Hanya superadmin yang dapat membuat admin");
    }

    const register = validate(registerAdminValidation, request.body);
    const shopId = request.params.shopId;

    // 1. Validasi shop dan cek admin yang ada
    const shop = await prismaClient.shop.findUnique({
      where: { id: Number(shopId) },
      include: {
        admin: {
          select: {
            id: true,
            role: true,
            name: true
          }
        }
      }
    });

    if (!shop) {
      throw new ResponseError(404, "Toko tidak ditemukan");
    }

    // 2. Cek apakah shop sudah memiliki admin
    if (shop.admin) {
      // Jika admin yang ada adalah superadmin, lepaskan dari toko
      if (shop.admin.role === 'superadmin') {
        await prismaClient.$transaction([
          prismaClient.shop.update({
            where: { id: Number(shopId) },
            data: { adminId: null }
          }),
          prismaClient.user.update({
            where: { id: shop.admin.id },
            data: { shopId: null }
          }),
          prismaClient.userHistory.create({
            data: {
              userId: shop.admin.id,
              description: `Superadmin '${request.user.name}' melepas '${shop.admin.name}' dari toko '${shop.name}' karena akan ditetapkan admin baru`
            }
          })
        ]);
      } else {
        // Jika admin yang ada bukan superadmin, tolak permintaan
        throw new ResponseError(400, "Toko ini sudah memiliki admin");
      }
    }

    // 3. Cek username availability
    const existingUser = await prismaClient.user.count({
      where: { username: register.username }
    });

    if (existingUser > 0) {
      throw new ResponseError(400, "Username sudah terdaftar");
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(register.password, 10);

    // 5. Buat admin dalam transaction
    const result = await prismaClient.$transaction(async (prisma) => {
      // Buat user admin
      const newAdmin = await prisma.user.create({
        data: {
          username: register.username,
          password: hashedPassword,
          name: register.name,
          email: register.email,
          phone: register.phone,
          nik: register.nik,
          imagePath: register.imagePath,
          role: "admin",
          shopId: null
        }
      });

      // Update shop dengan adminId baru
      await prisma.shop.update({
        where: { id: Number(shopId) },
        data: { adminId: newAdmin.id }
      });

      // Catat di history
      await prisma.userHistory.create({
        data: {
          userId: newAdmin.id,
          description: `Superadmin '${request.user.name}' mendaftarkan '${newAdmin.name}' sebagai admin toko '${shop.name}'`
        }
      });

      return {
        id: newAdmin.id,
        username: newAdmin.username,
        name: newAdmin.name,
        role: newAdmin.role,
        shopId: null
      };
    });

    return result;
  } catch (e) {
    console.error('Error :', e);
    
    if (e instanceof ResponseError) {
      throw e;
    }
    
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      throw new ResponseError(400, "Kesalahan dalam permintaan database", {
        code: e.code,
        meta: e.meta,
        cause: e
      });
    }
    
    throw new ResponseError(500, "Gagal registrasi admin", {
      originalError: e.message,
      stack: e.stack
    });
  }
};

const registerShop = async (request) => {
  try{
    if (request.user.role !== 'superadmin') {
      throw new ResponseError(403, "Hanya superadmin yang dapat membuat admin");
    }

    const register = validate(registerShopValidation, request.body)

    const findExistingUser = await prismaClient.shop.count({
        where : {
          name : register.name
      }
    })

    if(findExistingUser === 1){
      throw new ResponseError(400, "Toko terdaftar")
    }

    const result = await prismaClient.shop.create({
        data : register,
        select : {
            name : true
        }
    })

    return result
  }catch(e){
    console.error('Error :', e);
    
    if (e instanceof ResponseError) {
      throw e;
    }
    
    if (e instanceof Prisma.PrismaClientKnownrequestError) {
      throw new ResponseError(400, "Kesalahan dalam permintaan database", {
        code: e.code,
        meta: e.meta,
        cause: e
      });
    }
    
    throw new ResponseError(500, "Gagal registrasi toko", {
      originalError: e.message,
      stack: e.stack
    });
  }
};

// ================================= LOGIN =================================
const loginSuperadmin = async (request) => {
  try {
    const loginrequest = validate(login, request.body);

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

    if (user.role !== "superadmin") {
      throw new ResponseError(403, "Akses hanya untuk superadmin");
    }

    // 1. Cari token existing (aktif/expired)
    const existingToken = await prismaClient.userToken.findFirst({
      where: { userId: user.id }
    });

    // 2. Generate token baru
    const newToken = uuid();

    // 3. Update atau Create
    if (existingToken) {
      // Update token yang ada (replace nilai lama)
      await prismaClient.userToken.update({
        where: { id: existingToken.id },
        data: {
          token: newToken, // Nilai token di-overwrite
          lastActive: new Date(),
          expiresIn: 7 * 24 * 60 * 60 // Reset expiry
        }
      });
    } else {
      // Buat baru jika belum ada
      await prismaClient.userToken.create({
        data: {
          userId: user.id,
          token: newToken,
          lastActive: new Date(),
          expiresIn: 7 * 24 * 60 * 60
        }
      });
    }

    return { token: newToken };
  } catch(e) {
console.error('Error :', e);
    
    if (e instanceof ResponseError) {
      throw e;
    }
    
    if (e instanceof Prisma.PrismaClientKnownrequestError) {
      throw new ResponseError(400, "Kesalahan dalam permintaan database", {
        code: e.code,
        meta: e.meta,
        cause: e
      });
    }
    
    throw new ResponseError(500, "Gagal login superadmin", {
      originalError: e.message,
      stack: e.stack
    });
  }
};

const loginSuperadminSilent = async (request) => {
  try {
    // 1. Ambil token dari header
    const authHeader = request.headers.authorization;
    if (!authHeader) throw new ResponseError(401, "Token tidak ditemukan");

    const token = authHeader.split(' ')[1]; // "Bearer <token>"

    // 2. Cek validitas token
    const userToken = await prismaClient.userToken.findUnique({
      where: { token },
      include: { user: true }
    });

    // 3. Validasi
    if (!userToken || !userToken.user.isActive) {
      throw new ResponseError(401, "Token tidak valid");
    }

    if (userToken.user.role !== "superadmin") {
      throw new ResponseError(403, "Akses hanya untuk superadmin");
    }

    // 4. Perpanjang masa aktif token
    await prismaClient.userToken.update({
      where: { token },
      data: { lastActive: new Date() }
    });

    // 5. Return pesan sukses saja
    return { 
      message: "Login sukses",
      status: "authenticated"
    };

  } catch(e) {
    console.error('Error :', e);
    
    if (e instanceof ResponseError) {
      throw e;
    }
    
    if (e instanceof Prisma.PrismaClientKnownrequestError) {
      throw new ResponseError(400, "Kesalahan dalam permintaan database", {
        code: e.code,
        meta: e.meta,
        cause: e
      });
    }
    
    throw new ResponseError(500, "Gagal login superadmin, mengalihkan ke login manual", {
      originalError: e.message,
      stack: e.stack
    });
  }
};

// ================================= GET ALL ================================= 
const getAllShop = async (request) => {
  try {
    if (request.user.role !== 'superadmin') {
      throw new ResponseError(403, "Hanya superadmin yang dapat membuat admin");
    }

    const search = request.query.search || "";

    const shops = await prismaClient.shop.findMany({
      where: {
        OR: [
          {
            name: {
              contains: search,
            },
          },
          {
            address: {
              contains: search,
            },
          },
        ],
      },
      select: {
        name: true,
        address: true,
        adminId: true,
        admin: {
          select: {
            name: true,
          },
        },
      },
    });

    // Format hasil sesuai kebutuhan
    const formattedShops = shops.map(shop => ({
      name: shop.name,
      address: shop.address,
      admin: shop.adminId 
        ? shop.admin.name 
        : "belum ada admin di toko ini",
    }));

    return formattedShops;
  } catch (e) {
    console.error('Error :', e);
    
    if (e instanceof ResponseError) {
      throw e;
    }
    
    if (e instanceof Prisma.PrismaClientKnownrequestError) {
      throw new ResponseError(400, "Kesalahan dalam permintaan database", {
        code: e.code,
        meta: e.meta,
        cause: e
      });
    }
    
    throw new ResponseError(500, "Gagal mengambil data toko", {
      originalError: e.message,
      stack: e.stack
    });
  }
};

// ================================= GET BY ID =================================
const getShopAdmin = async (request) => {
  try {
    if (request.user.role !== 'superadmin') {
      throw new ResponseError(403, "Hanya superadmin yang dapat membuat admin");
    }

    const shopId  = request.params.shopId;

    if (!shopId) {
      throw new ResponseError(400, "Shop ID tidak boleh kosong");
    }

    const shop = await prismaClient.shop.findUnique({
      where: { id: parseInt(shopId) },
      select: {
        id: true,
        name: true,
        address: true,
        admin: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            phone: true,
            role: true
          },
        },
      },
    });

    if (!shop) {
      throw new ResponseError(404, "Toko tidak ditemukan");
    }

    return shop;
  } catch (e) {
    console.error('Error :', e);
    
    if (e instanceof ResponseError) {
      throw e;
    }
    
    if (e instanceof Prisma.PrismaClientKnownrequestError) {
      throw new ResponseError(400, "Kesalahan dalam permintaan database", {
        code: e.code,
        meta: e.meta,
        cause: e
      });
    }
    
    throw new ResponseError(500, "Gagal mengambil data admin", {
      originalError: e.message,
      stack: e.stack
    });
  }
};

const getStaffGudang = async (request) => {
  try {
    const shopId = request.params.shopId;

    if (!shopId) {
      throw new ResponseError(400, "Shop ID tidak boleh kosong");
    }

    const staffs = await prismaClient.user.findMany({
      where: {
        shopId: parseInt(shopId),
        role: "gudang"
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        email: true,
        phone: true,
      }
    });

    return {
      shopId: parseInt(shopId),
      staffs
    };
  } catch (e) {
    console.error('Error :', e);
    
    if (e instanceof ResponseError) {
      throw e;
    }
    
    if (e instanceof Prisma.PrismaClientKnownrequestError) {
      throw new ResponseError(400, "Kesalahan dalam permintaan database", {
        code: e.code,
        meta: e.meta,
        cause: e
      });
    }
    
    throw new ResponseError(500, "Gagal mengambil data staff gudang", {
      originalError: e.message,
      stack: e.stack
    });
  }
};

const getStaffKasir = async (request) => {
  try {
    const shopId = request.params.shopId;

    if (!shopId) {
      throw new ResponseError(400, "Shop ID tidak boleh kosong");
    }

    const staffs = await prismaClient.user.findMany({
      where: {
        shopId: parseInt(shopId),
        role: "kasir"
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        email: true,
        phone: true,
      }
    });

    return {
      shopId: parseInt(shopId),
      staffs
    };
  } catch (e) {
    console.error('Error :', e);
    
    if (e instanceof ResponseError) {
      throw e;
    }
    
    if (e instanceof Prisma.PrismaClientKnownrequestError) {
      throw new ResponseError(400, "Kesalahan dalam permintaan database", {
        code: e.code,
        meta: e.meta,
        cause: e
      });
    }
    
    throw new ResponseError(500, "Gagal mengambil data staff kasir", {
      originalError: e.message,
      stack: e.stack
    });
  }
};

const getShopProducts = async (request) => {
  try {
    const shopId = request.params.shopId;
    const { search = "", minPrice, maxPrice } = request.query;

    // Validasi
    if (!shopId) {
      throw new ResponseError(400, "Shop ID tidak boleh kosong");
    }

    const parsedShopId = parseInt(shopId);
    if (isNaN(parsedShopId)) {
      throw new ResponseError(400, "Shop ID harus berupa angka");
    }

    // Bangun filter
    const filters = {
      shopId: parsedShopId,
      product: {
        name: {
          contains: search,
        },
        // Tambahkan filter harga jika ada
        ...(minPrice || maxPrice ? {
          sellPrice: {
            ...(minPrice ? { gte: new Prisma.Decimal(minPrice) } : {}),
            ...(maxPrice ? { lte: new Prisma.Decimal(maxPrice) } : {})
          }
        } : {})
      },
    };

    const shopProducts = await prismaClient.shopProduct.findMany({
      where: filters,
      select: {
        stock: true,
        product: {
          select: {
            id: true,
            name: true,
            buyPrice: true,
            sellPrice: true,
            imagePath: true,
            barcode: true,
            isActive: true,
            distributor: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                ecommerceLink: true,
                imagePath: true,
                address: true
              }
            },
            type: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        product: {
          name: 'asc'
        }
      }
    });

    // Transformasi data
    const products = shopProducts.map((item) => ({
      ...item.product,
      stock: item.stock,
      // Konversi Decimal ke number jika diperlukan
      buyPrice: item.product.buyPrice.toNumber(),
      sellPrice: item.product.sellPrice.toNumber(),
      // Distributor dan Type sudah termasuk dalam select
      distributor: item.product.distributor,
      type: item.product.type
    }));

    return {
      shopId: parsedShopId,
      products,
      count: products.length
    };
  } catch (e) {
    console.error('Error :', e);
    
    if (e instanceof ResponseError) {
      throw e;
    }
    
    if (e instanceof Prisma.PrismaClientKnownrequestError) {
      throw new ResponseError(400, "Kesalahan dalam permintaan database", {
        code: e.code,
        meta: e.meta,
        cause: e
      });
    }
    
    throw new ResponseError(500, "Gagal mengambil data produk toko", {
      originalError: e.message,
      stack: e.stack
    });
  }
};
                
// ================================= UPDATE =================================
const updateSuperadminProfile = async (request) => {
  try {
    const superadminId = request.user.id;

    if (request.user.role !== "superadmin") {
      throw new ResponseError(403, "Hanya superadmin yang dapat mengubah profilnya");
    }

    const updaterequest = validate(updateSuperadminValidation, request.body);

    const superadmin = await prismaClient.user.findFirst({
      where: {
        id: superadminId,
        role: "superadmin",
        isActive: true,
      },
    });

    if (!superadmin) {
      throw new ResponseError(404, "Superadmin tidak ditemukan");
    }

    const changes = [];
    const fields = ['name', 'email', 'phone', 'nik', 'imagePath'];

    for (const field of fields) {
      const oldValue = superadmin[field];
      const newValue = updaterequest[field];

      if (typeof newValue !== 'undefined' && newValue !== oldValue) {
        changes.push(`${field} dari '${oldValue ?? "-"}' ke '${newValue ?? "-"}'`);
      }
    }

    if (changes.length === 0) {
      throw new ResponseError(400, "Tidak ada perubahan yang dilakukan");
    }

    const updated = await prismaClient.user.update({
      where: { id: superadminId },
      data: updaterequest,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        phone: true,
        email: true,
        nik: true,
        imagePath: true,
        isActive: true,
        shopId: true,
      },
    });

    await prismaClient.userHistory.create({
      data: {
        userId: superadminId,
        description: `Superadmin '${request.user.username}' mengubah ${changes.join(', ')}`,
      },
    });

    return updated;
  } catch (e) {
    console.error('Error :', e);
    
    if (e instanceof ResponseError) {
      throw e;
    }
    
    if (e instanceof Prisma.PrismaClientKnownrequestError) {
      throw new ResponseError(400, "Kesalahan dalam permintaan database", {
        code: e.code,
        meta: e.meta,
        cause: e
      });
    }
    
    throw new ResponseError(500, "Gagal update profil superadmin", {
      originalError: e.message,
      stack: e.stack
    });
  }
};

const updateAdmin = async (request) => {
  try{
    const staffId = parseInt(request.params.adminId);
    if (isNaN(staffId)) {
      throw new ResponseError(400, "ID admin tidak valid");
    }

    const user = request.user;
    if (user.role !== "superadmin") {
      throw new ResponseError(403, "Hanya superadmin yang dapat mengubah data staff");
    }

    const updaterequest = validate(updateAdminValidation, request.body);

    const staff = await prismaClient.user.findFirst({
      where: {
        id: staffId,
        role: { in: ["admin"] },
        isActive: true
      }
    });

    if (!staff) {
      throw new ResponseError(404, "Staff tidak ditemukan");
    }

    const changes = [];
    const fields = ['name', 'email', 'phone', 'nik', 'imagePath'];

    for (const field of fields) {
      const oldValue = staff[field];
      const newValue = updaterequest[field];

      if (
        typeof newValue !== 'undefined' &&
        newValue !== oldValue              
      ) {
        changes.push(
          `${field} dari '${oldValue ?? "-"}' ke '${newValue ?? "-"}'`
        );
      }
    }

    if (changes.length === 0) {
      throw new ResponseError(400, "Tidak ada perubahan yang dilakukan");
    }

    const updated = await prismaClient.user.update({
      where: { id: staffId },
      data: updaterequest,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        phone: true,
        email: true,
        nik: true,
        imagePath: true,
        isActive: true, 
        shopId: true
      }
    });

    await prismaClient.userHistory.create({
      data: {
        userId: staffId,
        description: `Superadmin '${request.user.name}' mengubah ${changes.join(', ')}`
      }
    });

    return updated;
  }catch(e){
    console.error('Error :', e);
    
    if (e instanceof ResponseError) {
      throw e;
    }
    
    if (e instanceof Prisma.PrismaClientKnownrequestError) {
      throw new ResponseError(400, "Kesalahan dalam permintaan database", {
        code: e.code,
        meta: e.meta,
        cause: e
      });
    }
    
    throw new ResponseError(500, "Gagal update admin", {
      originalError: e.message,
      stack: e.stack
    });
  }
};

const updateStaff = async (request) => {
  try{
    const staffId = parseInt(request.params.staffId);
    if (isNaN(staffId)) {
      throw new ResponseError(400, "ID staff tidak valid");
    }

    const user = request.user;
    if (user.role !== 'superadmin') {
      throw new ResponseError(403, "Hanya superadmin yang dapat mengubah data staff");
    }

    const updaterequest = validate(updateStaffValidation, request.body);

    const staff = await prismaClient.user.findFirst({
      where: {
        id: staffId,
        role: { in: ['kasir', 'gudang'] },
        isActive: true
      }
    });

    if (!staff) {
      throw new ResponseError(404, "Staff tidak ditemukan");
    }

    const changes = [];
    const fields = ['name', 'email', 'phone', 'nik', 'imagePath', 'role'];

    for (const field of fields) {
      const oldValue = staff[field];
      const newValue = updaterequest[field];

      if (
        typeof newValue !== 'undefined' &&
        newValue !== oldValue              
      ) {
        changes.push(
          `${field} dari '${oldValue ?? "-"}' ke '${newValue ?? "-"}'`
        );
      }
    }

    if (changes.length === 0) {
      throw new ResponseError(400, "Tidak ada perubahan yang dilakukan");
    }

    const updated = await prismaClient.user.update({
      where: { id: staffId },
      data: updaterequest,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        phone: true,
        email: true,
        nik: true,
        imagePath: true,
        isActive: true, 
        shopId: true
      }
    });

    await prismaClient.userHistory.create({
      data: {
        userId: staffId,
        description: `Superadmin '${request.user.name}' mengubah ${changes.join(', ')}`
      }
    });

    return updated;
  }catch(e){
    console.error('Error :', e);
    
    if (e instanceof ResponseError) {
      throw e;
    }
    
    if (e instanceof Prisma.PrismaClientKnownrequestError) {
      throw new ResponseError(400, "Kesalahan dalam permintaan database", {
        code: e.code,
        meta: e.meta,
        cause: e
      });
    }
    
    throw new ResponseError(500, "Gagal update staff", {
      originalError: e.message,
      stack: e.stack
    });
  }
};

// ================================= SOFT DELETE =================================
const softDeleteAdmin = async (request) => { 
  try {
    const staffId = parseInt(request.params.adminId); 
    if (isNaN(staffId)) {
      throw new ResponseError(400, "ID admin tidak valid");
    }

    const user = request.user;
    if (user.role !== 'superadmin') {
      throw new ResponseError(403, "Hanya superadmin yang dapat menonaktifkan admin");
    }

    // Ambil data admin dulu
    const staff = await prismaClient.user.findFirst({
      where: {
        id: staffId,
        role: "admin",
        isActive: true
      }
    });

    if (!staff) {
      throw new ResponseError(404, "Admin tidak ditemukan atau sudah tidak aktif");
    }

    // Hapus relasi admin dari toko
    await prismaClient.shop.updateMany({
      where: { adminId: staffId },
      data: { adminId: request.user.id }
    });

    // Nonaktifkan user & hapus relasi tokonya
    await prismaClient.user.update({
      where: { id: staffId },
      data: {
        isActive: false,
        shopId: null
      }
    });

    // Catat histori
    await prismaClient.userHistory.create({
      data: {
        userId: staffId,
        description: `Admin dengan nama '${staff.name}' dinonaktifkan oleh superadmin '${request.user.name}'`,
      }
    });

    return { message: "Admin berhasil dinonaktifkan" };
  } catch (e) {
    console.error('Error :', e);
    
    if (e instanceof ResponseError) {
      throw e;
    }
    
    if (e instanceof Prisma.PrismaClientKnownrequestError) {
      throw new ResponseError(400, "Kesalahan dalam permintaan database", {
        code: e.code,
        meta: e.meta,
        cause: e
      });
    }
    
    throw new ResponseError(500, "Gagal menonaktifkan admin", {
      originalError: e.message,
      stack: e.stack
    });
  }
};

const softDeleteStaff = async (request) => {
  try{
    const staffId = parseInt(request.params.staffId);
    if (isNaN(staffId)) {
      throw new ResponseError(400, "ID staff tidak valid");
    }

    const user = request.user;
    if (user.role !== 'superadmin') {
      throw new ResponseError(403, "Hanya superadmin yang dapat menonaktifkan staff");
    }

    const staff = await prismaClient.user.findFirst({
      where: {
        id: staffId,
        role: { in: ['kasir', 'gudang'] },
        isActive: true
      }
    });

    if (!staff) {
      throw new ResponseError(404, "Staff tidak ditemukan atau sudah tidak aktif");
    }

    await prismaClient.user.update({
      where: { id: staffId },
      data: { isActive: false, shopId: null }
    });

    await prismaClient.userHistory.create({
      data: {
        userId: staffId,
        description: `Staff dengan nama '${staff.name}' dinonaktifkan oleh superadmin '${request.user.name}'`,
      }
    });

    return { message: "Staff berhasil dinonaktifkan" };
  }catch(e){
    console.error('Error :', e);
    
    if (e instanceof ResponseError) {
      throw e;
    }
    
    if (e instanceof Prisma.PrismaClientKnownrequestError) {
      throw new ResponseError(400, "Kesalahan dalam permintaan database", {
        code: e.code,
        meta: e.meta,
        cause: e
      });
    }
    
    throw new ResponseError(500, "Gagal menonaktifkan staff", {
      originalError: e.message,
      stack: e.stack
    });
  }
};

// ================================= TRANSFER =================================
const transferAdminToShop = async (request) => {
  try {
    const user = request.user;
    const { adminId, targetShopId } = request.body;

    if (user.role !== 'superadmin') {
      throw new ResponseError(403, "Hanya superadmin yang dapat mentransfer admin");
    }

    const parsedAdminId = parseInt(adminId);
    const parsedTargetShopId = parseInt(targetShopId);
    if (isNaN(parsedAdminId) || isNaN(parsedTargetShopId)) {
      throw new ResponseError(400, "adminId dan targetShopId harus berupa angka");
    }

    // Cari admin yang akan dipindahkan
    const adminToTransfer = await prismaClient.user.findFirst({
      where: {
        id: parsedAdminId,
        role: "admin",
        isActive: true
      }
    });

    if (!adminToTransfer) {
      throw new ResponseError(404, "Admin yang akan dipindah tidak ditemukan");
    }

    // Cari target shop dan adminnya (jika ada)
    const targetShop = await prismaClient.shop.findUnique({
      where: { id: parsedTargetShopId },
      include: {
        admin: true
      }
    });

    if (!targetShop) {
      throw new ResponseError(404, "Toko tujuan tidak ditemukan");
    }

    // Cari shop asal admin yang akan dipindahkan
    const sourceShop = await prismaClient.shop.findFirst({
      where: {
        adminId: parsedAdminId
      }
    });

    // Jika target shop sudah memiliki admin yang berbeda
    if (targetShop.admin && targetShop.admin.id !== parsedAdminId) {
      const previousAdmin = targetShop.admin;
      
      // Jika ada shop asal, pindahkan previousAdmin ke shop asal
      if (sourceShop) {
        await prismaClient.shop.update({
          where: { id: sourceShop.id },
          data: { adminId: previousAdmin.id }
        });
      } else {
        // Jika tidak ada shop asal, lepas previousAdmin dari shop manapun
        await prismaClient.shop.updateMany({
          where: { adminId: previousAdmin.id },
          data: { adminId: null }
        });
      }

      await prismaClient.userHistory.create({
        data: {
          userId: previousAdmin.id,
          description: `Superadmin '${user.name}' memindahkan admin '${previousAdmin.name}' ke toko '${sourceShop?.name || "(tidak ada toko)"}'`
        }
      });
    } else if (sourceShop) {
      // Jika tidak ada admin di target shop atau admin yang sama, kosongkan shop asal
      await prismaClient.shop.update({
        where: { id: sourceShop.id },
        data: { adminId: null }
      });
    }

    // Update target shop dengan admin baru
    await prismaClient.shop.update({
      where: { id: parsedTargetShopId },
      data: { adminId: parsedAdminId }
    });

    await prismaClient.userHistory.create({
      data: {
        userId: parsedAdminId,
        description: `Superadmin '${user.name}' memindahkan admin '${adminToTransfer.name}' ke toko '${targetShop.name}'`
      }
    });

    return { message: `Admin '${adminToTransfer.name}' berhasil dipindahkan ke toko '${targetShop.name}'` };
  } catch (e) {
    console.error('Error :', e);
    
    if (e instanceof ResponseError) {
      throw e;
    }
    
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      throw new ResponseError(400, "Kesalahan dalam permintaan database", {
        code: e.code,
        meta: e.meta,
        cause: e
      });
    }
    
    throw new ResponseError(500, "Gagal transfer admin", {
      originalError: e.message,
      stack: e.stack
    });
  }
};

const transferMultipleStaff = async (request) => {
  try {
    const { staffIds, targetShopId } = request.body;
    const requester = request.user;

    if (requester.role !== "superadmin") {
      throw new ResponseError(403, "Hanya superadmin yang dapat mentransfer staff");
    }

    if (!Array.isArray(staffIds) || staffIds.length === 0 || isNaN(parseInt(targetShopId))) {
      throw new ResponseError(400, "Data tidak valid");
    }

    const parsedStaffIds = staffIds.map(id => parseInt(id)).filter(id => !isNaN(id));
    const parsedTargetShopId = parseInt(targetShopId);

    // Verifikasi toko tujuan
    const targetShop = await prismaClient.shop.findUnique({
      where: { id: parsedTargetShopId },
      include: { admin: true }
    });

    if (!targetShop) {
      throw new ResponseError(404, "Toko tujuan tidak ditemukan");
    }

    // Dapatkan staff yang valid
    const validStaff = await prismaClient.user.findMany({
      where: {
        id: { in: parsedStaffIds },
        isActive: true,
        role: { in: ["kasir", "gudang"] } // Hanya transfer staff dengan role ini
      }
    });

    if (validStaff.length === 0) {
      throw new ResponseError(404, "Tidak ada staff valid ditemukan");
    }

    const updates = [];

    for (const staff of validStaff) {
      // Skip jika staff sudah di toko yang sama
      if (staff.shopId === parsedTargetShopId) continue;

      updates.push(
        prismaClient.user.update({
          where: { id: staff.id },
          data: {
            shopId: parsedTargetShopId // Hanya update shopId
          }
        })
      );

      updates.push(
        prismaClient.userHistory.create({
          data: {
            userId: staff.id,
            description: `Staff '${staff.name}' dipindahkan ke toko '${targetShop.name}' oleh superadmin '${requester.name}'`
          }
        })
      );
    }

    if (updates.length === 0) {
      return { message: "Semua staff sudah berada di toko tujuan" };
    }

    await prismaClient.$transaction(updates);

    return { 
      message: `${updates.length / 2} staff berhasil ditransfer ke toko '${targetShop.name}'`,
      targetShopAdmin: targetShop.admin ? `Admin toko: ${targetShop.admin.name}` : 'Toko belum memiliki admin'
    };
  } catch (e) {
    console.error('Error :', e);
    
    if (e instanceof ResponseError) {
      throw e;
    }
    
    if (e instanceof Prisma.PrismaClientKnownrequestError) {
      throw new ResponseError(400, "Kesalahan dalam permintaan database", {
        code: e.code,
        meta: e.meta,
        cause: e
      });
    }
    
    throw new ResponseError(500, "Gagal transfer staff", {
      originalError: e.message,
      stack: e.stack
    });
  }
};

export default{
  registerSuperadmin, 
  registerAdmin,
  loginSuperadmin, 
  getAllShop,
  getShopAdmin,
  getStaffGudang,
  getStaffKasir, 
  getShopProducts,
  updateSuperadminProfile,
  updateAdmin, 
  updateStaff,
  softDeleteAdmin,
  softDeleteStaff,
  transferAdminToShop,
  transferMultipleStaff,
  registerShop,
  loginSuperadminSilent
}