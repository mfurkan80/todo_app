import cors from "cors";
import "dotenv/config";
import express from "express";
import "./config/db.js";
import { limiter } from "./middlewares/rate-limiter.js";
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/task.js";

const app = express();
app.set("trust proxy", 1);

const port = process.env.PORT || 3000;

// Genel Middleware'ler
app.use(limiter);
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Rotalar (Routes)
app.use("/", authRoutes); // /register ve /login buraya düşecek
app.use("/api/tasks", taskRoutes); // /api/tasks ile başlayan her şey taskRoutes'a gidecek

// Sunucuyu Başlat
app.listen(port, () => {
  console.log(`🚀 Sunucu ${port} portunda başarıyla başlatıldı.`);
});
