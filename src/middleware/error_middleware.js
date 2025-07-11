import { ResponseError } from "../error/response_error.js";

const errorMiddleware = async (err, req, res, next) => {
  if (!err) {
    next();
    return;
  }

  // Tambahkan ini
  if (err instanceof ResponseError) {
    console.warn(`[${err.status}] ${err.message}`);
    if (err.cause) console.warn("Detail:", err.cause.message);

    return res.status(err.status).json({
      error: err.message,
      detail: err.cause?.message
    }).end();
  }

  console.error("[UNHANDLED ERROR]", err);

  return res.status(500).json({
    error: "Terjadi kesalahan pada server",
    detail: err.message
  }).end();
};

export { errorMiddleware };
