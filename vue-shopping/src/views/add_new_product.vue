<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

interface Product {
  id: string
  name: string
  price: number
  reserve: number
}

const products = ref<Product[]>([])
const product = ref<Product>({ id: '', name: '', price: 0, reserve: 0 })
const loading = ref(false)
const errorMsg = ref('')

// 取得商品清單（從資料庫）
async function fetchProducts() {
  loading.value = true
  errorMsg.value = ''
  try {
    const { data } = await axios.get<Product[]>('http://localhost:3000/api/products')
    products.value = data
  } catch (err) {
    console.error(err)
    errorMsg.value = '商品清單無資料'
  } finally {
    loading.value = false
  }
}

async function addProduct() {
  try {
    await axios.post('http://localhost:3000/api/products', product.value)
    await fetchProducts() // 重新抓取最新資料
    product.value = { id: '', name: '', price: 0, reserve: 0 }
    alert('商品已成功新增')
  } catch (err) {
    console.error(err)
    alert('新增商品失敗，是否後端有問題')
  }
}

onMounted(fetchProducts)
</script>

<template>
  <div class="add-product">
    <h2>新增商品</h2>

    <form @submit.prevent="addProduct">
      <div class="form-item">
        <label>商品編號：</label>
        <input v-model="product.id" required />
      </div>

      <div class="form-item">
        <label>商品名稱：</label>
        <input v-model="product.name" required />
      </div>

      <div class="form-item">
        <label>售價：</label>
        <input type="number" v-model.number="product.price" min="0" required />
      </div>

      <div class="form-item">
        <label>庫存：</label>
        <input type="number" v-model.number="product.reserve" min="0" required />
      </div>

      <button type="submit">新增商品</button>
    </form>

    <div style="margin-top: 16px">
      <span v-if="loading">載入中…</span>
      <span v-else-if="errorMsg" style="color: red">{{ errorMsg }}</span>
    </div>

    <div v-if="products.length">
      <h3>商品清單（資料庫）</h3>
      <table>
        <thead>
          <tr>
            <th>商品編號</th>
            <th>商品名稱</th>
            <th>售價</th>
            <th>庫存</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in products" :key="index">
            <td>{{ item.id }}</td>
            <td>{{ item.name }}</td>
            <td>{{ item.price }}</td>
            <td>{{ item.reserve }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.add-product {
  max-width: 500px;
  margin: 0 auto;
}
.form-item {
  margin-bottom: 10px;
}
label {
  display: inline-block;
  width: 100px;
}
input {
  width: 200px;
  padding: 5px;
}
button {
  background-color: #42b883;
  border: none;
  color: white;
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 5px;
}
button:hover {
  background-color: #2e9d6b;
}
table {
  width: 100%;
  margin-top: 20px;
  border-collapse: collapse;
}
th,
td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: center;
}
</style>
