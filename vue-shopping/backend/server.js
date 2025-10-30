import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import pool from './db.js'

const app = express()
app.use(cors())
app.use(bodyParser.json())

// 新增商品
app.post('/api/products', async (req, res) => {
  const { id, name, price, reserve } = req.body
  if (!id || !name) {
    return res.status(400).json({ message: '缺少必要欄位' })
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO Product (ProductID, ProductName, Price, Quantity) VALUES (?, ?, ?, ?)',
      [id, name, price, reserve],
    )
    res.json({ message: '商品新增成功！', insertId: result.insertId })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: '資料庫有誤錯誤' })
  }
})
// 庫存已無

// 顯示商品清單
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT ProductID AS id, ProductName AS name, Price AS price, Quantity AS reserve FROM Product',
    )
    res.json(rows) // 資料庫目前所有商品顯示到前端
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: '無法顯示商品資料' })
  }
})

// 建立新訂單
app.post('/api/orders', async (req, res) => {
  const orders = await pool.getConnection()
  try {
    await orders.beginTransaction()

    const { items } = req.body
    const orderId = 'O' + Date.now()

    // 建立訂單
    await orders.query(
      'INSERT INTO `Order` (OrderID, MemberID, Price, PayStatus) VALUES (?, ?, ?, ?)',
      [orderId, 'Guest', 0, 0],
    )

    let total = 0

    for (const item of items) {
      // 顯示商品並鎖已無庫存商品
      const [rows] = await orders.query(
        'SELECT ProductID, ProductName, Price, Quantity FROM Product WHERE ProductID = ? FOR UPDATE',
        [item.ProductID],
      )
      const prod = rows[0]
      if (!prod) {
        throw new Error(`PRODUCT_NOT_FOUND: ${item.ProductID}`)
      }
      if (prod.Quantity < item.Quantity) {
        throw new Error(`INSUFFICIENT_STOCK: ${prod.ProductName} (剩餘 ${prod.Quantity})`)
      }

      const subTotal = prod.Price * item.Quantity
      total += subTotal

      // 新增訂單功能
      await orders.query(
        'INSERT INTO OrderDetail (OrderID, ProductID, Quantity, StandPrice, ItemPrice) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.ProductID, item.Quantity, prod.Price, subTotal],
      )

      // 減掉庫存
      await orders.query('UPDATE Product SET Quantity = Quantity - ? WHERE ProductID = ?', [
        item.Quantity,
        item.ProductID,
      ])

      // 當庫存剩 0 → 直接刪掉此商品
      await orders.query(
        'UPDATE Product SET IsActive = FALSE WHERE ProductID = ? AND Quantity = 0',
        [item.ProductID],
      )
    }

    // 訂單總價格
    await orders.query('UPDATE `Order` SET Price = ? WHERE OrderID = ?', [total, orderId])

    await orders.commit()
    res.json({ message: '訂單已成功建立', orderId, total })
  } catch (err) {
    await orders.rollback()
    console.error(err)
    res.status(400).json({ message: '訂單建立有誤', error: String(err.message || err) })
  } finally {
    orders.release()
  }
})

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000')
})
