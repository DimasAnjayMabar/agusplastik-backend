import bcrypt from "bcrypt"
import {v4 as uuid} from "uuid";
import { prismaClient } from "../application/database.js"
import { ResponseError } from "../error/response_error.js"
import { validate } from "../validation/validation.js"
import { registerStaff, updateStaffValidation, login } from "../validation/admin_validation.js";

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

    register.adminId = request.user.id;

    register.role = "gudang";

    const result = await prismaClient.user.create({
        data: register,
        select: {
            username: true,
            name: true,
            role: true,
            adminId: true
        }
    });

    return result;
  }catch(e){
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal registrasi staff gudang", e)
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

    register.adminId = request.user.id;

    register.role = "kasir";

    const result = await prismaClient.user.create({
        data: register,
        select: {
            username: true,
            name: true,
            role: true,
            adminId: true
        }
    });

    return result;
  }catch(e){
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal registrasi staff kasir", e)
  }
};

// ================================= LOGIN =================================
const loginAdmin = async (request) => { // HANYA WEBSITE ADMIN
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
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Login gagal", e)
  }
}

// ================================= GET ALL ================================= 
const getAllStaff = async (request) => {
  try {
    const { 
      search = '',
      roles = ['kasir', 'gudang'], // default value
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
    const staffId = parseInt(request.params.id);

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
    const productId = parseInt(request.params.id);

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
    const staffId = parseInt(req.params.id);
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
    const fields = ['name', 'email', 'phone', 'nik', 'photoPath', 'shopId'];

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

// ================================= SOFT DELETE =================================
const softDeleteStaff = async (req) => {
  try{
    const staffId = parseInt(req.params.id);
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

export default {
    registerGudang, 
    registerKasir, 
    loginAdmin, 
    getAllStaff, 
    getAllProducts,
    getStaffById, 
    getProductById,
    updateStaff, 
    softDeleteStaff
}