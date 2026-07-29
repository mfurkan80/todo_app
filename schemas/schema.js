import * as z from "zod";
import ERROR_CODES from "../constants/error_code.js";

export const createTaskSchema = z.object({
  title: z
    .string({ message: ERROR_CODES.TASK_NOT_VALID })
    .min(1, { message: ERROR_CODES.TASK_NOT_FOUND })
    .max(100, { message: ERROR_CODES.TASK_MAX_SIZE_ERR_100 }),
});

export const taskIdSchema = z.object({
  id: z
    .string({ message: ERROR_CODES.ID_NOT_VALID })
    .min(1, { message: ERROR_CODES.ID_NOT_VALID })
    .refine((val) => !isNaN(Number(val)), {
      message: ERROR_CODES.ID_NOT_VALID,
    }),
});

export const taskPatchSchema = z.object({
  is_completed: z.boolean({ message: ERROR_CODES.ERROR }),
});
