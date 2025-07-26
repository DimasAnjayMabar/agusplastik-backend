export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) throw new ResponseError(401, "Token tidak ditemukan");

        const token = authHeader.split(" ")[1];

        // Gunakan transaction untuk atomic update
        const userToken = await prismaClient.$transaction(async (tx) => {
            const tokenData = await tx.userToken.findUnique({
                where: { token },
                include: { user: true }
            });

            if (!tokenData) throw new ResponseError(401, "Token tidak valid");

            // Cek expired
            const now = new Date();
            const expiredAt = new Date(tokenData.lastActive.getTime() + tokenData.expiresIn * 1000);
            if (now > expiredAt) {
                await tx.userToken.delete({ where: { token } }); // Auto-cleanup
                throw new ResponseError(401, "Sesi telah berakhir");
            }

            // Perpanjang masa aktif jika token digunakan dalam 12 jam terakhir
            if (now < new Date(tokenData.lastActive.getTime() + 12 * 60 * 60 * 1000)) {
                await tx.userToken.update({
                    where: { token },
                    data: { 
                        lastActive: now,
                        expiresIn: 7 * 24 * 60 * 60 // Reset ke 7 hari
                    }
                });
            }

            return tokenData;
        });

        req.user = {
            id: userToken.user.id,
            role: userToken.user.role,
            username: userToken.user.username,
            shopId: userToken.user.shopId
        };

        next();
    } catch(e) {  
        next(e);
    }
};