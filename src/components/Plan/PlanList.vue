<template>
  <div class="plan-section">
    <div v-if="plansRef.length === 0" class="text-center text-gray-500">暂无数据</div>
    <div class="table-wrapper">
      <el-table :data="plansRef" style="width: 100%">
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="button-group">
              <el-button size="small" type="primary" @click="viewPlan(row)">查看</el-button>
              <el-button size="small" type="success" @click="executePlan(row)">执行</el-button>
              <el-button size="small" type="danger" @click="deletePlan(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="#" type="index" width="40" />
        <el-table-column label="名称" prop="name" width="150" />
        <el-table-column label="类型" prop="type" width="75" />
      </el-table>
    </div>

    <!-- Plan Detail Dialog -->
    <el-dialog v-model="dialogVisible" title="计划详情" width="500px" :close-on-click-modal="false">
      <div v-if="selectedPlan">
        <p><strong>ID:</strong> {{ selectedPlan.id }}</p>
        <p><strong>名称:</strong> {{ selectedPlan.name }}</p>
        <p><strong>类型:</strong> {{ selectedPlan.type }}</p>
        <p><strong>大小:</strong> {{ selectedPlan.size }}</p>
        <p><strong>时间:</strong> {{ selectedPlan.time }}</p>
        <p><strong>数量:</strong> {{ selectedPlan.num }}</p>
        <p><strong>速度:</strong> {{ selectedPlan.velocity }}</p>
        <p><strong>节点1:</strong> {{ selectedPlan.container1 }}</p>
        <p><strong>节点2:</strong> {{ selectedPlan.container2 }}</p>
        <p><strong>节点2 IP:</strong> {{ selectedPlan.container2Ip }}</p>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
  <!-- 实时日志输出区域 -->
  <div v-if="logsRef.length" class="log-panel">
    <h3>执行日志：</h3>
    <div class="log-messages">
      <div v-for="(log, index) in logsRef" :key="index" class="log-line">
        {{ log }}
      </div>
    </div>
  </div>

</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const plansRef = ref([])
const dialogVisible = ref(false)
const selectedPlan = ref(null)
const logsRef = ref([]) // 🆕 存储实时日志

const fetchPlans = async () => {
  try {
    const response = await axios.get('http://localhost:8081/plan/list')
    plansRef.value = response.data.records || []
  } catch (error) {
    ElMessage.error('获取计划数据失败')
    console.error(error)
  }
}

const refreshPlans = () => {
  fetchPlans()
}

let intervalId = null
onMounted(() => {
  intervalId = setInterval(() => {
    refreshPlans()
  }, 1000)
})

onBeforeUnmount(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
  closeSocket()
})

const viewPlan = (plan) => {
  selectedPlan.value = plan
  dialogVisible.value = true
}

// --- WebSocket 相关 ---
let socket = null

const openSocket = () => {
  if (socket) return // 防止重复打开
  socket = new WebSocket('ws://localhost:8081/ws/log')

  socket.onopen = () => {
    console.log('WebSocket连接已打开')
    logsRef.value.push('[系统] WebSocket连接已建立')
  }

  socket.onmessage = (event) => {
    console.log('收到消息:', event.data)
    logsRef.value.push(event.data)
  }

  socket.onclose = () => {
    console.log('WebSocket连接已关闭')
    logsRef.value.push('[系统] WebSocket连接已关闭')
    socket = null
  }

  socket.onerror = (error) => {
    console.error('WebSocket出错:', error)
    logsRef.value.push('[系统] WebSocket发生错误')
  }
}

const closeSocket = () => {
  if (socket) {
    socket.close()
    socket = null
  }
}
// --- WebSocket 相关 ---

const executePlan = async (plan) => {
  try {
    let url = ''
    let params = {}

    switch (plan.type) {
      case 'HTTP':
        url = 'http://localhost:8081/test/http'
        params = {
          container1: plan.container1,
          container2Ip: plan.container2Ip
        }
        break
      case 'TCP':
        url = 'http://localhost:8081/test/tcp'
        params = {
          container1: plan.container1,
          container2: plan.container2,
          container2Ip: plan.container2Ip,
          size: plan.size,
          time: plan.time
        }
        break
      case 'UDP':
        url = 'http://localhost:8081/test/udp'
        params = {
          container1: plan.container1,
          container2: plan.container2,
          container2Ip: plan.container2Ip,
          velocity: plan.velocity,
          size: plan.size
        }
        break
      case 'NETCAT':
        url = 'http://localhost:8081/test/netcat'
        params = {
          container1: plan.container1,
          container2Ip: plan.container2Ip
        }
        break
      case 'PING':
        url = 'http://localhost:8081/test/ping'
        params = {
          container1: plan.container1,
          container2Ip: plan.container2Ip,
          size: plan.size,
          num: plan.num
        }
        break
      default:
        ElMessage.warning(`未知的测试类型: ${plan.type}`)
        return
    }

    // 每次执行，清空旧日志，打开socket监听
    logsRef.value = []
    openSocket()

    const response = await axios.post(url, null, {
      params: params
    })
    ElMessage.success(`执行指令已发送：${response.data}`)
  } catch (error) {
    ElMessage.error(`执行失败：${error.message ?? error}`)
    console.error(error)
  }
}

const deletePlan = async (plan) => {
  try {
    await ElMessageBox.confirm(
        `确定要删除计划「${plan.name}」吗？`,
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
    )
    await axios.delete(`http://localhost:8081/plan/delete/${plan.id}`)
    ElMessage.success(`已删除计划: ${plan.name}`)
    refreshPlans()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}
</script>

<style scoped>
.plan-section {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

.table-wrapper {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
}

.el-table th {
  background-color: #f1f5f9;
  color: #333;
  font-weight: bold;
}

.text-center {
  text-align: center;
}

.button-group {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
}

.log-panel {
  margin-top: 20px;
  background: #f7fafc;
  padding: 10px;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.log-messages {
  font-family: monospace;
  font-size: 14px;
}

.log-line {
  padding: 2px 0;
  white-space: pre-wrap;
}

</style>
