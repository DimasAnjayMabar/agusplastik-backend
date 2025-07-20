import { prismaClient } from "../application/database.js";
import { ResponseError } from "../error/response_error.js";

export const authMiddleware = async (req, res, next) => {
    try{
        const authHeader = req.headers.authorization;
        if (!authHeader) throw new ResponseError(401, "Token tidak ditemukan");

        const token = authHeader.split(" ")[1];

        const userToken = await prismaClient.userToken.findUnique({
            where: { token },
            include: {
                user: {
                    select: {
                        id: true,
                        role: true,
                        username: true,
                        shopId: true // tambahkan ini
                    }
                }
            }
        });

        if (!userToken) throw new ResponseError(401, "Token tidak valid");

        const now = new Date();
        const expiredAt = new Date(userToken.createdAt.getTime() + userToken.expiresIn * 1000);
        if (now > expiredAt) {
            throw new ResponseError(401, "Token sudah kadaluarsa");
        }

       req.user = {
            id: userToken.user.id,
            role: userToken.user.role,
            username: userToken.user.username,
            shopId: userToken.user.shopId // tambahkan ini
        };

        next()
    }catch(e){  
        next(e)
    }
};
