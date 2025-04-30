<template>
  <el-dialog title="一键动态配置" v-model="dialogVisible" width="500px">
    <el-form label-width="100px">
      <el-form-item label="目标节点">
        <el-select
            v-model="selectedContainers"
            placeholder="请选择一个或多个节点"
            multiple
            style="width: 100%"
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
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button type="primary" @click="handleConfigure">配 置</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>

    <!-- 用于获取节点列表 -->
    <DockerContainers ref="containersRef" />
  </el-dialog>
</template>

<script setup>
import {ref, nextTick, defineExpose, computed} from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import DockerContainers from '@/components/Container/DockerContainers.vue'

const dialogVisible = ref(false)
const selectedContainers = ref([]) // 改为数组
const containers = ref([])
const containersRef = ref(null)

const openDialog = async () => {
  selectedContainers.value = [] // 每次打开清空选择
  dialogVisible.value = true
  await nextTick()
  if (containersRef.value) {
    await containersRef.value.fetchContainers()
    containers.value = containersRef.value.containers || []
  }
}

const handleConfigure = async () => {
  if (!selectedContainers.value.length) {
    ElMessage.warning('请至少选择一个节点')
    return
  }

  try {
    await axios.post('http://localhost:8081/bird/actives', selectedContainers.value)
    ElMessage.success('批量动态配置成功')
    dialogVisible.value = false
  } catch (err) {
    console.error('配置失败', err)
    ElMessage.error('配置失败')
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

.route-item {
  background: #f9f9f9;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px dashed #ccc;
  border-radius: 6px;
}
</style>
