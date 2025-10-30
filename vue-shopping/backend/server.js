import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import pool from './db.js'

const app = express()
app.use(cors())
app.use(bodyParser.json())

// 新增商品 API
app.post('/api/products', async (req, res) => {
  const { id, name, price, stock } = req.body
  if (!id || !name) {
    return res.status(400).json({ message: '缺少必要欄位' })
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO Product (ProductID, ProductName, Price, Quantity) VALUES (?, ?, ?, ?)',
      [id, name, price, stock],
    )
    res.json({ message: '商品新增成功！', insertId: result.insertId })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: '資料庫錯誤' })
  }
})

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000')
})
