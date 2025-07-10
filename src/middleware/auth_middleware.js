import { prismaClient } from "../application/database.js";

export const authMiddleware = async (req, res, next) => {
    const token = req.get("Authorization");

    if (!token) {
        return res.status(401).json({ errors: "Unauthorized" }).end();
    }

    try {
        // Fetch user with the given token
        const user = await prismaClient.user.findFirst({
            where: { token: token },
            select: {
                userId: true,
                username: true,
                token: true
            }
        });

        // If no user found, return unauthorized
        if (!user) {
            return res.status(401).json({ errors: "Unauthorized" }).end();
        }

        // Attach user data to request object
        req.user = user;
        next();
    } catch (error) {
        return res.status(500).json({ errors: "Internal Server Error" }).end();
    }
};