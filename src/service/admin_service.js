import bcrypt from "bcrypt"
import {v4 as uuid} from "uuid";
import { prismaClient } from "../application/database.js"
import { ResponseError } from "../error/response_error.js"
import { validate } from "../validation/validation.js"
import { registerStaff, updateStaffValidation, login, updateAdminValidation, resetPasswordValidation } from "../validation/admin_validation.js";

// ================================= REGISTRASI =================================
const registerGudang = async (request) => {
  try{
     const register = validate(registerStaff, request.body);

    const findExistingUser = await prismaClient.user.count({
        where: { username: register.username }
    });

    if (findExistingUser === 1) {
        throw new ResponseError(400, "Username sudah terdaftar");
    }

    register.password = await bcrypt.hash(register.password, 10);

    register.shopId = request.user.shopId;

    register.role = "gudang";

    const result = await prismaClient.user.create({
        data: register,
        select: {
            username: true,
            name: true,
            role: true,
            shopId : true
        }
    });

    return result;
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
    
    throw new ResponseError(500, "Gagal registrasi staff gudang", {
      originalError: e.message,
      stack: e.stack
    });
  }    
};

const registerKasir = async (request) => { // HANYA WEBSITE ADMIN
  try{
    const register = validate(registerStaff, request.body);

    const findExistingUser = await prismaClient.user.count({
        where: { username: register.username }
    });

    if (findExistingUser === 1) {
        throw new ResponseError(400, "Username sudah terdaftar");
    }

    register.password = await bcrypt.hash(register.password, 10);

    register.shopId = request.user.shopId;

    register.role = "kasir";

    const result = await prismaClient.user.create({
        data: register,
        select: {
            username: true,
            name: true,
            role: true,
            shopId: true
        }
    });

    return result;
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
    
    throw new ResponseError(500, "Gagal registrasi staff kasir", {
      originalError: e.message,
      stack: e.stack
    });
  }
};

// ================================= LOGIN =================================
const loginAdmin = async (request) => { // HANYA WEBSITE ADMIN
  try{
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
      throw new ResponseError(401, "User sudah tidak aktif");
    }

    const passwordIsValid = await bcrypt.compare(loginrequest.password, user.password);
    if (!passwordIsValid) {
      throw new ResponseError(401, "Username atau password salah");
    }

    if (user.role !== "admin") {
      throw new ResponseError(403, "Akses hanya untuk admin");
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
    
    throw new ResponseError(500, "Gagal login admin", {
      originalError: e.message,
      stack: e.stack
    });
  }
};

// ================================= GET ALL ================================= 
const getGudangStaff = async (request) => {
  try {
    const { 
      search = '',
      roles = ['gudang'], // default value
      isActive = true,
      page = 1,
      pageSize = 10,
      sortBy = 'name',
      sortOrder = 'asc'
    } = request.query;

    // Dapatkan adminId dari user yang sedang login
    const adminId = request.user.id;
    if (!adminId) {
      throw new ResponseError(400, "User ID is required");
    }

    // Cari shop berdasarkan adminId
    const shop = await prismaClient.shop.findFirst({
      where: {
        adminId: adminId
      },
      select: {
        id: true,
        name: true
      }
    });

    if (!shop) {
      throw new ResponseError(404, "Shop not found for this admin");
    }

    // Format roles ke array jika berupa string
    const rolesArray = Array.isArray(roles) ? roles : [roles].filter(Boolean);

    const where = {
      role: { in: rolesArray },
      isActive: isActive === 'true' || isActive === true,
      shopId: shop.id // Filter staff berdasarkan shopId yang ditemukan
    };

    // Tambahkan filter search jika ada
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { nik: { contains: search, mode: 'insensitive' } }
      ];
    }

    const staff = await prismaClient.user.findMany({
      where,
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
        shop: {
          select: {
            name: true
          }
        }
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        [sortBy]: sortOrder
      }
    });

    const totalStaff = await prismaClient.user.count({ where });

    return {
      data: staff.map((s) => ({
        ...s,
        shopName: s.shop?.name || null,
        shop: undefined
      })),
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: totalStaff,
        totalPages: Math.ceil(totalStaff / pageSize)
      }
    };
  } catch(e) {
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
    
    throw new ResponseError(500, "Gagal mengambil data staff gudang", {
      originalError: e.message,
      stack: e.stack
    });
  }
};

