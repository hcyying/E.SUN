import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'a2362229',
  database: 'eshop',
  charset: 'utf8mb4',
  multipleStatements: true, // �i��G�䴩�h�y�y��l��
  waitForConnections: true,
  connectionLimit: 5,
})

export default pool
