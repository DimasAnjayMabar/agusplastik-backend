// import pkg from '@prisma/client';
// const { PrismaClient } = pkg;
// import { logger } from "./logging.js";

// export const prismaClient = new PrismaClient({
//     log : [
//         {
//             emit : "event",
//             level : "query",
//         }, 
//         {
//             emit : "event",
//             level : "error",
//         }, 
//         {
//             emit : "event",
//             level : "warn",
//         }, 
//         {
//             emit : "event",
//             level : "info",
//         }
//     ],
// });

// prismaClient.$on('error', (e) => {
//     logger.error(e);
// });

// prismaClient.$on('warn', (e) => {
//     logger.warn(e);
// });

// prismaClient.$on('info', (e) => {
//     logger.info(e);
// });

// prismaClient.$on('query', (e) => {
//     logger.info(e);
// });

// CUSTOM ERROR MESSAGE
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

// Tidak perlu konfigurasi log karena kita tidak menangani event-nya
export const prismaClient = new PrismaClient();