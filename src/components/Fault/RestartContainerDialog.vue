<template>
  <el-dialog
      title="定时节点维护"
      v-model="dialogVisible"
      width="500px"
      @closed="handleClose"
  >
    <el-form
        ref="formRef"
        :model="formData"
        label-width="120px"
        label-position="top"
        class="schedule-form"
        :rules="rules"
    >
      <!-- 节点选择 -->
      <el-form-item label="目标节点" prop="containerName">
        <el-select
            v-model="formData.containerName"
            placeholder="请选择节点"
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
              <span :class="['status', container.status.includes('Up') ? 'running' : 'stopped']">
                {{ formatStatus(container.status) }}
              </span>
            </span>
          </el-option>
        </el-select>
      </el-form-item>

      <!-- 时间设置 -->
      <el-form-item label="维护时长" prop="duration">
        <div class="duration-wrapper">
          <el-input-number
              v-model="formData.duration"
              :min="1"
              :max="1440"
              controls-position="right"
              class="duration-input"
          />
          <el-select
              v-model="formData.unit"
              class="unit-select"
          >
            <el-option label="分钟" value="minutes" />
            <el-option label="小时" value="hours" />
          </el-select>
        </div>
        <div class="hint-text">
          预计恢复时间：{{ calculatedRestoreTime || '--' }}
        </div>
      </el-form-item>

      <!-- 状态提示 -->
      <transition name="el-zoom-in-top">
        <div v-if="scheduleStatus" class="status-message">
          <el-icon :class="statusIconClass"><component :is="statusIcon" /></el-icon>
          {{ scheduleStatus }}
        </div>
      </transition>
    </el-form>

    <template #footer>
      <el-button
          type="primary"
          :loading="isProcessing"
          @click="handleSubmit"
      >
        {{ confirmButtonText }}
      </el-button>
      <el-button @click="dialogVisible = false">取消</el-button>
    </template>

    <DockerContainers ref="containersRef" />
  </el-dialog>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, nextTick, defineExpose } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import DockerContainers from "@/components/Container/DockerContainers.vue"

const dialogVisible = ref(false)
const formRef = ref(null)
const containersRef = ref(null)
const isProcessing = ref(false)

// 表单数据
const formData = ref({
  containerName: '',
  duration: 30,
  unit: 'minutes'
})

// 状态跟踪
const scheduleStatus = ref('')
const currentTask = ref(null)

// 验证规则
const rules = {
  containerName: [{
    required: true,
    message: '请选择需要维护的节点',
    trigger: 'blur'
  }],
  duration: [
    { required: true, message: '请输入维护时长', trigger: 'blur' },
    {
      validator: (_, value, callback) => {
        if (value < 1) {
          callback(new Error('时长不能小于1分钟'))
        } else if (value > 1440) {
          callback(new Error('时长不能超过24小时'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 计算属性
const availableContainers = computed(() => {
  return (containersRef.value?.containers || [])
      .filter(c => c.status?.includes('Up')) // 使用状态字段判断
})

const calculatedRestoreTime = computed(() => {
  if (!formData.value.duration) return ''
  const minutes = formData.value.unit === 'hours'
      ? formData.value.duration * 60
      : formData.value.duration
  const date = new Date(Date.now() + minutes * 60000)
  return date.toLocaleString()
})

const statusIcon = computed(() => {
  return currentTask.value?.type === 'stop' ? 'CircleClose' : 'SuccessFilled'
})

const statusIconClass = computed(() => {
  return currentTask.value?.status === 'error' ? 'error-icon' : 'success-icon'
})

const confirmButtonText = computed(() => {
  return currentTask.value ? '取消任务' : '提交计划'
})

// 方法
const formatContainerName = (name) => {
  return name.startsWith('/') ? name.slice(1) : name
}

const formatStatus = (status) => {
  if (status?.includes('Up')) return '运行中'
  if (status?.includes('Exited')) return '已停止'
  return status || '未知状态'
}

const handleSubmit = async () => {
  if (currentTask.value) {
    clearTimeout(currentTask.value.timer)
    currentTask.value = null
    scheduleStatus.value = '任务已取消'
    setTimeout(() => scheduleStatus.value = '', 3000)
    return
  }

  try {
    await formRef.value.validate()
    isProcessing.value = true

    // 停止节点
    await axios.post(
        `http://localhost:8081/container/stop/${encodeURIComponent(formData.value.containerName)}`
    )

    // 设置定时启动
    const minutes = formData.value.unit === 'hours'
        ? formData.value.duration * 60
        : formData.value.duration
    const timeout = minutes * 60000

    currentTask.value = {
      container: formData.value.containerName,
      timer: setTimeout(async () => {
        try {
          await axios.post(
              `http://localhost:8081/container/start/${encodeURIComponent(formData.value.containerName)}`
          )
          scheduleStatus.value = '节点已自动重启'
        } catch (err) {
          scheduleStatus.value = '自动重启失败，请手动操作'
          console.error('启动失败:', err)
        }
        currentTask.value = null
      }, timeout),
      type: 'stop',
      status: 'pending'
    }

    scheduleStatus.value = `已停止节点，预计 ${formData.value.duration} ${formData.value.unit === 'minutes' ? '分钟' : '小时'}后重启`
    ElMessage.success('维护计划已启动')
    dialogVisible.value = false
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error(`操作失败: ${error.response?.data || error.message}`)
    currentTask.value = null
  } finally {
    isProcessing.value = false
  }
}

const handleClose = () => {
  formRef.value?.resetFields()
  scheduleStatus.value = ''
}

// 生命周期
onBeforeUnmount(() => {
  clearTimeout(currentTask.value?.timer)
})

// 暴露方法
const openDialog = async () => {
  dialogVisible.value = true
  await nextTick()
  containersRef.value?.fetchContainers()
}

defineExpose({ openDialog })
</script>

<style scoped>
.schedule-form {
  padding: 20px 30px;
}

.full-width {
  width: 100%;
}

.duration-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
}

.duration-input {
  width: 140px;
}

.unit-select {
  width: 100px;
}

.hint-text {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.status-message {
  padding: 12px;
  background: #f8f8f8;
  border-radius: 4px;
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
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

.status.stopped {
  color: #F56C6C;
  background: #fef0f0;
}
</style>