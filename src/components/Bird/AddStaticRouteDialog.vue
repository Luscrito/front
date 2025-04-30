<template>
  <el-dialog title="添加静态路由" v-model="dialogVisible" width="600px">
    <el-form :model="form" label-width="100px" class="route-form">
      <el-form-item label="目标节点" required>
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

      <!-- 路由条目部分保持不变 -->
      <div v-for="(route, index) in form.routes" :key="index" class="route-item">
        <el-form-item label="目标 IP" required>
          <el-input v-model="route.targetIp" placeholder="例如 192.168.1.0/24" />
        </el-form-item>
        <el-form-item label="下一跳 IP" required>
          <el-input v-model="route.nextHopIp" placeholder="例如 172.17.0.2" />
        </el-form-item>
        <el-button
            type="danger"
            @click="removeRoute(index)"
            :disabled="form.routes.length <= 1"
        >
          删除
        </el-button>
        <el-divider />
      </div>

      <el-form-item>
        <el-button @click="addRoute">添加路由条目</el-button>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button type="primary" @click="submitRoutes">提 交</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>

    <DockerContainers ref="containersRef" />
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, nextTick, defineExpose } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import DockerContainers from '@/components/Container/DockerContainers.vue'

const dialogVisible = ref(false)
const containersRef = ref(null)
const containers = ref([])

const form = reactive({
  containerName: '',
  routes: [{ targetIp: '', nextHopIp: '' }]
})

// 计算可用的运行中节点
const availableContainers = computed(() => {
  return containers.value.filter(c => c.status?.includes('Up'))
})

// 格式化节点名称
const formatContainerName = (name) => {
  return name.replace(/^\//, '')
}

// 格式化状态显示
const formatStatus = (status) => {
  return status?.includes('Up') ? '运行中' : '已停止'
}

const openDialog = async () => {
  form.containerName = ''
  form.routes = [{ targetIp: '', nextHopIp: '' }]
  dialogVisible.value = true

  await nextTick()
  if (containersRef.value) {
    await containersRef.value.fetchContainers()
    containers.value = containersRef.value.containers || []
  }
}

// 其余方法保持不变
const addRoute = () => {
  form.routes.push({ targetIp: '', nextHopIp: '' })
}

const removeRoute = (index) => {
  form.routes.splice(index, 1)
}

const submitRoutes = async () => {
  if (!form.containerName || form.routes.some(r => !r.targetIp || !r.nextHopIp)) {
    ElMessage.warning('请填写完整节点名称和路由信息')
    return
  }

  try {
    await axios.post(
        `http://localhost:8081/bird/add?containerName=${encodeURIComponent(form.containerName)}`,
        form.routes
    )
    ElMessage.success('静态路由添加成功')
    dialogVisible.value = false
  } catch (err) {
    console.error(err)
    ElMessage.error('添加失败：' + (err.response?.data || err.message))
  }
}

defineExpose({ openDialog })
</script>

<style scoped>
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

.route-item {
  background: #f9f9f9;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px dashed #ccc;
  border-radius: 6px;
}
</style>