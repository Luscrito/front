<template>
  <el-dialog title="重置 BIRD 配置" v-model="dialogVisible" width="500px">
    <el-form label-width="100px">
      <el-form-item label="目标节点">
        <el-select v-model="selectedContainer" placeholder="请选择节点"
                   clearable
                   filterable
                   class="full-width">
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
    </el-form>

    <template #footer>
      <el-button type="danger" @click="handleReset">重置配置</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>

    <!-- 获取节点列表 -->
    <DockerContainers ref="containersRef" />
  </el-dialog>
</template>

<script setup>
import {ref, nextTick, defineExpose, computed} from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import DockerContainers from '@/components/Container/DockerContainers.vue'

const dialogVisible = ref(false)
const selectedContainer = ref('')
const containers = ref([])
const containersRef = ref(null)

const openDialog = async () => {
  dialogVisible.value = true
  selectedContainer.value = ''
  await nextTick()
  if (containersRef.value) {
    await containersRef.value.fetchContainers()
    containers.value = containersRef.value.containers || []
  }
}

const handleReset = async () => {
  if (!selectedContainer.value) {
    ElMessage.warning('请选择一个节点')
    return
  }

  try {
    await axios.post(`http://localhost:8081/bird/reset?containerName=${selectedContainer.value}`)
    ElMessage.success('重置成功')
    dialogVisible.value = false
  } catch (err) {
    console.error('重置失败', err)
    ElMessage.error('重置失败')
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

defineExpose({ openDialog })
</script>

<style scoped>

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
