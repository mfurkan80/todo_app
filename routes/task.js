import express from "express";
import db from "../config/db.js";
import ERROR_CODES from "../constants/error_code.js";
import verifyToken from "../middlewares/verify-token.js";
import {
  createTaskSchema,
  taskIdSchema,
  taskPatchSchema,
} from "../schemas/schema.js";

const router = express.Router();

router.get("/", verifyToken, (req, res) => {
  const userId = req.user.id;
  db.query(
    "SELECT * FROM tasks WHERE user_id = ?",
    [userId],
    (err, results) => {
      if (err)
        return res.status(500).json({ message: ERROR_CODES.SERVER_ERROR });
      res.json(results);
    },
  );
});

router.post("/", verifyToken, (req, res) => {
  const result = createTaskSchema.safeParse(req.body);
  if (!result.success)
    return res.status(400).json({ message: result.error.issues[0].message });

  const newTask = result.data.title;
  const userId = req.user.id;

  db.query(
    "INSERT INTO tasks (title, user_id) VALUES (?, ?)",
    [newTask, userId],
    (err, result) => {
      if (err)
        return res
          .status(500)
          .json({ message: ERROR_CODES.SERVER_ERROR, data: { error: err } });
      res.json({ data: { taskId: result.insertId } });
    },
  );
});

router.delete("/:id", verifyToken, (req, res) => {
  const result = taskIdSchema.safeParse(req.params);
  if (!result.success)
    return res.status(400).json({ message: result.error.issues[0].message });

  const taskId = result.data.id;
  const userId = req.user.id;

  db.query(
    "DELETE FROM tasks WHERE id = ? AND user_id = ?",
    [taskId, userId],
    (err, result) => {
      if (err)
        return res.status(500).json({ message: ERROR_CODES.SERVER_ERROR });
      if (result.affectedRows === 0)
        return res.status(400).json({ message: ERROR_CODES.TASK_NOT_FOUND });
      res.json();
    },
  );
});

router.patch("/:id", verifyToken, (req, res) => {
  const paramsResult = taskIdSchema.safeParse(req.params);
  if (!paramsResult.success)
    return res
      .status(400)
      .json({ message: paramsResult.error.issues[0].message });

  const bodyResult = taskPatchSchema.safeParse(req.body);
  if (!bodyResult.success)
    return res
      .status(400)
      .json({ message: bodyResult.error.issues[0].message });

  const taskId = paramsResult.data.id;
  const { is_completed } = bodyResult.data;
  const userId = req.user.id;

  db.query(
    "UPDATE tasks SET is_completed = ? WHERE id = ? AND user_id = ?",
    [is_completed, taskId, userId],
    (err, result) => {
      if (err)
        return res.status(500).json({ message: ERROR_CODES.SERVER_ERROR });
      if (result.affectedRows === 0)
        return res.status(400).json({ message: ERROR_CODES.TASK_NOT_FOUND });
      res.json();
    },
  );
});

export default router;
