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
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal registrasi admin", e)
  }
}

const registerAdmin = async (request) => {
  try {
    const register = validate(registerAdminValidation, request.body);
    const shopId = request.params.shopId; // Perbaikan di sini

    // 1. Validasi shop terlebih dahulu
    const shop = await prismaClient.shop.findUnique({
      where: { id: Number(shopId) }, // Pastikan konversi ke Number
      select: { adminId: true }
    });

    if (!shop) {
      throw new ResponseError(404, "Toko tidak ditemukan");
    }

    if (shop.adminId) {
      throw new ResponseError(400, "Toko ini sudah memiliki admin");
    }

    // 2. Cek username availability
    const existingUser = await prismaClient.user.count({
      where: { username: register.username }
    });

    if (existingUser > 0) {
      throw new ResponseError(400, "Username sudah terdaftar");
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(register.password, 10);

    // 4. Buat admin dalam transaction
    const result = await prismaClient.$transaction(async (prisma) => {
      // Buat user admin (tanpa shopId karena relasi dari shop.adminId)
      const newAdmin = await prisma.user.create({
        data: {
          username: register.username,
          password: hashedPassword,
          name: register.name,
          email: register.email,
          phone: register.phone,
          nik: register.nik,
          imagePath: register.imagePath,
          role: "admin"
          // shopId dihapus karena relasi cukup dari shop.adminId
        }
      });

      // Update shop dengan adminId baru
      await prisma.shop.update({
        where: { id: Number(shopId) },
        data: { adminId: newAdmin.id }
      });

      return {
        id: newAdmin.id,
        username: newAdmin.username,
        name: newAdmin.name,
        role: newAdmin.role,
        shopId: Number(shopId)
      };
    });

    return result;
  } catch (e) {
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal registrasi admin", e.message); // Tambahkan e.message untuk detail error
  }
};

const registerShop = async (req) => {
  try{
    const register = validate(registerShopValidation, req.body)

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
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal registrasi toko", e)
  }
}

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

    // Cek token aktif (30 menit terakhir)
    const existingToken = await prismaClient.userToken.findFirst({
      where: {
        userId: user.id,
        lastActive: { gt: new Date(Date.now() - 30 * 60 * 1000) }
      }
    });

    let token;
    if (existingToken) {
      // Pakai token yang ada
      token = existingToken.token;
    } else {
      // Buat token baru
      token = uuid();
      await prismaClient.userToken.create({
        data: {
          userId: user.id,
          token: token,
          lastActive: new Date(),
          expiresIn: 7 * 24 * 60 * 60 // 7 hari
        }
      });
    }

    return { token };
  } catch(e) {
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Login gagal", e);
  }
};

