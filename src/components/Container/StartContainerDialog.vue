<template>
  <el-dialog title="启动节点" v-model="dialogVisible" width="600px">
    <el-form :model="container" label-width="100px" class="container-form">
      <el-form-item label="节点名称" prop="name">
        <el-select
            v-model="container.name"
            placeholder="请选择要启动的节点"
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
              <span class="status stopped">
                {{ formatStatus(container.status) }}
              </span>
            </span>
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button type="primary" @click="submitStart">立即启动</el-button>
      <el-button @click="dialogVisible = false">取消操作</el-button>
    </template>
    <DockerContainers ref="containersRef" />
  </el-dialog>
</template>

<script setup>
import { ref, computed, nextTick, defineExpose } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import DockerContainers from "@/components/Container/DockerContainers.vue"

const dialogVisible = ref(false)
const container = ref({ name: '' })
const containersRef = ref(null)

// 计算可用容器列表（仅非运行状态）
const availableContainers = computed(() => {
  return (containersRef.value?.containers || [])
      .filter(c => !c.status?.includes('Up'))  // 反向过滤条件
})

// 格式化容器名称
const formatContainerName = (name) => {
  return name.startsWith('/') ? name.slice(1) : name
}

// 格式化状态显示
const formatStatus = (status) => {
  if (status?.includes('Exited')) return '已停止'
  if (status?.includes('Created')) return '已创建'
  return status || '未知状态'
}

// 打开弹窗时刷新列表
const openDialog = async () => {
  container.value.name = ''
  dialogVisible.value = true
  await nextTick()
  containersRef.value?.fetchContainers()
}

// 提交启动请求
const submitStart = async () => {
  if (!container.value.name) {
    ElMessage.warning('请选择要启动的节点')
    return
  }

  try {
    const response = await axios.post(
        `http://localhost:8081/container/start/${encodeURIComponent(container.value.name)}`
    )
    dialogVisible.value = false
    ElMessage.success(`启动成功：${response.data}`)
    containersRef.value?.fetchContainers()  // 启动后刷新列表
  } catch (error) {
    console.error('启动节点出错：', error)
    ElMessage.error('启动失败：' + (error.response?.data || error.message))
  }
}

defineExpose({ openDialog })
</script>

<style scoped>
.container-form {
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

.status.stopped {
  color: #F56C6C;
  background: #fef0f0;
}
</style>