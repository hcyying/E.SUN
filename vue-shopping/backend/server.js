import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import pool from './db.js'

const app = express()
app.use(cors())
app.use(bodyParser.json())

// �s�W�ӫ~
app.post('/api/products', async (req, res) => {
  const { id, name, price, reserve } = req.body
  if (!id || !name) {
    return res.status(400).json({ message: '�ʤ֥��n���' })
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO Product (ProductID, ProductName, Price, Quantity) VALUES (?, ?, ?, ?)',
      [id, name, price, reserve],
    )
    res.json({ message: '�ӫ~�s�W���\�I', insertId: result.insertId })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: '��Ʈw���~���~' })
  }
})
// �w�s�w�L

// ��ܰӫ~�M��
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT ProductID AS id, ProductName AS name, Price AS price, Quantity AS reserve FROM Product',
    )
    res.json(rows) // ��Ʈw�ثe�Ҧ��ӫ~��ܨ�e��
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: '�L�k��ܰӫ~���' })
  }
})

// �إ߷s�q��
app.post('/api/orders', async (req, res) => {
  const orders = await pool.getConnection()
  try {
    await orders.beginTransaction()

    const { items } = req.body
    const orderId = 'O' + Date.now()

    // �إ߭q��
    await orders.query(
      'INSERT INTO `Order` (OrderID, MemberID, Price, PayStatus) VALUES (?, ?, ?, ?)',
      [orderId, 'Guest', 0, 0],
    )

    let total = 0

    for (const item of items) {
      // ��ܰӫ~����w�L�w�s�ӫ~
      const [rows] = await orders.query(
        'SELECT ProductID, ProductName, Price, Quantity FROM Product WHERE ProductID = ? FOR UPDATE',
        [item.ProductID],
      )
      const prod = rows[0]
      if (!prod) {
        throw new Error(`PRODUCT_NOT_FOUND: ${item.ProductID}`)
      }
      if (prod.Quantity < item.Quantity) {
        throw new Error(`INSUFFICIENT_STOCK: ${prod.ProductName} (�Ѿl ${prod.Quantity})`)
      }

      const subTotal = prod.Price * item.Quantity
      total += subTotal

      // �s�W�q��\��
      await orders.query(
        'INSERT INTO OrderDetail (OrderID, ProductID, Quantity, StandPrice, ItemPrice) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.ProductID, item.Quantity, prod.Price, subTotal],
      )

      // ��w�s
      await orders.query('UPDATE Product SET Quantity = Quantity - ? WHERE ProductID = ?', [
        item.Quantity,
        item.ProductID,
      ])

      // ��w�s�� 0 �� �����R�����ӫ~
      await orders.query(
        'UPDATE Product SET IsActive = FALSE WHERE ProductID = ? AND Quantity = 0',
        [item.ProductID],
      )
    }

    // �q���`����
    await orders.query('UPDATE `Order` SET Price = ? WHERE OrderID = ?', [total, orderId])

    await orders.commit()
    res.json({ message: '�q��w���\�إ�', orderId, total })
  } catch (err) {
    await orders.rollback()
    console.error(err)
    res.status(400).json({ message: '�q��إߦ��~', error: String(err.message || err) })
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
