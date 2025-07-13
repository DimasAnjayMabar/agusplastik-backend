import bcrypt from "bcrypt"
import {v4 as uuid} from "uuid";
import { prismaClient } from "../application/database.js"
import { ResponseError } from "../error/response_error.js"
import { validate } from "../validation/validation.js"
import { registerStaff, registerAdminValidation, updateStaffValidation, login } from "../validation/admin_validation.js";

// ================================= REGISTRASI =================================
const registerAdmin = async (request) => { // HANYA WEBSITE ADMIN
  try{
    const register = validate(registerAdminValidation, request.body) 

    const findExistingUser = await prismaClient.user.count({
        where : {
            username : register.username
        }
    })

    if(findExistingUser === 1){
        throw new ResponseError(400, "Username terdaftar")
    }

    register.password = await bcrypt.hash(register.password, 10);

    register.role = "admin";

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

const registerGudang = async (request) => { // HANYA WEBSITE ADMIN
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
const getAllStaff = async (request) => {// HANYA WEBSITE ADMIN
  try{
    const staff = await prismaClient.user.findMany({
      where: {
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
          select: {
            name: true
          }
        }
      }
    });

    return staff.map((s) => ({
      ...s,
      adminName: s.admin?.name || null,
      admin: undefined
    }));
  }catch(e){
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal mengambil daftar staff", e)
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

//================================= DEACTIVATE ACCOUNT =================================
const deactivateSelfAdmin = async (req) => {
  try {
    const currentAdmin = req.user;

    if (currentAdmin.role !== 'admin') {
      throw new ResponseError(403, "Hanya admin yang dapat menonaktifkan akunnya");
    }

    const remainingStaff = await prismaClient.user.count({
      where: {
        adminId: currentAdmin.id,
        role: { in: ['gudang', 'kasir'] },
        isActive: true
      }
    });

    if (remainingStaff > 0) {
      throw new ResponseError(400, "Tidak bisa menonaktifkan akun karena masih ada staff aktif di bawah admin ini. Harap transfer semua staff anda terlebih dahulu.");
    }

    await prismaClient.user.update({
      where: { id: currentAdmin.id },
      data: { isActive: false }
    });

    await prismaClient.userToken.deleteMany({
      where: { userId: currentAdmin.id }
    });

    await prismaClient.userHistory.create({
      data: {
        userId: currentAdmin.id,
        description: `Admin '${currentAdmin.username}' telah digantikan`
      }
    });

    return { message: "Akun Anda telah dinonaktifkan dan token Anda telah dihapus" };

  } catch (e) {
    if (e instanceof ResponseError) throw e;
    throw new ResponseError(500, "Gagal menonaktifkan akun", e);
  }
};

export default {
    registerAdmin, 
    registerGudang, 
    registerKasir, 
    loginAdmin, 
    getAllStaff, 
    getStaffById, 
    updateStaff, 
    softDeleteStaff, 
    deactivateSelfAdmin
}