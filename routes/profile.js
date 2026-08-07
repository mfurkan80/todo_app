import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db from "../config/db.js";

const router = express.Router();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err)
      return res.status(403).json({ message: "Invalid or expired token." });
    req.user = user;
    next();
  });
};

// GET: Sadece email'i çekiyoruz
router.get("/", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const sql = "SELECT email FROM users WHERE id = ?";

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Internal server error." });
    if (results.length === 0)
      return res.status(404).json({ message: "User not found." });

    res.status(200).json(results[0]);
  });
});

// PUT: Email ve/veya Şifre güncelliyoruz
router.put("/", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { email, currentPassword, newPassword } = req.body;

  // 1. Durum: Kullanıcı şifresini de değiştirmek istiyor
  if (newPassword) {
    if (!currentPassword) {
      return res
        .status(400)
        .json({ message: "Current password is required to change password." });
    }

    db.query(
      "SELECT password FROM users WHERE id = ?",
      [userId],
      async (err, results) => {
        if (err) return res.status(500).json({ message: "Database error." });

        const user = results[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
          return res
            .status(400)
            .json({ message: "Incorrect current password." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const updateSql =
          "UPDATE users SET email = ?, password = ? WHERE id = ?";
        db.query(updateSql, [email, hashedPassword, userId], (updateErr) => {
          if (updateErr) {
            // MySQL "Çift Kayıt" hatasını yakalıyoruz
            if (updateErr.code === "ER_DUP_ENTRY") {
              return res
                .status(400)
                .json({ message: "This email is already in use." });
            }
            console.error("Database update error: ", updateErr);
            return res
              .status(500)
              .json({ message: "Failed to update profile." });
          }
          res.status(200).json({ email });
        });
      },
    );
  }
  // 2. Durum: Sadece email değiştiriliyor
  else {
    const sql = "UPDATE users SET email = ? WHERE id = ?";
    db.query(sql, [email, userId], (err) => {
      if (err) {
        // MySQL "Çift Kayıt" hatasını yakalıyoruz
        if (err.code === "ER_DUP_ENTRY") {
          return res
            .status(400)
            .json({ message: "This email is already in use." });
        }
        console.error("Database update error: ", err);
        return res.status(500).json({ message: "Failed to update profile." });
      }
      res.status(200).json({ email });
    });
  }
});

export default router;
