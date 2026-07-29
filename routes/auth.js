import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import ERROR_CODES from "../constants/error_code.js";

const router = express.Router();

router.post("/register", async (req, res) => {
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

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: ERROR_CODES.SERVER_ERROR });
    if (results.length === 0)
      return res.status(404).json({ message: ERROR_CODES.USER_NOT_FOUND });

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
      res.status(200).json({ token: token });
    } catch (error) {
      console.log("Login hatası:", error);
      res.status(500).json({ message: ERROR_CODES.SERVER_ERROR });
    }
  });
});

export default router;
