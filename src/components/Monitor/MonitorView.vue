<template>
  <div class="monitor-container">
    <!-- 节点选择器，只有当 containers 不为空时才渲染 -->
    <el-select
        v-if="containers.length > 0"
        v-model="selectedContainer"
        placeholder="选择节点"
        @change="startMonitoring"
        clearable
        filterable
        class="full-width"
    >
      <el-option
          v-for="container in availableContainers"
          :key="container.id"
          :value="formatContainerName(container.name)"
      >
            <span class="container-option">
              <span class="name">{{ formatContainerName(container.name) }}</span>
              <span class="status running">
                {{ formatStatus(container.status) }}
              </span>
            </span>
      </el-option>
    </el-select>
    <el-button
        type="primary"
        @click="fetchContainers"
        class="refresh-button"
    >
      <i class="el-icon-refresh"></i>
      刷新节点列表
    </el-button>

    <!-- 节点图表，使用 flexbox 横向排列 -->
    <div class="charts-container">
      <!-- 带宽图表 -->
      <div ref="bandwidthChartRef" style="height: 300px; flex: 1; margin-right: 20px;"></div>

      <!-- 网络收发图表 -->
      <div ref="networkChartRef" style="height: 300px; flex: 1;"></div>
    </div>
  </div>

  <DockerContainers ref="dockerContainersRef" />
</template>

<script setup>
import {ref, onMounted, onBeforeUnmount, computed} from 'vue'
import DockerContainers from '@/components/Container/DockerContainers.vue' // 修改为你的实际路径
import axios from 'axios'
import * as echarts from 'echarts'

// refs
const dockerContainersRef = ref(null)
const containers = ref([])  // 节点列表
const selectedContainer = ref('')  // 当前选中的节点
const bandwidthChartRef = ref(null)
const networkChartRef = ref(null)
const bandwidthRxData = ref([])
const bandwidthTxData = ref([])

let bandwidthChart = null
let networkChart = null
let intervalId = null

// 图表数据
const timeData = ref([])
const bandwidthData = ref([])
const rxData = ref([])
const txData = ref([])


const fetchContainers = async () => {
  if (dockerContainersRef.value) {
    await dockerContainersRef.value.fetchContainers()
    containers.value = dockerContainersRef.value.containers
  }
}

// 开始监控
const startMonitoring = () => {
  clearInterval(intervalId)

  timeData.value = []
  bandwidthData.value = []
  rxData.value = []
  txData.value = []
  bandwidthRxData.value = []
  bandwidthTxData.value = []

  updateCharts()

  intervalId = setInterval(async () => {
    if (!selectedContainer.value) return

    const timestamp = new Date().toLocaleTimeString()

    try {
      const bandwidthRes = await axios.get(`http://localhost:8081/stats/bandwidth/${selectedContainer.value}?interval=1000`)
      const statsRes = await axios.get(`http://localhost:8081/stats/networkStats/${selectedContainer.value}`)

      timeData.value.push(timestamp)
      bandwidthRxData.value.push(bandwidthRes.data.rxBytesPerSec)
      bandwidthTxData.value.push(bandwidthRes.data.txBytesPerSec)
      rxData.value.push(statsRes.data.rxBytes)
      txData.value.push(statsRes.data.txBytes)

      if (timeData.value.length > 20) {
        timeData.value.shift()
        bandwidthData.value.shift()
        rxData.value.shift()
        txData.value.shift()
      }

      updateCharts()
    } catch (err) {
      console.error('监控数据获取失败', err)
    }
  }, 1000)
}

// 更新图表
const updateCharts = () => {
  if (!bandwidthChart || !networkChart) {
    bandwidthChart = echarts.init(bandwidthChartRef.value)
    networkChart = echarts.init(networkChartRef.value)
  }

  bandwidthChart.setOption({
    title: { text: '节点带宽使用率 (Bytes/s)' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: timeData.value },
    yAxis: { type: 'value' },
    series: [
      {
        data: bandwidthRxData.value,
        type: 'line',
        name: '下载速率 RX',
        smooth: true,
        areaStyle: {}
      },
      {
        data: bandwidthTxData.value,
        type: 'line',
        name: '上传速率 TX',
        smooth: true,
        areaStyle: {}
      }
    ]
  })

  networkChart.setOption({
    title: { text: '网络收发字节数 (累计)' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: timeData.value },
    yAxis: { type: 'value' },
    series: [
      {
        data: rxData.value,
        type: 'line',
        name: '接收字节 RX',
        smooth: true
      },
      {
        data: txData.value,
        type: 'line',
        name: '发送字节 TX',
        smooth: true
      }
    ]
  })
}

// 计算可用的运行中节点
const availableContainers = computed(() => {
  return containers.value.filter(c => c.status?.includes('Up'))
})

const formatContainerName = (name) => {
  return name.replace(/^\//, '')
}

const formatStatus = (status) => {
  return status?.includes('Up') ? '运行中' : '已停止'
}

// 移除自动刷新相关的定时器逻辑
onMounted(async () => {
  // 仅保留初次加载
  await fetchContainers()
})


// 清理定时器，防止内存泄漏
onBeforeUnmount(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<style scoped>
.monitor-container {
  padding: 10px;
}

/* 使用 flexbox 来让两个图表横向排列 */
.charts-container {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.full-width {
  width: 80%;
}

.container-option {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.status.running {
  color: #67C23A;
  background: #f0f9eb;
}
   /* 添加图表节点最小宽度 */
.charts-container > div {
  min-width: 300px;
}
</style>
