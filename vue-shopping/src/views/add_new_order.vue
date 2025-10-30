<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

interface Product {
  id: string
  name: string
  price: number
  reserve: number
  buyQuantity: number
  selected: boolean
}

const products = ref<Product[]>([])
const total = computed(() =>
  products.value
    .filter((p) => p.selected)
    .reduce((sum, p) => sum + p.price * (p.buyQuantity || 0), 0),
)

// 當庫存 > 0 的商品清單
async function fetchProducts() {
  const res = await axios.get('http://localhost:3000/api/products')
  products.value = res.data.filter((p: Product) => p.reserve > 0)
}

// 建立訂單
async function createOrder() {
  const selected = products.value.filter((p) => p.selected && p.buyQuantity && p.buyQuantity > 0)
  if (selected.length === 0) return alert('至少選擇一項商品')

  for (const p of selected) {
    if ((p.buyQuantity || 0) > p.reserve) {
      alert(`${p.name} 庫存不足（剩餘：${p.reserve}）`)
      return
    }
  }

  const order = {
    items: selected.map((p) => ({
      ProductID: p.id,
      Quantity: p.buyQuantity,
      Price: p.price,
    })),
  }

  try {
    await axios.post('http://localhost:3000/api/orders', order)
    alert('訂單已成功建立！')
    await fetchProducts() // 更新清單
  } catch (err) {
    console.error(err)
    alert('建立訂單失敗，請稍後重試。')
  }
}

onMounted(fetchProducts)
</script>

<template>
  <div class="add-order">
    <h2>新增訂單</h2>

    <table>
      <thead>
        <tr>
          <th>選擇</th>
          <th>商品編號</th>
          <th>商品名稱</th>
          <th>售價</th>
          <th>庫存</th>
          <th>購買數量</th>
          <th>小計</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in products" :key="p.id">
          <td><input type="checkbox" v-model="p.selected" /></td>
          <td>{{ p.id }}</td>
          <td>{{ p.name }}</td>
          <td>{{ p.price }}</td>
          <td>{{ p.reserve }}</td>
          <td>
            <input
              type="number"
              min="0"
              :max="p.reserve"
              v-model.number="p.buyQuantity"
              :disabled="!p.selected"
            />
          </td>
          <td>{{ (p.price * (p.buyQuantity || 0)).toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>

    <div class="total">
      <p>
        目前訂單總金額：<strong>{{ total.toFixed(2) }}</strong> 元
      </p>
      <button @click="createOrder">建立訂單</button>
    </div>
  </div>
</template>

<style scoped>
.add-order {
  max-width: 900px;
  margin: 30px auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}
th,
td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: center;
}
button {
  background-color: #42b883;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}
button:hover {
  background-color: #2e9d6b;
}
.total {
  text-align: right;
  font-size: 1.2em;
}
</style>