const getKasirStaff = async (request) => {
  try {
    const { 
      search = '',
      roles = ['kasir'], // default value
      isActive = true,
      page = 1,
      pageSize = 10,
      sortBy = 'name',
      sortOrder = 'asc'
    } = request.query;

    // Format roles ke array jika berupa string
    const rolesArray = Array.isArray(roles) ? roles : [roles].filter(Boolean);

    const where = {
      role: { in: rolesArray },
      isActive: isActive === 'true' || isActive === true
    };

    // Tambahkan filter search jika ada
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { nik: { contains: search, mode: 'insensitive' } }
      ];
    }

    const staff = await prismaClient.user.findMany({
      where,
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
        admin: {
          select: {
            name: true
          }
        }
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        [sortBy]: sortOrder
      }
    });

    const totalStaff = await prismaClient.user.count({ where });

    return {
      data: staff.map((s) => ({
        ...s,
        adminName: s.admin?.name || null,
        admin: undefined
      })),
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: totalStaff,
        totalPages: Math.ceil(totalStaff / pageSize)
      }
    };
  } catch(e) {
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal mengambil daftar staff", e);
  }
};

const getAllProducts = async (request) => {
  try {
    // Default values untuk dashboard
    const {
      search = '',
      isActive = true,
      minStock,
      maxStock,
      minPrice,
      maxPrice,
      typeId,
      distributorId,
      alert = '', // 'lowStock' atau 'outOfStock'
      page = 1,
      pageSize = 10,
      sortBy = 'stock', // Default sort by stock
      sortOrder = 'asc'
    } = request.query;

    // Build filter
    const where = {
      isActive: isActive === 'true' || isActive === true
    };

    // Search by name or barcode
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Stock alerts
    if (alert === 'lowStock') {
      where.stock = { lte: 10 }; // Threshold stok rendah
    } else if (alert === 'outOfStock') {
      where.stock = { equals: 0 };
    }

    // Range filters
    if (minStock) where.stock = { ...where.stock, gte: parseInt(minStock) };
    if (maxStock) where.stock = { ...where.stock, lte: parseInt(maxStock) };
    if (minPrice) where.sellPrice = { gte: parseFloat(minPrice) };
    if (maxPrice) where.sellPrice = { lte: parseFloat(maxPrice) };

    // Relation filters
    if (typeId) where.typeId = parseInt(typeId);
    if (distributorId) where.distributorId = parseInt(distributorId);

    // Get products with pagination
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        buyPrice: true,
        sellPrice: true,
        stock: true,
        barcode: true,
        imagePath: true,
        type: { select: { id: true, name: true } },
        distributor: { select: { id: true, name: true } }
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder }
    });

    // Get total count for pagination
    const totalItems = await prisma.product.count({ where });

    // Additional stats for dashboard
    const stats = {
      totalProducts: await prisma.product.count(),
      activeProducts: await prisma.product.count({ where: { isActive: true } }),
      lowStockProducts: await prisma.product.count({ 
        where: { stock: { lte: 10 }, isActive: true } 
      }),
      outOfStockProducts: await prisma.product.count({ 
        where: { stock: 0, isActive: true } 
      })
    };

    return {
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        pageSize: parseInt(pageSize),
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize)
      },
      stats
    };

  } catch (error) {
    console.error('Error fetching products:', error);
    throw new ResponseError(500, 'Failed to retrieve products');
  }
};
 
// ================================= GET BY ID =================================
const getStaffById = async (request) => {// HANYA WEBSITE ADMIN
  try{  
    const staffId = parseInt(request.params);

    if (isNaN(staffId)) {
      throw new ResponseError(400, "ID tidak valid");
    }

    const staff = await prismaClient.user.findFirst({
      where: {
        id: staffId,
        role: { in: ["kasir", "gudang"] },
        isActive: true
      },
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
        admin: {
          select: { name: true }
        }
      }
    });

    if (!staff) {
      throw new ResponseError(404, "Staff tidak ditemukan");
    }

    return {
      ...staff,
      adminName: staff.admin?.name || null,
      admin: undefined
    };
  }catch(e){
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal mengambil data staff", e)
  }
};

const getProductById = async (request) => {
  try {
    const productId = parseInt(request.params);

    if (isNaN(productId)) {
      throw new ResponseError(400, "ID produk tidak valid");
    }

    const product = await prismaClient.product.findFirst({
      where: { id: productId },
      select: {
        name: true,
        buyPrice: true,
        sellPrice: true,
        stock: true,
        barcode: true,
        imagePath: true,
        type: { select: { id: true, name: true } },
        distributor: { select: { id: true, name: true } },
        admin: { select: { name: true } }
      }
    });

    if (!product) {
      throw new ResponseError(404, "Produk tidak ditemukan");
    }

    return {
      ...product,
      adminName: product.admin?.name || null,
      admin: undefined
    };
  } catch (e) {
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal mengambil data produk", e);
  }
};

