import userService from "../service/userService_service.js"

// REGISTRASI 
const registerAdmin = async (req, res, next) => {
    try{
        const result = await userService.registerAdmin(req.body)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const registerGudang = async (req, res, next) => {
    try{
        const result = await userService.registerGudang(req.body)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const registerKasir = async (req, res, next) => {
    try{
        const result = await userService.registerKasir(req.body)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

// LOGIN 
const loginAdmin = async (req, res, next) => {
    try{
        const result = await userService.loginAdmin(req.body)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}
const loginGudang = async (req, res, next) => {
    try{
        const result = await userService.loginGudang(req.body)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const loginKasir = async (req, res, next) => {
    try{
        const result = await userService.loginKasir(req.body)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

export default {
    registerAdmin, registerGudang, registerKasir, loginAdmin, loginGudang, loginKasir
}