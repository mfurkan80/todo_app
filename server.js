import cors from "cors";
import express from "express";
import mysql from "mysql2";
import { rateLimit } from 'express-rate-limit'

const app = express();
const port = 3000;

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 15 minutes
    limit: 1000, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    message: { message: "Çok fazla istek attınız." }
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
                message: "Beklenmedik bir hata oluştu."
            });
        }
        res.json(results);
    });
});


app.post("/api/tasks", (req, res) => {


    if (req.body === undefined) {
        return res.status(400).json({
            message: "Task boş olamaz."
        })
    }

    const newTask = req.body.title;

    if (typeof newTask !== "string") {
        return res.status(400).json({
            message: "Geçerli task değildir."
        })
    }

    if (newTask.length > 100) {
        return res.status(400).json({
            message: "Task 100 karakterden fazla olamaz."
        })
    }

    if (newTask.length === 0) {
        return res.status(400).json({
            message: "Task boş olamaz."
        })
    }

    db.query("INSERT INTO tasks (title) VALUES (?)", [newTask], (err, result) => {
        if (err) return res.status(500).json({
            message: "Bir sorun oluştu.",
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
            message: "Geçerli bir id girilmedi."
        });
    }

    if (taskId.length === 0) {
        return res.status(400).json({
            message: "Bir id giriniz."
        })
    }

    db.query("DELETE FROM tasks WHERE id = ?", [taskId], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Bir sorun oluştu"
            });
        };

        if (result.affectedRows === 0) {
            return res.status(400).json({
                message: "Task bulunamadı."
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
            message: "Geçerli bir id girilmedi."
        })
    }

    if (typeof is_completed !== "boolean") {
        return res.status(400).json({
            message: "hatalı"
        })
    }

    db.query(
        "UPDATE tasks SET is_completed = ? WHERE id = ?",
        [is_completed, taskId],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: "Bir sorun oluştu."
                });
            };

            if (result.affectedRows === 0) {
                return res.status(400).json({
                    message: "Task bulunamadı."
                })
            };

            res.json()
        }
    )
});





app.listen(port, () => {
    console.log("Port dinleniyor:", port)
});