// ================================= GET ALL ================================= 
const getAllShop = async (request) => {
  try {
    const search = request.query.search || "";

    const shops = await prismaClient.shop.findMany({
      where: {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            address: {
              contains: search,
              mode: "insensitive",
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
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal mengambil data toko");
  }
};

// ================================= GET BY ID =================================
const getShopAdmin = async (request) => {
  try {
    const { shopId } = request.params;

    if (!shopId) {
      throw new ResponseError(400, "Shop ID tidak boleh kosong");
    }

    const shop = await prisma.shop.findUnique({
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
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal mengambil admin toko");
  }
};

const getShopStaffs = async (request) => {
  try {
    const { shopId } = request.params;

    if (!shopId) {
      throw new ResponseError(400, "Shop ID tidak boleh kosong");
    }

    const staffs = await prisma.user.findMany({
      where: {
        shopId: parseInt(shopId),
        role: { not: "admin" }
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
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal mengambil data pegawai toko");
  }
};

const getShopProducts = async (request) => {
  try {
    const { shopId } = request.params;
    const { search = "", minPrice, maxPrice } = request.query;

    if (!shopId) {
      throw new ResponseError(400, "Shop ID tidak boleh kosong");
    }

    const filters = {
      shopId: parseInt(shopId),
      product: {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
    };

    if (minPrice || maxPrice) {
      filters.product.price = {};
      if (minPrice) filters.product.price.gte = parseFloat(minPrice);
      if (maxPrice) filters.product.price.lte = parseFloat(maxPrice);
    }

    const shopProducts = await prisma.shopProduct.findMany({
      where: filters,
      select: {
        stock: true,
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            image: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      }
    });

    const products = shopProducts.map((item) => ({
      ...item.product,
      stock: item.stock
    }));

    return {
      shopId: parseInt(shopId),
      products
    };
  } catch (e) {
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal mengambil data produk toko");
  }
};
                
// ================================= UPDATE =================================
const updateSuperadminProfile = async (req) => {
  try {
    const superadminId = req.user.id;

    if (req.user.role !== "superadmin") {
      throw new ResponseError(403, "Hanya superadmin yang dapat mengubah profilnya");
    }

    const updateRequest = validate(updateSuperadminValidation, req.body);

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
    const fields = ['name', 'email', 'phone', 'nik', 'photoPath'];

    for (const field of fields) {
      const oldValue = superadmin[field];
      const newValue = updateRequest[field];

      if (typeof newValue !== 'undefined' && newValue !== oldValue) {
        changes.push(`${field} dari '${oldValue ?? "-"}' ke '${newValue ?? "-"}'`);
      }
    }

    if (changes.length === 0) {
      throw new ResponseError(400, "Tidak ada perubahan yang dilakukan");
    }

    const updated = await prismaClient.user.update({
      where: { id: superadminId },
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
        userId: superadminId,
        description: `Superadmin '${req.user.username}' mengubah ${changes.join(', ')}`,
      },
    });

    return updated;
  } catch (e) {
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal mengupdate profil superadmin", e);
  }
};

const updateAdmin = async (req) => {
  try{
    const staffId = parseInt(req.params);
    if (isNaN(staffId)) {
      throw new ResponseError(400, "ID admin tidak valid");
    }

    const user = req.user;
    if (user.role !== "superadmin") {
      throw new ResponseError(403, "Hanya superadmin yang dapat mengubah data staff");
    }

    const updateRequest = validate(updateAdminValidation, req.body);

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
    const fields = ['name', 'email', 'phone', 'nik', 'photoPath'];

    for (const field of fields) {
      const oldValue = staff[field];
      const newValue = updateRequest[field];

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
        shopId: true
      }
    });

    await prismaClient.userHistory.create({
      data: {
        userId: staffId,
        description: `Superadmin '${user.name}' mengubah ${changes.join(', ')}`
      }
    });

    return updated;
  }catch(e){
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal mengupdate admin", e)
  }
};

const updateStaff = async (req) => {
  try{
    const staffId = parseInt(req.params);
    if (isNaN(staffId)) {
      throw new ResponseError(400, "ID staff tidak valid");
    }

    const user = req.user;
    if (user.role !== 'superadmin') {
      throw new ResponseError(403, "Hanya superadmin yang dapat mengubah data staff");
    }

    const updateRequest = validate(updateStaffValidation, req.body);

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
    const fields = ['name', 'email', 'phone', 'nik', 'photoPath'];

    for (const field of fields) {
      const oldValue = staff[field];
      const newValue = updateRequest[field];

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
        shopId: true
      }
    });

    await prismaClient.userHistory.create({
      data: {
        userId: staffId,
        description: `Superadmin '${user.name}' mengubah ${changes.join(', ')}`
      }
    });

    return updated;
  }catch(e){
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal mengupdate staff", e)
  }
};

// ================================= SOFT DELETE =================================
const softDeleteAdmin = async (req) => { 
  try {
    const staffId = parseInt(req.params);
    if (isNaN(staffId)) {
      throw new ResponseError(400, "ID admin tidak valid");
    }

    const user = req.user;
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
      data: { adminId: null }
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
        description: `Admin dengan nama '${staff.name}' dinonaktifkan oleh superadmin '${user.name}'`,
      }
    });

    return { message: "Admin berhasil dinonaktifkan" };
  } catch (e) {
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal menonaktifkan admin", e);
  }
};

const softDeleteStaff = async (req) => {
  try{
    const staffId = parseInt(req.params);
    if (isNaN(staffId)) {
      throw new ResponseError(400, "ID staff tidak valid");
    }

    const user = req.user;
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
        description: `Staff dengan nama '${staff.name}' dinonaktifkan oleh superadmin '${user.name}'`,
      }
    });

    return { message: "Staff berhasil dinonaktifkan" };
  }catch(e){
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal menonaktifkan staff", e)
  }
};

