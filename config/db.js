import mysql from "mysql2";
import "dotenv/config";

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

const initializeDatabase = () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createTasksTable = `
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      is_completed BOOLEAN DEFAULT FALSE,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  db.query(createUsersTable, (err) => {
    if (err) {
      console.error("❌ Users tablosu oluşturulurken hata:", err);
      return;
    }
    console.log("✅ Users tablosu hazır.");

    db.query(createTasksTable, (err) => {
      if (err) {
        console.error("❌ Tasks tablosu oluşturulurken hata:", err);
      } else {
        console.log("✅ Tasks tablosu hazır.");
      }
    });
  });
};

// Bağlantıyı test et ve tabloları kur
db.connect((err) => {
  if (err) {
    console.error("❌ Veritabanı bağlantı hatası:", err.message);
  } else {
    console.log("✅ MySQL veritabanına başarıyla bağlanıldı!");
    initializeDatabase();
  }
});

export default db;
