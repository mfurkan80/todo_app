import cors from "cors";
import "dotenv/config";
import express from "express";
import { rateLimit } from "express-rate-limit";
import mysql from "mysql2";
import ERROR_CODES from "./constants/error_code.js";
import * as z from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
app.set("trust proxy", 1);
const port = 3000;
const createTaskSchema = z.object({
  title: z
    .string({ message: ERROR_CODES.TASK_NOT_VALID })
    .min(1, { message: ERROR_CODES.TASK_NOT_FOUND })
    .max(100, { message: ERROR_CODES.TASK_MAX_SIZE_ERR_100 }),
});

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: ERROR_CODES.UNATUHTORIZED });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ message: ERROR_CODES.UNATUHTORIZED });
    }

    req.user = decodedUser;

    next();
  });
};

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
      res.status(201).send();
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: ERROR_CODES.SERVER_ERROR });
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: ERROR_CODES.SERVER_ERROR });

    if (results.length === 0) {
      return res.status(404).json({ message: ERROR_CODES.USER_NOT_FOUND });
    }

    try {
      const user = results[0];
      const passCorrect = await bcrypt.compare(password, user.password);

      if (!passCorrect) {
        return res
          .status(401)
          .json({ message: ERROR_CODES.INCORRECT_PASSWORD });
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      res.status(200).json({
        token: token,
      });
    } catch (error) {
      console.log("Login hatası:", error);
      res.status(500).json({ message: ERROR_CODES.SERVER_ERROR });
    }
  });
});

app.get("/api/tasks", verifyToken, (req, res) => {
  const userId = req.user.id;
  db.query(
    "SELECT * FROM tasks WHERE user_id = ?",
    [userId],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          message: ERROR_CODES.SERVER_ERROR,
        });
      }
      res.json(results);
    },
  );
});

app.post("/api/tasks", verifyToken, (req, res) => {
  const result = createTaskSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ message: result.error.issues[0].message });
  }

  const newTask = result.data.title;
  const userId = req.user.id;

  db.query(
    "INSERT INTO tasks (title, user_id) VALUES (?, ?)",
    [newTask, userId],
    (err, result) => {
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
    },
  );
});

app.delete("/api/tasks/:id", verifyToken, (req, res) => {
  const result = taskIdSchema.safeParse(req.params);

  if (!result.success) {
    return res.status(400).json({ message: result.error.issues[0].message });
  }

  const taskId = result.data.id;
  const userId = req.user.id;

  db.query(
    "DELETE FROM tasks WHERE id = ? AND user_id = ?",
    [taskId, userId],
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

app.patch("/api/tasks/:id", verifyToken, (req, res) => {
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
  const userId = req.user.id;

  db.query(
    "UPDATE tasks SET is_completed = ? WHERE id = ? AND user_id = ?",
    [is_completed, taskId, userId],
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
