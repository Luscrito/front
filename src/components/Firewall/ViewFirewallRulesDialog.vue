<template>
  <el-dialog
      v-model="dialogVisible"
      title="查看防火墙规则"
      width="800px"
      @close="rules = []"
  >
    <!-- 节点选择 -->
    <el-form :inline="true" class="mb-4">
      <el-form-item label="节点名称" required>
        <el-select v-model="containerName" placeholder="选择节点" clearable filterable class="full-width">
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
      </el-form-item>

      <el-form-item label="链名称" required>
        <el-select v-model="chain" placeholder="选择链" style="width: 160px">
          <el-option label="INPUT" value="INPUT" />
          <el-option label="OUTPUT" value="OUTPUT" />
          <el-option label="FORWARD" value="FORWARD" />
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleViewRules">查看</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格展示 -->
    <el-table :data="rules" v-loading="loading" style="width: 100%">
      <el-table-column label="#" type="index" width="50" />
      <el-table-column
          v-for="(header, idx) in headers"
          :key="idx"
          :prop="'field' + idx"
          :label="header"
      />
    </el-table>

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>

    <DockerContainers ref="containersRef" style="display: none" />
  </el-dialog>
</template>

<script setup>
import {ref, defineExpose, nextTick, computed} from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import DockerContainers from '@/components/Container/DockerContainers.vue'

const dialogVisible = ref(false)
const containerName = ref('')
const chain = ref('')
const rules = ref([])
const loading = ref(false)
const containers = ref([])
const containersRef = ref(null)
const headers = ref([])

// 弹窗打开时初始化
const openDialog = async () => {
  dialogVisible.value = true
  containerName.value = ''  // 重置节点名称
  chain.value = ''  // 重置链名称
  await nextTick()
  if (containersRef.value) {
    await containersRef.value.fetchContainers()
    containers.value = containersRef.value.containers || []
  }
}
defineExpose({ openDialog })

const handleViewRules = async () => {
  if (!containerName.value) {
    ElMessage.warning('请选择节点')
    return
  }

  loading.value = true
  try {
    const response = await axios.get('http://localhost:8081/firewall/list', {
      params: {
        containerName: containerName.value,
        chain: chain.value,
      },
    })

    const lines = response.data
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)

    if (lines.length < 2) {
      rules.value = []
      headers.value = []
      return
    }

    // 第二行作为表头字段
    const headerLine = lines[1]
    headers.value = headerLine.split(/\s+/)

    // 剩下的作为数据
    const ruleLines = lines.slice(2)
    rules.value = ruleLines.map(line => {
      const parts = line.split(/\s+/)
      const obj = {}
      parts.forEach((p, idx) => {
        obj[`field${idx}`] = p
      })
      return obj
    })

  } catch (err) {
    ElMessage.error(`获取规则失败：${err?.response?.data || err.message}`)
  } finally {
    loading.value = false
  }
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

</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}

.full-width {
  width: 100%;
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
</style>
