<template>
  <el-dialog v-model="dialogVisible" title="节点详情" width="500px">
    <div v-if="container">
      <p><strong>节点名：</strong>{{ container.name.replace(/^\//, '') }}</p>
      <p><strong>镜像：</strong>{{ container.image }}</p>
      <p><strong>ID：</strong>{{ container.id }}</p>
      <p><strong>状态：</strong>{{ container.status }}</p>

      <p v-if="Object.keys(containerIpMap).length">
        <strong>IP 地址：</strong><br />
        <span
            v-for="(ip, net) in containerIpMap"
            :key="net"
        >{{ net }}: {{ ip }}<br /></span>
      </p>

      <div class="btn-group">
        <el-button
            v-if="container.status.includes('Up')"
            type="danger"
            @click="handleStop"
        >
          停止节点
        </el-button>
        <el-button
            v-else
            type="success"
            @click="handleStart"
        >
          启动节点
        </el-button>
      </div>
    </div>
    <div v-else>暂无节点信息</div>

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, defineExpose } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const dialogVisible = ref(false)
const container = ref(null)
const containerIpMap = ref({})

async function openDialog(containerData) {
  container.value = containerData
  containerIpMap.value = {}
  dialogVisible.value = true
  await fetchIp()
}

async function fetchIp() {
  try {
    const name = container.value.name.replace(/^\//, '')
    const response = await axios.get(`http://localhost:8081/container/ip/${name}`)
    containerIpMap.value = response.data
  } catch (err) {
    ElMessage.error(`获取节点 IP 失败：${err?.response?.data || err.message}`)
  }
}

async function handleStart() {
  const name = container.value.name.replace(/^\//, '')
  try {
    await axios.post(`http://localhost:8081/container/start/${name}`)
    ElMessage.success('节点启动成功')
    container.value.status = 'Up' // 临时标记，可替换为实际状态
    await fetchIp()
  } catch (err) {
    ElMessage.error(`启动节点失败：${err?.response?.data || err.message}`)
  }
}

async function handleStop() {
  const name = container.value.name.replace(/^\//, '')
  try {
    await axios.post(`http://localhost:8081/container/stop/${name}`)
    ElMessage.success('节点已停止')
    container.value.status = 'Exited' // 临时标记，可替换为实际状态
    containerIpMap.value = {}
  } catch (err) {
    ElMessage.error(`停止节点失败：${err?.response?.data || err.message}`)
  }
}

defineExpose({
  openDialog
})
</script>

<style scoped>
.btn-group {
  margin-top: 12px;
}
</style>
