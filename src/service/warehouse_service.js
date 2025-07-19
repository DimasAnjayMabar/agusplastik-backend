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

    if (user.role !== "superadmin") {
      throw new ResponseError(403, "Akses hanya untuk superadmin");
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
const getShopProducts = async (req) => {
    try{
        // pengambilan produk harus sesuai dengan shopId staff yang login
    }catch(e){
        throw new ResponseError(500, "Gagal mengambil data produk")
    }
}

const getShopDistributor = async (req) => {
    try{
        // pengambilan distributor bisa dibuat where null atau disamakan dengan shopId staff yang sedang login lewat middleware
    }catch(e){
        throw new ResponseError(500, "Gagal mengambil data distributor")
    }
}

// ================================= GET BY ID =================================
const getProductById = async (req) => {
    try{
        
    }catch(e){  
        throw new ResponseError(500, "Gagal menambil data produk")
    }
}

const getDistributorById = async (req) => {
    try{

    }catch(e){
        throw new ResponseError(500, "Gagal mengambil daata distributor")
    }
}

// ================================= CREATE =================================
const createDistributor = async (req) => {
    try{
        // ada opsi dimana staff gudang bisa memilih global (shopId null) atau shopId miliknya sendiri menjadi shopId distributor
    }catch(e){
        throw new ResponseError(500, "Gagal menambah distributor")
    }
}

const createProduct = async (req) => {
    try{

    }catch(e){
        throw new ResponseError(500, "Gagal menambah produk")
    }
}

// ================================= UPDATE =================================
const updateDistributor = async (req) => {
    try{

    }catch(e){
        throw new ResponseError(500, "Gagal mengupdate data distributor")
    }
}

const updateProduct = async (req) => {
    try{

    }catch(e){
        throw new ResponseError(500, "Gagal mengupdate data produk")
    }
}

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
    try{

    }catch(e){
        throw new ResponseError(500, "Gagal menonaktifkan produk")
    }
}

const deleteDistributor = async (req) => {
    try{

    }catch(e){
        throw new ResponseError(500, "Gagal menonaktifkan distributor")
    }
}

export default {
    loginStaffGudang,
    getShopProducts,
    getShopDistributor,
    createDistributor,
    createProduct,
    getProductById,
    getDistributorById,
    updateDistributor,
    updateProduct,
    updateStaffProfile,
    deleteDistributor,
    deleteProduct
}
