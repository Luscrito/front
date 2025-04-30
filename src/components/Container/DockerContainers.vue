<script setup>
import { ref, onMounted, defineExpose } from 'vue'
import axios from 'axios'

const containers = ref([])

// 获取容器列表的方法
const fetchContainers = async () => {
  try {
    const res = await axios.get('http://localhost:8081/container/list')
    containers.value = res.data
  } catch (err) {
    console.error('获取节点列表失败', err)
  }
}

// 暴露方法供外部调用
defineExpose({
  fetchContainers,
  containers
})

onMounted(() => {
  fetchContainers() // 页面加载时调用
})
</script>
