import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import pool from './db.js'

const app = express()
app.use(cors())
app.use(bodyParser.json())

// �s�W�ӫ~ API
app.post('/api/products', async (req, res) => {
  const { id, name, price, stock } = req.body
  if (!id || !name) {
    return res.status(400).json({ message: '�ʤ֥��n���' })
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO Product (ProductID, ProductName, Price, Quantity) VALUES (?, ?, ?, ?)',
      [id, name, price, stock],
    )
    res.json({ message: '�ӫ~�s�W���\�I', insertId: result.insertId })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: '��Ʈw���~' })
  }
})

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000')
})
