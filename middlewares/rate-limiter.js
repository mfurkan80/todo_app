import rateLimit from "express-rate-limit";
import ERROR_CODES from "../constants/error_code.js";

export const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 1000,
  message: { message: ERROR_CODES.MAX_RATE_LIMIT },
});
