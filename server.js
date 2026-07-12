import cors from "cors";
import "dotenv/config";
import express from "express";
import { rateLimit } from "express-rate-limit";
import mysql from "mysql2";
import ERROR_CODES from "./constants/error_code.js";
import * as z from "zod";
import bcrypt from "bcryptjs";

const app = express();
const port = 3000;
const createTaskSchema = z.object({
  title: z
    .string({ message: ERROR_CODES.TASK_NOT_VALID })
    .min(1, { message: ERROR_CODES.TASK_NOT_FOUND })
    .max(100, { message: ERROR_CODES.TASK_MAX_SIZE_ERR_100 }),
});

const taskIdSchema = z.object({
  id: z
    .string({ message: ERROR_CODES.ID_NOT_VALID })
    .min(1, { message: ERROR_CODES.ID_NOT_VALID })
    .refine((val) => !isNaN(Number(val)), {
      message: ERROR_CODES.ID_NOT_VALID,
    }),
});

const taskPatchSchema = z.object({
  is_completed: z.boolean({ message: ERROR_CODES.ERROR }),
});

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  limit: 1000, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  message: { message: ERROR_CODES.MAX_RATE_LIMIT },
});

app.use(limiter);
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

app.use(express.static("public"));

app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = "INSERT INTO users (email, password) VALUES (?, ?)";

    db.query(sql, [email, hashedPassword], (err, result) => {
      if (err) {
        console.log("Kayıt hatası: ", err);
        return res.status(500).json({ message: ERROR_CODES.REGISTER_ERROR });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: ERROR_CODES.SERVER_ERROR });
  }
});

app.get("/api/tasks", (req, res) => {
  db.query("SELECT * FROM tasks", (err, results) => {
    if (err) {
      return res.status(500).json({
        message: ERROR_CODES.SERVER_ERROR,
      });
    }
    res.json(results);
  });
});

app.post("/api/tasks", (req, res) => {
  const result = createTaskSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ message: result.error.issues[0].message });
  }

  const newTask = result.data.title;

  db.query("INSERT INTO tasks (title) VALUES (?)", [newTask], (err, result) => {
    if (err)
      return res.status(500).json({
        message: ERROR_CODES.SERVER_ERROR,
        data: {
          error: err,
        },
      });
    res.json({
      data: { taskId: result.insertId },
    });
  });
});

app.delete("/api/tasks/:id", (req, res) => {
  const result = taskIdSchema.safeParse(req.params);

  if (!result.success) {
    return res.status(400).json({ message: result.error.issues[0].message });
  }

  const taskId = result.data.id;

  /*  if (isNaN(taskId)) {
        return res.status(400).json({
            message: ERROR_CODES.ID_NOT_VALID
        });
    }

    if (taskId.length === 0) {
        return res.status(400).json({
            message: ERROR_CODES.ID_NOT_VALID
        })
    }*/

  db.query("DELETE FROM tasks WHERE id = ?", [taskId], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: ERROR_CODES.SERVER_ERROR,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({
        message: ERROR_CODES.TASK_NOT_FOUND,
      });
    }

    res.json();
  });
});

app.patch("/api/tasks/:id", (req, res) => {
  const paramsResult = taskIdSchema.safeParse(req.params);
  if (!paramsResult.success) {
    return res
      .status(400)
      .json({ message: paramsResult.error.issues[0].message });
  }
  const bodyResult = taskPatchSchema.safeParse(req.body);
  if (!bodyResult.success) {
    return res
      .status(400)
      .json({ message: bodyResult.error.issues[0].message });
  }
  const taskId = paramsResult.data.id;
  const { is_completed } = bodyResult.data;

  db.query(
    "UPDATE tasks SET is_completed = ? WHERE id = ?",
    [is_completed, taskId],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: ERROR_CODES.SERVER_ERROR,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(400).json({
          message: ERROR_CODES.TASK_NOT_FOUND,
        });
      }

      res.json();
    },
  );
});

app.listen(port, () => {
  console.log("Port dinleniyor:", port);
});
