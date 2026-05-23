const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require('path');

const app = express();
const port = 3000;

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
        if (err) return res.status(500).json(err);
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


app.listen(port, () => {
    console.log("Port dinleniyor:", port)
});