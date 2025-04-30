<template>
  <el-dialog
      v-model="dialogVisible"
      title="清空防火墙规则"
      width="400px"
      @close="resetForm"
  >
    <div>
      <p>确定要清空防火墙规则吗？</p>
      <el-form :inline="true" class="mb-4">
        <el-form-item label="节点名称" required>
          <el-select v-model="containerName" placeholder="请选择节点"
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
    </div>

    <template #footer>
      <el-button type="primary" @click="handleClearAll" >确定</el-button>
      <el-button @click="dialogVisible = false">取消</el-button>
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
const containers = ref([])
const containersRef = ref(null)

// 弹窗打开时初始化
const openDialog = async () => {
  dialogVisible.value = true
  containerName.value = '' // 重置节点名称
  await nextTick()
  if (containersRef.value) {
    await containersRef.value.fetchContainers()
    containers.value = containersRef.value.containers || []
  }
}
defineExpose({ openDialog })

// 清空防火墙规则
const handleClearAll = async () => {
  if (!containerName.value) {
    ElMessage.warning('请选择节点')
    return
  }

  try {
    await axios.delete('http://localhost:8081/firewall/clearAll', {
      params: { containerName: containerName.value },
    })

    ElMessage.success('规则已成功清空')
    dialogVisible.value = false
  } catch (err) {
    ElMessage.error(`清空规则失败：${err?.response?.data || err.message}`)
  }
}

// 弹窗关闭时重置表单
const resetForm = () => {
  containerName.value = ''
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

.route-form {
  padding: 20px 30px;
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
