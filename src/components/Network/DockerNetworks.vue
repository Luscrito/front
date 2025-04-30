<script setup>
import { ref, onMounted, defineExpose } from 'vue'
import axios from 'axios'

const networks = ref({})

const fetchNetworks = async () => {
  try {
    const res = await axios.get('http://localhost:8081/network/list')
    networks.value = res.data
  } catch (err) {
    console.error('获取网络列表失败', err)
  }
}

// 暴露方法供外部调用
defineExpose({
  fetchNetworks,
  networks
})

onMounted(() => {
  fetchNetworks()
})
</script>
