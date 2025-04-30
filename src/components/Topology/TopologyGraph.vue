<template>
  <div class="topology-graph">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>节点网络拓扑图</span>
          <div class="action-group">
            <el-button
                type="primary"
                size="small"
                :disabled="selectedNodes.length !== 2"
                @click="handleAddConnection"
            >
              添加关系
            </el-button>
            <el-button
                type="danger"
                size="small"
                :disabled="selectedNodes.length !== 2"
                @click="handleRemoveConnection"
            >
              删除关系
            </el-button>
            <el-button
                type="primary"
                size="small"
                @click="addContainerDialogRef.openDialog()"
            >
              添加节点
            </el-button>
            <el-button
                type="danger"
                size="small"
                :disabled="selectedNodes.length === 0"
                @click="handleDeleteContainers"
            >
              删除节点
            </el-button>
            <el-button
                type="info"
                size="small"
                @click="fetchTopology"
                :loading="isLoading"
                style="margin-left: 8px"
            >
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <div
          ref="chartRef"
          :style="{
          width: '100%',
          height: containerHeight + 'px'
        }"
          v-loading="isLoading"
      ></div>
    </el-card>
  </div>
  <AddContainerDialog ref="addContainerDialogRef" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'
import _ from 'lodash'
import { ElMessage } from 'element-plus'
import AddContainerDialog from "@/components/Container/AddContainerDialog.vue";

const addContainerDialogRef = ref(null)
const selectedNodes = ref([])
const chartRef = ref(null)
const containerHeight = ref(500)
let chartInstance = null
const isLoading = ref(false)

const fetchTopology = _.debounce(async () => {
  try {
    isLoading.value = true
    const response = await axios.get('http://localhost:8081/topology/get')
    renderGraph(response.data.nodes, response.data.links)
  } catch (error) {
    console.error('获取拓扑数据失败:', error)
  } finally {
    isLoading.value = false
  }
}, 500)

const renderGraph = (nodes, links) => {
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }
  const option = {
    tooltip: {},
    series: [{
      type: 'graph',
      layout: 'force',
      roam: true,
      label: {
        show: true,
        fontSize: 10,
        position: 'right',
        distance: 5
      },
      force: {
        repulsion: 1000,
        edgeLength: [30, 80],
        gravity: 0.2,
        layoutAnimation: true
      },
      lineStyle: {
        width: 1.2
      },
      data: nodes.map(n => ({
        id: n.id,
        name: n.name,
        symbolSize: 28,
        itemStyle: {
          color: '#409EFF'
        }
      })),
      links: links.map(l => ({
        source: l.source,
        target: l.target
      }))
    }]
  }

  chartInstance.off('click')
  chartInstance.on('click', params => {
    if (params.dataType === 'node') {
      handleNodeClick(params.data)
    }
  })
  chartInstance.setOption(option)
}

const handleNodeClick = (nodeData) => {
  const index = selectedNodes.value.findIndex(n => n.id === nodeData.id)
  if (index > -1) {
    selectedNodes.value.splice(index, 1)
  } else {
    selectedNodes.value.push(nodeData)
  }
  updateNodeStyle()
}

const updateNodeStyle = () => {
  const option = chartInstance.getOption()
  option.series[0].data = option.series[0].data.map(node => ({
    ...node,
    itemStyle: {
      color: selectedNodes.value.some(n => n.id === node.id)
          ? '#67C23A'
          : '#409EFF'
    }
  }))
  chartInstance.setOption(option)
}

// 新增：删除选中的节点
const handleDeleteContainers = async () => {
  try {
    if (selectedNodes.value.length === 0) {
      ElMessage.warning('请至少选择一个节点')
      return
    }

    const containerNames = selectedNodes.value.map(node => node.name)

    await axios.delete('http://localhost:8081/container/delete3', {
      data: containerNames
    })

    ElMessage.success('节点删除成功')
    clearSelection()
    await fetchTopology()
  } catch (error) {
    ElMessage.error('删除失败: ' + error.message)
  }
}

const handleAddConnection = async () => {
  try {
    const [node1, node2] = selectedNodes.value
    await axios.post('http://localhost:8081/container/connect', null, {
      params: {
        container1: node1.name,
        container2: node2.name
      }
    })
    ElMessage.success('关系添加成功')
    clearSelection()
    await fetchTopology()
  } catch (error) {
    ElMessage.error('操作失败: ' + error.message)
  }
}

const handleRemoveConnection = async () => {
  try {
    const [node1, node2] = selectedNodes.value
    await axios.post('http://localhost:8081/container/disconnect2', null, {
      params: {
        container1: node1.name,
        container2: node2.name
      }
    })
    ElMessage.success('关系删除成功')
    clearSelection()
    await fetchTopology()
  } catch (error) {
    ElMessage.error('操作失败: ' + error.message)
  }
}

const clearSelection = () => {
  selectedNodes.value = []
  updateNodeStyle()
}

const handleResize = () => {
  if (chartRef.value?.parentElement) {
    const parentHeight = chartRef.value.parentElement.offsetHeight
    containerHeight.value = Math.min(500, parentHeight * 0.8)
  }
  chartInstance?.resize()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  fetchTopology()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>


<style scoped>
.topology-graph {
  width: 100%;
  height: 100%;
  min-height: 500px;
  box-sizing: border-box;
}

:deep(.el-card__header) {
  padding: 10px 16px !important;
}

:deep(.el-card) {
  height: 100%;
}

:deep(.el-card__body) {
  height: calc(100% - 50px);
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
}

.action-group {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
