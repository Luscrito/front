<template>
  <el-dialog v-model="dialogVisible" title="资源配置" width="600px">
    <el-form :model="form" label-width="120px">
      <el-form-item label="选择节点" required>
        <el-select
            v-model="form.containerName"
            placeholder="请选择节点"
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

      <el-form-item label="内存 (字节)" prop="memory">
        <el-input v-model="form.memory" type="number" placeholder="内存大小" :min="0" step="1" />
      </el-form-item>

      <el-form-item label="交换内存 (字节)" prop="memorySwap">
        <el-input v-model="form.memorySwap" type="number" placeholder="交换内存大小" :min="0" step="1" />
      </el-form-item>

      <el-form-item label="CPU 配额" prop="cpuQuota">
        <el-input v-model="form.cpuQuota" type="number" placeholder="CPU 配额" :min="0" step="1" />
      </el-form-item>

      <el-form-item label="CPU 周期" prop="cpuPeriod">
        <el-input v-model="form.cpuPeriod" type="number" placeholder="CPU 周期" :disabled="true" />
      </el-form-item>

      <el-form-item label="CPU 共享" prop="cpuShares">
        <el-input v-model="form.cpuShares" type="number" placeholder="CPU 共享" :min="0" step="1" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button type="primary" @click="submit">提交</el-button>
      <el-button @click="dialogVisible = false">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import {ref, defineExpose, onMounted, computed} from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const dialogVisible = ref(false)
const form = ref({
  containerName: '',  // 这里初始化为空
  memory: null,
  memorySwap: null,
  cpuQuota: null,
  cpuPeriod: 100000,  // 默认值
  cpuShares: 1024  // 默认值
})
const containers = ref([])

// 获取节点列表
const fetchContainers = async () => {
  try {
    const response = await axios.get('http://localhost:8081/container/list')
    containers.value = response.data || []
  } catch (err) {
    ElMessage.error('获取节点列表失败')
  }
}

// 提交表单，更新节点资源
const submit = async () => {
  if (!form.value.containerName) {
    ElMessage.warning('请选择节点')
    return
  }

  try {
    await axios.post('http://localhost:8081/parameter/update', null, {
      params: {
        containerName: form.value.containerName,
        memory: form.value.memory,
        memorySwap: form.value.memorySwap,
        cpuQuota: form.value.cpuQuota,
        cpuPeriod: form.value.cpuPeriod,
        cpuShares: form.value.cpuShares
      }
    })
    ElMessage.success('资源配置成功')
    dialogVisible.value = false
  } catch (err) {
    ElMessage.error('资源配置失败')
  }
}

// 初始化节点列表
onMounted(() => {
  fetchContainers()
})

// 暴露给外部调用
defineExpose({
  openDialog: () => {
    dialogVisible.value = true
    form.value.containerName = ''// 重置节点选择为空
    form.value.cpuPeriod = 100000
    form.value.cpuShares = 1024
    form.value.cpuQuota = null
    form.value.memory = null
    form.value.memorySwap = null
    fetchContainers()  // 每次打开时重新获取节点列表
  }
})

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
