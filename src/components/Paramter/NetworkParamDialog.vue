<template>
  <el-dialog v-model="dialogVisible" title="配置网络参数" width="500px">
    <el-form label-width="100px" :model="form">
      <el-form-item label="节点名称" required>
        <el-select
            v-model="form.container"
            placeholder="请选择节点"
            clearable
            filterable
            class="full-width"
            @change="handleContainerChange"
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

      <el-form-item label="带宽限制">
        <el-input v-model="form.bandwidth" placeholder="如 100M / 1G / 500K" />
      </el-form-item>

      <el-form-item label="延迟 (ms)">
        <el-input-number v-model="form.delay" :min="0" :step="1" />
      </el-form-item>

      <el-form-item label="丢包率 (%)">
        <el-input-number v-model="form.loss" :min="0" :max="100" :step="1" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button type="primary" @click="submit">应用配置</el-button>
      <el-button @click="dialogVisible = false">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, defineExpose, computed } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const dialogVisible = ref(false)

const containers = ref([])

const form = ref({
  container: '',
  bandwidth: '100G',
  delay: 0,
  loss: 0
})

const fetchContainers = async () => {
  try {
    const res = await axios.get('http://localhost:8081/container/list')
    containers.value = res.data
  } catch (err) {
    console.error('获取节点列表失败', err)
    ElMessage.error('获取节点列表失败')
  }
}

async function openDialog() {
  await fetchContainers()
  form.value = {
    container: '',
    bandwidth: '100G',
    delay: 0,
    loss: 0
  }
  dialogVisible.value = true
}

async function submit() {
  if (!form.value.container) {
    ElMessage.warning('请选择节点')
    return
  }

  try {
    await axios.post('http://localhost:8081/parameter/combined', null, {
      params: {
        container: form.value.container,
        bandwidth: form.value.bandwidth,
        delay: form.value.delay,
        loss: form.value.loss
      }
    })
    ElMessage.success('配置成功')
    dialogVisible.value = false
  } catch (err) {
    const errorMsg = err?.response?.data?.message || JSON.stringify(err?.response?.data || err.message)
    ElMessage.error(`配置失败：${errorMsg}`)
  }
}

// 暴露 openDialog 方法
defineExpose({ openDialog })

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

// 新增：当选择节点时，拉取该节点当前的网络参数
const handleContainerChange = async (containerName) => {
  if (!containerName) return;

  try {
    const res = await axios.get('http://localhost:8081/parameter/get', {
      params: {
        containerName: containerName
      }
    })

    const data = res.data; // 例如: "qdisc netem 8001: root refcnt 129 limit 1000 delay 5.0ms loss 5% rate 100Mbit"

    // 使用正则提取 delay, loss, rate
    const delayMatch = data.match(/delay (\d+\.?\d*)ms/)
    const lossMatch = data.match(/loss (\d+\.?\d*)%/)
    const rateMatch = data.match(/rate (\d+\w+)/)

    if (delayMatch) {
      form.value.delay = parseFloat(delayMatch[1])
    }
    else {
      form.value.delay = 0
    }
    if (lossMatch) {
      form.value.loss = parseFloat(lossMatch[1])
    }
    else {
      form.value.loss = 0
    }
    if (rateMatch) {
      let rate = rateMatch[1]
      rate = rate.replace('bit', '') // 100Mbit -> 100M
      form.value.bandwidth = rate
    }
    else {
      form.value.bandwidth = "100G"
    }

  } catch (err) {
    console.error('获取容器参数失败', err)
    ElMessage.error('获取容器参数失败')
  }
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
