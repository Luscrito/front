<template>
  <el-dialog title="删除静态路由" v-model="dialogVisible" width="600px">
    <el-form :model="form" label-width="90px" class="route-form">
      <el-form-item label="节点名称" required>
        <el-select
            v-model="form.containerName"
            placeholder="请选择节点"
            clearable
            filterable
            class="full-width"
            @change="loadRoutes"
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

      <div v-if="routeOptions.length > 0">
        <el-form-item label="选择路由" required>
          <el-checkbox-group v-model="form.selectedRoutes">
            <el-checkbox
                v-for="(route, index) in routeOptions"
                :key="index"
                :label="`${route.targetIp}->${route.nextHopIp}`"
            >
              {{ route.targetIp }} → {{ route.nextHopIp }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </div>

      <div v-else-if="form.containerName">
        <el-alert title="该节点暂无静态路由配置" type="info" show-icon />
      </div>
    </el-form>

    <template #footer>
      <el-button type="primary" @click="submitDelete">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>

    <!-- 获取节点列表用 -->
    <DockerContainers ref="containersRef" />
  </el-dialog>
</template>

<script setup>
import {ref, reactive, nextTick, defineExpose, computed} from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import DockerContainers from '@/components/Container/DockerContainers.vue'

const dialogVisible = ref(false)
const containersRef = ref(null)
const containers = ref([])
const routeOptions = ref([])

const form = reactive({
  containerName: '',
  selectedRoutes: [] // string[] -> 用字符串标识 targetIp->nextHopIp
})

// 打开弹窗
const openDialog = async () => {
  form.containerName = ''
  form.selectedRoutes = []
  routeOptions.value = []
  dialogVisible.value = true

  await nextTick()
  if (containersRef.value) {
    await containersRef.value.fetchContainers()
    containers.value = containersRef.value.containers || []
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

// 选中节点后加载静态路由
const loadRoutes = async () => {
  if (!form.containerName) return

  try {
    const res = await axios.get(`http://localhost:8081/bird/list?containerName=${encodeURIComponent(form.containerName)}`)
    routeOptions.value = res.data || []
  } catch (err) {
    console.error('获取路由失败', err)
    ElMessage.error('获取路由失败')
  }
}

// 提交删除
const submitDelete = async () => {
  if (!form.containerName || form.selectedRoutes.length === 0) {
    ElMessage.warning('请选择节点和需要删除的路由')
    return
  }

  const routesToDelete = form.selectedRoutes.map(str => {
    const [targetIp, nextHopIp] = str.split('->')
    return { targetIp, nextHopIp }
  })

  try {
    await axios.delete(`http://localhost:8081/bird/delete`, {
      params: { containerName: form.containerName },
      data: routesToDelete
    })
    ElMessage.success('删除成功')
    dialogVisible.value = false
  } catch (err) {
    console.error(err)
    ElMessage.error('删除失败：' + (err.response?.data || err.message))
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
</style>
