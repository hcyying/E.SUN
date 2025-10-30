import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'a2362229',
  database: 'eshop',
  charset: 'utf8mb4',
  multipleStatements: true, // 可選：支援多語句初始化
  waitForConnections: true,
  connectionLimit: 5,
})

export default pool
