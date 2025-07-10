import bcrypt from "bcrypt"
import {v4 as uuid} from "uuid";
import { prismaClient } from "../application/database.js"
import { ResponseError } from "../error/response_error.js"
import { validate } from "../validation/validation.js"
import { registerAdmin, registerGudang, registerKasir } from "../validation/login_page_validation.js"

// REGISTRASI 
const registerAdmin = async (req) => {
    const register = validate(registerAdmin, req) 

    const findExistingUser = await prismaClient.user.count({
        where : {
            username : register.username
        }
    })

    if(findExistingUser === 1){
        throw new ResponseError(400, "username terdaftar")
    }

    register.password = await bcrypt.hash(register.password, 10)

    const result = await prismaClient.user.create({
        data : register,
        select : {
            username : true
        }
    })

    return result
}

const registerGudang = async (req) => {
    const register = validate(registerGudang, req) 

    const findExistingUser = await prismaClient.user.count({
        where : {
            username : register.username
        }
    })

    if(findExistingUser === 1){
        throw new ResponseError(400, "username terdaftar")
    }

    register.password = await bcrypt.hash(register.password, 10)

    const result = await prismaClient.user.create({
        data : register,
        select : {
            username : true
        }
    })

    return result
}

const registerKasir = async (req) => {
    const register = validate(registerKasir, req) 

    const findExistingUser = await prismaClient.user.count({
        where : {
            username : register.username
        }
    })

    if(findExistingUser === 1){
        throw new ResponseError(400, "username terdaftar")
    }

    register.password = await bcrypt.hash(register.password, 10)

    const result = await prismaClient.user.create({
        data : register,
        select : {
            username : true
        }
    })

    return result
}

// LOGIN
const loginAdmin = async (request) => {
  const loginRequest = validate(login, request);

  const user = await prismaClient.user.findUnique({
    where: { username: loginRequest.username },
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

  const passwordIsValid = await bcrypt.compare(loginRequest.password, user.password);
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
}

const loginGudang = async (request) => {
  const loginRequest = validate(login, request);

  const user = await prismaClient.user.findUnique({
    where: { username: loginRequest.username },
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

  const passwordIsValid = await bcrypt.compare(loginRequest.password, user.password);
  if (!passwordIsValid) {
    throw new ResponseError(401, "Username atau password salah");
  }

  if (user.role !== "gudang" || user.role !== "admin") {
    throw new ResponseError(403, "Akses hanya untuk admin dan pegawai gudang");
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
}

const loginKasir = async (request) => {
  const loginRequest = validate(login, request);

  const user = await prismaClient.user.findUnique({
    where: { username: loginRequest.username },
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

  const passwordIsValid = await bcrypt.compare(loginRequest.password, user.password);
  if (!passwordIsValid) {
    throw new ResponseError(401, "Username atau password salah");
  }

  if (user.role !== "kasir" || user.role !== "admin") {
    throw new ResponseError(403, "Akses hanya untuk admin dan pegawai gudang");
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
}

// GET ALL STAFF (HANYA UNTUK WEBSITE ADMIN)

export default {
    registerAdmin, registerGudang, registerKasir, loginAdmin, loginGudang, loginKasir
}