// ================================= UPDATE =================================
const updateStaff = async (req) => {// HANYA WEBSITE ADMIN
  try{
    const staffId = parseInt(req.params);
    if (isNaN(staffId)) {
      throw new ResponseError(400, "ID staff tidak valid");
    }

    const user = req.user;
    if (user.role !== 'admin') {
      throw new ResponseError(403, "Hanya admin yang dapat mengubah data staff");
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
    const fields = ['name', 'email', 'phone', 'nik', 'imagePath', 'shopId'];

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
        isActive: true
      }
    });

    await prismaClient.userHistory.create({
      data: {
        userId: staffId,
        description: `Admin '${user.name}' mengubah ${changes.join(', ')}`
      }
    });

    return updated;
  }catch(e){
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal mengupdate staff", e)
  }
};

const updateAdminProfile = async (req) => {
  try {
    const superadminId = req.user.id;

    if (req.user.role !== "admin") {
      throw new ResponseError(403, "Hanya admin yang dapat mengubah profilnya");
    }

    const updateRequest = validate(updateAdminValidation, req.body);

    const superadmin = await prismaClient.user.findFirst({
      where: {
        id: superadminId,
        role: "admin",
        isActive: true,
      },
    });

    if (!superadmin) {
      throw new ResponseError(404, "Admin tidak ditemukan");
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
        description: `Admin '${req.user.username}' mengubah ${changes.join(', ')}`,
      },
    });

    return updated;
  } catch (e) {
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal mengupdate profil admin", e);
  }
};

const resetPasswordAdmin = async (request) => {
  try{
     // Validasi input
    const input = validate(resetPasswordValidation, request.body);
    const { username, password } = input;

    // Cari user berdasarkan username
    const user = await prismaClient.user.findUnique({
      where: { username }
    });

    if (!user) {
      throw new ResponseError(404, "User dengan username tersebut tidak ditemukan");
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(password, 10);

    // Gunakan transaction untuk atomic operation
    const [updatedUser] = await prismaClient.$transaction([
      // Update password user
      prismaClient.user.update({
        where: { username },
        data: { password: hashedPassword }
      }),
      
      // Hapus semua token user terkait
      prismaClient.userToken.deleteMany({
        where: { userId: user.id }
      })
    ]);

    return {
      success: true,
      message: "Password berhasil direset dan semua sesi login dihapus",
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        tokensDeleted: true // Flag bahwa token dihapus
      }
    };
  }catch(e){
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
    
    throw new ResponseError(500, "Gagal reset password", {
      originalError: e.message,
      stack: e.stack
    });
  }
}

// ================================= SOFT DELETE =================================
const softDeleteStaff = async (req) => {
  try{
    const staffId = parseInt(req.params);
    if (isNaN(staffId)) {
      throw new ResponseError(400, "ID staff tidak valid");
    }

    const user = req.user;
    if (user.role !== 'admin') {
      throw new ResponseError(403, "Hanya admin yang dapat menonaktifkan staff");
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
      data: { isActive: false }
    });

    await prismaClient.userHistory.create({
      data: {
        userId: staffId,
        description: `Staff dengan nama '${staff.name}' dinonaktifkan oleh admin '${user.name}'`,
      }
    });

    return { message: "Staff berhasil dinonaktifkan" };
  }catch(e){
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal menonaktifkan staff", e)
  }
};

// ================================= TRANSFER =================================
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

// ================================= LOGIN =================================
const logoutAdmin = async (request) => {
   try {
      // Dapatkan user ID dari middleware (asumsi sudah di-attach oleh auth middleware)
      const userId = request.user.id;
  
      // Hapus semua token user terkait
      const deletedTokens = await prismaClient.userToken.deleteMany({
        where: { userId }
      });
  
      return {
        success: true,
        message: "Logout berhasil",
        data: {
          userId,
          tokensDeleted: deletedTokens.count // Jumlah token yang dihapus
        }
      };
  
    } catch(e) {
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
      
      throw new ResponseError(500, "Gagal logout", {
        originalError: e.message,
        stack: e.stack
      });
    }
}

export default {
    registerGudang, 
    registerKasir, 
    loginAdmin, 
    getGudangStaff,
    getKasirStaff, 
    getAllProducts,
    getStaffById, 
    getProductById,
    updateStaff, 
    updateAdminProfile,
    softDeleteStaff,
    transferMultipleStaff,
    resetPasswordAdmin,
    logoutAdmin
}