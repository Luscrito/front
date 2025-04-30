<template>
  <el-dialog title="添加防火墙规则" v-model="dialogVisible" width="600px">
    <el-form label-width="100px">
      <!-- 节点选择 -->
      <el-form-item label="选择节点" required>
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

      <!-- 链选择 -->
      <el-form-item label="选择链" required>
        <el-select v-model="selectedChain" placeholder="请选择链" @change="handleChainChange">
          <el-option label="INPUT" value="INPUT" />
          <el-option label="OUTPUT" value="OUTPUT" />
          <el-option label="FORWARD" value="FORWARD" />
        </el-select>
      </el-form-item>

      <!-- 动态生成的填空项 -->
      <div v-if="selectedChain === 'INPUT'" >
        <el-form-item label="源地址" required>
          <el-input v-model="sourceAddress" placeholder="请输入源地址" />
        </el-form-item>
        <el-form-item label="目标地址" required>
          <el-input v-model="destinationAddress" placeholder="请输入目标地址" />
        </el-form-item>
        <el-form-item label="选择规则" required>
          <el-select v-model="selectedRule" placeholder="请选择规则">
            <el-option label="流量通过" value="ACCEPT" />
            <el-option label="流量拒绝" value="REJECT" />
          </el-select>
          <el-alert v-if="selectedChain === 'INPUT'" type="info" title="输入链: 填写源地址和目标地址" />
        </el-form-item>
      </div>
      <div v-if="selectedChain === 'OUTPUT'">
        <el-form-item label="源地址" required>
          <el-input v-model="sourceAddress" placeholder="请输入源地址" />
        </el-form-item>
        <el-form-item label="目标地址" required>
          <el-input v-model="destinationAddress" placeholder="请输入目标地址" />
        </el-form-item>
        <el-form-item label="目的端口" required>
          <el-input v-model="destinationPort" placeholder="请输入目的端口" />
        </el-form-item>
        <el-form-item label="选择规则" required>
          <el-select v-model="selectedRule" placeholder="请选择规则">
            <el-option label="流量通过" value="ACCEPT" />
            <el-option label="流量拒绝" value="REJECT" />
          </el-select>
          <el-alert v-if="selectedChain === 'OUTPUT'" type="info" title="输出链: 填写源地址、目标地址和目的端口" />
        </el-form-item>
      </div>
      <div v-if="selectedChain === 'FORWARD'">
        <el-form-item label="源地址" required>
          <el-input v-model="sourceAddress" placeholder="请输入源地址" />
        </el-form-item>
        <el-form-item label="目标地址" required>
          <el-input v-model="destinationAddress" placeholder="请输入目标地址" />
        </el-form-item>
        <el-form-item label="选择规则" required>
          <el-select v-model="selectedRule" placeholder="请选择规则">
            <el-option label="流量通过" value="ACCEPT" />
            <el-option label="流量拒绝" value="REJECT" />
          </el-select>
          <el-alert v-if="selectedChain === 'FORWARD'" type="info" title="转发链: 填写源地址和目标地址" />
        </el-form-item>
      </div>

    </el-form>

    <template #footer>
      <el-button type="primary" @click="handleAddRule">添加规则</el-button>
      <el-button @click="dialogVisible = false">取消</el-button>
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

const dialogVisible = ref(false) // 弹窗可见性
const containers = ref([]) // 节点列表
const selectedContainer = ref('') // 选中的节点
const selectedChain = ref('') // 选中的链
const selectedRule = ref('')
const sourceAddress = ref('') // 源地址
const destinationAddress = ref('') // 目标地址
const destinationPort = ref('') // 目的端口
const containersRef = ref(null) // 引用节点组件

// 打开弹窗并获取节点列表
const openDialog = async () => {
  dialogVisible.value = true
  // 初始化状态
  selectedContainer.value = ''  // 清空节点选择
  selectedChain.value = ''  // 默认链
  selectedRule.value = ''
  sourceAddress.value = ''  // 清空源地址
  destinationAddress.value = ''  // 清空目标地址
  destinationPort.value = ''  // 清空目的端口

  await nextTick()
  if (containersRef.value) {
    await containersRef.value.fetchContainers()
    containers.value = containersRef.value.containers || []
  }
}

// 根据选择的链生成相应的规则
const generateRule = () => {
  let ruleStr = ''
  if (selectedChain.value === 'INPUT') {
    ruleStr = `-i ${sourceAddress.value} -d ${destinationAddress.value} -j ${selectedRule.value}`
  } else if (selectedChain.value === 'OUTPUT') {
    ruleStr = `-s ${sourceAddress.value} -d ${destinationAddress.value} --dport ${destinationPort.value} -j ${selectedRule.value}`
  } else if (selectedChain.value === 'FORWARD') {
    ruleStr = `-s ${sourceAddress.value} -d ${destinationAddress.value} -j ${selectedRule.value}`
  }
  return ruleStr
}

// 处理添加防火墙规则
const handleAddRule = async () => {
  if (!selectedContainer.value || !generateRule()) {
    ElMessage.warning('请填写所有必需字段')
    return
  }

  try {
    const ruleString = generateRule()
    await axios.post(`http://localhost:8081/firewall/add`,null, {
      params: {
        containerName: selectedContainer.value,
        chain: selectedChain.value,
        rule: ruleString
      }
    })
    ElMessage.success('防火墙规则添加成功')
    dialogVisible.value = false
  } catch (err) {
    console.error('添加规则失败', err)
    ElMessage.error(`添加规则失败：${err}`)
  }
}

// 处理链选择变化
const handleChainChange = () => {
  // 每次改变链时，清空相应的字段，避免用户混淆
  sourceAddress.value = ''
  destinationAddress.value = ''
  destinationPort.value = ''
  selectedRule.value = '' // 清空规则选择
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

defineExpose({ openDialog }) // 暴露openDialog方法
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