// ================================= TRANSFER =================================
const transferAdminToShop = async (req) => {
  try {
    const user = req.user;
    const { adminId, targetShopId } = req.body;

    if (user.role !== 'superadmin') {
      throw new ResponseError(403, "Hanya superadmin yang dapat mentransfer admin");
    }

    const parsedAdminId = parseInt(adminId);
    const parsedTargetShopId = parseInt(targetShopId);
    if (isNaN(parsedAdminId) || isNaN(parsedTargetShopId)) {
      throw new ResponseError(400, "adminId dan targetShopId harus berupa angka");
    }

    const admin = await prismaClient.user.findFirst({
      where: {
        id: parsedAdminId,
        role: "admin",
        isActive: true
      }
    });

    if (!admin) {
      throw new ResponseError(404, "Admin yang akan dipindah tidak ditemukan");
    }

    const targetShop = await prismaClient.shop.findUnique({
      where: { id: parsedTargetShopId },
      include: {
        admin: true
      }
    });

    if (!targetShop) {
      throw new ResponseError(404, "Toko tujuan tidak ditemukan");
    }

    const currentShopId = admin.shopId;

    // CASE 1: targetShop sudah punya admin (swap)
    if (targetShop.admin && targetShop.admin.id !== admin.id) {
      const previousAdmin = targetShop.admin;

      // Update toko asal admin A, jika ada
      if (currentShopId) {
        await prismaClient.shop.update({
          where: { id: currentShopId },
          data: {
            adminId: previousAdmin.id
          }
        });
      }

      // Update shopId admin yang lama (B)
      await prismaClient.user.update({
        where: { id: previousAdmin.id },
        data: {
          shopId: currentShopId || null
        }
      });

      await prismaClient.userHistory.create({
        data: {
          userId: previousAdmin.id,
          description: `Superadmin '${user.name}' memindahkan admin '${previousAdmin.name}' ke toko asal '${currentShopId ?? "-"}' sebagai bagian dari transfer`
        }
      });
    } else {
      // CASE 2: jika toko tujuan kosong, lepas admin lama dari toko asal
      if (currentShopId) {
        await prismaClient.shop.update({
          where: { id: currentShopId },
          data: { adminId: null }
        });
      }
    }

    // Update targetShop dengan admin baru
    await prismaClient.shop.update({
      where: { id: parsedTargetShopId },
      data: {
        adminId: admin.id
      }
    });

    // Update admin A dengan shop baru
    await prismaClient.user.update({
      where: { id: admin.id },
      data: {
        shopId: parsedTargetShopId
      }
    });

    await prismaClient.userHistory.create({
      data: {
        userId: admin.id,
        description: `Superadmin '${user.name}' memindahkan '${admin.name}' ke toko '${targetShop.name}'`
      }
    });

    return { message: `Admin '${admin.name}' berhasil dipindahkan ke toko '${targetShop.name}'` };
  } catch (e) {
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal mentransfer admin", e);
  }
};

const transferMultipleStaff = async (req) => {
  try {
    const { staffIds, targetShopId } = req.body;
    const requester = req.user;

    if (requester.role !== "superadmin") {
      throw new ResponseError(403, "Hanya superadmin yang dapat mentransfer staff");
    }

    if (!Array.isArray(staffIds) || staffIds.length === 0 || isNaN(parseInt(targetShopId))) {
      throw new ResponseError(400, "Data tidak valid");
    }

    const parsedStaffIds = staffIds.map(id => parseInt(id)).filter(id => !isNaN(id));
    const parsedTargetShopId = parseInt(targetShopId);

    // Pastikan toko tujuan valid dan punya admin
    const targetShop = await prismaClient.shop.findUnique({
      where: { id: parsedTargetShopId },
      include: { admin: true }
    });

    if (!targetShop || !targetShop.admin) {
      throw new ResponseError(400, "Toko tidak ditemukan atau belum memiliki admin");
    }

    const validStaff = await prismaClient.user.findMany({
      where: {
        id: { in: parsedStaffIds },
        isActive: true,
        role: { in: ["kasir", "gudang"] }
      }
    });

    if (validStaff.length === 0) {
      throw new ResponseError(404, "Tidak ada staff valid ditemukan");
    }

    const updates = [];

    for (const staff of validStaff) {
      // Skip jika sudah di toko dan admin yang sama
      if (staff.shopId === parsedTargetShopId && staff.adminId === targetShop.admin.id) continue;

      updates.push(prismaClient.user.update({
        where: { id: staff.id },
        data: {
          shopId: parsedTargetShopId,
          adminId: targetShop.admin.id
        }
      }));

      updates.push(prismaClient.userHistory.create({
        data: {
          userId: staff.id,
          description: `Staff '${staff.name}' dipindahkan ke toko '${targetShop.name}' di bawah admin '${targetShop.admin.name}' oleh superadmin '${requester.name}'`
        }
      }));
    }

    if (updates.length === 0) {
      return { message: "Semua staff sudah berada di toko tujuan" };
    }

    await prismaClient.$transaction(updates);

    return { message: `${updates.length / 2} staff berhasil ditransfer ke toko '${targetShop.name}'` };
  } catch (e) {
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal mentransfer staff", e);
  }
};

export default{
  registerSuperadmin, 
  registerAdmin,
  loginSuperadmin, 
  getAllShop,
  getShopAdmin,
  getShopStaffs, 
  getShopProducts,
  updateSuperadminProfile,
  updateAdmin, 
  updateStaff,
  softDeleteAdmin,
  softDeleteStaff,
  transferAdminToShop,
  transferMultipleStaff,
  registerShop
}