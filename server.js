import cors from "cors";
import express from "express";
import mysql from "mysql2";
import { rateLimit } from 'express-rate-limit'

const app = express();
const port = 3000;

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 15 minutes
    limit: 1000, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    message: { message: ERROR_CODES.MAX_RATE_LIMIT }
})

app.use(limiter)
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1905sahin",
    database: "todo_db"
});


app.use(express.static("public"));

app.get("/api/tasks", (req, res) => {
    db.query("SELECT * FROM tasks", (err, results) => {
        if (err) {
            return res.status(500).json({
                message: ERROR_CODES.SERVER_ERROR
            });
        }
        res.json(results);
    });
});


app.post("/api/tasks", (req, res) => {


    if (req.body === undefined) {
        return res.status(400).json({
            message: ERROR_CODES.TASK_NOT_VALID
        })
    }

    const newTask = req.body.title;

    if (typeof newTask !== "string") {
        return res.status(400).json({
            message: ERROR_CODES.TASK_NOT_VALID
        })
    }

    if (newTask.length > 100) {
        return res.status(400).json({
            message: ERROR_CODES.TASK_MAX_SIZE_ERR_100
            // TASK_MAX_SIZE_ERR_100
        })
    }

    if (newTask.length === 0) {
        return res.status(400).json({
            message: ERROR_CODES.TASK_NOT_VALID
        })
    }

    db.query("INSERT INTO tasks (title) VALUES (?)", [newTask], (err, result) => {
        if (err) return res.status(500).json({
            message: ERROR_CODES.SERVER_ERROR,
            data: {
                error: err
            }
        });
        res.json({
            data: { taskId: result.insertId }
        })
    });
});

app.delete("/api/tasks/:id", (req, res) => {
    const taskId = req.params.id;

    if (isNaN(taskId)) {
        return res.status(400).json({
            message: ERROR_CODES.ID_NOT_VALID
        });
    }

    if (taskId.length === 0) {
        return res.status(400).json({
            message: ERROR_CODES.ID_NOT_VALID
        })
    }

    db.query("DELETE FROM tasks WHERE id = ?", [taskId], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: ERROR_CODES.SERVER_ERROR
            });
        };

        if (result.affectedRows === 0) {
            return res.status(400).json({
                message: ERROR_CODES.TASK_NOT_FOUND
            });
        };

        res.json()
    })
});

app.patch("/api/tasks/:id", (req, res) => {
    const taskId = req.params.id;
    const { is_completed } = req.body;
    if (isNaN(taskId)) {
        return res.status(400).json({
            message: ERROR_CODES.ID_NOT_VALID
        })
    }

    if (typeof is_completed !== "boolean") {
        return res.status(400).json({
            message: ERROR_CODES.ERROR
        })
    }

    db.query(
        "UPDATE tasks SET is_completed = ? WHERE id = ?",
        [is_completed, taskId],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: ERROR_CODES.SERVER_ERROR
                });
            };

            if (result.affectedRows === 0) {
                return res.status(400).json({
                    message: ERROR_CODES.TASK_NOT_FOUND
                })
            };

            res.json()
        }
    )
});





app.listen(port, () => {
    console.log("Port dinleniyor:", port)
});