<template>
  <el-dialog v-if="dialogVisible" v-model="dialogVisible" title="添加测试计划" width="600px">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
      <el-form-item label="计划名称" prop="name">
        <el-input v-model="form.name" />
      </el-form-item>

      <el-form-item label="类型" prop="type">
        <el-select v-model="form.type" placeholder="请选择类型" @change="handleTypeChange">
          <el-option label="TCP" value="TCP" />
          <el-option label="UDP" value="UDP" />
          <el-option label="HTTP" value="HTTP" />
          <el-option label="PING" value="PING" />
        </el-select>
      </el-form-item>

      <el-form-item v-if="['TCP', 'UDP', 'PING', 'HTTP'].includes(form.type)" label="节点1" prop="container1">
        <el-select v-model="form.container1" placeholder="请选择节点1">
          <el-option
              v-for="c in containers"
              :key="c.id"
              :label="c.name.replace(/^\//, '')"
              :value="c.name.replace(/^\//, '')"
          />
        </el-select>
      </el-form-item>

      <el-form-item v-if="['TCP', 'UDP', 'PING', 'HTTP'].includes(form.type)" label="节点2" prop="container2">
        <el-select v-model="form.container2" placeholder="请选择节点2">
          <el-option
              v-for="c in containers"
              :key="c.id"
              :label="c.name.replace(/^\//, '')"
              :value="c.name.replace(/^\//, '')"
          />
        </el-select>
      </el-form-item>

      <el-form-item v-if="['TCP', 'UDP', 'HTTP', 'PING'].includes(form.type)" label="节点2 IP" prop="container2Ip">
        <el-select v-model="form.container2Ip" placeholder="请选择节点2 IP">
          <el-option
              v-for="item in container2Ips"
              :key="item.ip"
              :label="`${item.network} - ${item.ip}`"
              :value="item.ip"
          />
        </el-select>
      </el-form-item>

      <el-form-item v-if="['TCP', 'UDP', 'PING'].includes(form.type)" label="大小" prop="size">
        <el-input-number v-model="form.size" :min="0" />
      </el-form-item>

      <el-form-item v-if="form.type === 'TCP'" label="时间" prop="time">
        <el-input v-model="form.time" />
      </el-form-item>

      <el-form-item v-if="form.type === 'UDP'" label="速度" prop="velocity">
        <el-input v-model="form.velocity" />
      </el-form-item>

      <el-form-item v-if="form.type === 'PING'" label="数量" prop="num">
        <el-input-number v-model="form.num" :min="1" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button type="primary" @click="submitForm">提交</el-button>
      <el-button @click="dialogVisible = false" >取消</el-button>
    </template>
    <DockerContainers ref="containersRef" />
  </el-dialog>
</template>

<script setup>
import {ref, defineExpose, nextTick, watch} from 'vue' // 加上 watch
import axios from 'axios'
import { ElMessage } from 'element-plus'
import DockerContainers from "@/components/Container/DockerContainers.vue";

const dialogVisible = ref(false)
const formRef = ref(null)

const form = ref({
  id: null,
  name: null,
  type: null,
  size: null,
  time: null,
  num: null,
  velocity: null,
  container1: null,
  container2: null,
  container2Ip: null
})

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'manual' }],
  type: [{ required: true, message: '请选择类型', trigger: 'manual' }],
  container1: [{ required: true, message: '请选择节点1', trigger: 'manual' }],
  container2: [{ required: true, message: '请选择节点2', trigger: 'manual' }],
  container2Ip: [{ required: true, message: '请输入节点2 IP', trigger: 'manual'}],
  size: [{ required: true, message: '请输入大小', trigger: 'manual'}],
  time: [{ required: true, message: '请输入时间', trigger: 'manual'}],
  num: [{ required: true, message: '请输入数量', trigger: 'manual'}],
  velocity: [{ required: true, message: '请输入速度', trigger: 'manual'}]
}

// 节点列表（用于下拉选择）
const containers = ref([])
const containersRef = ref(null) // 引用节点组件
const container2Ips = ref([]) // 改为 [{ network: xxx, ip: xxx }]

const openDialog = async () => {
  dialogVisible.value = true
  form.value = {
    id: null,
    name: null,
    type: null,
    size: null,
    time: null,
    num: null,
    velocity: null,
    container1: null,
    container2: null,
    container2Ip: null
  }
  await nextTick()
  if (containersRef.value) {
    await containersRef.value.fetchContainers()
    containers.value = containersRef.value.containers || []
  }
}

const handleTypeChange = () => {
  form.value.size = null
  form.value.time = null
  form.value.num = null
  form.value.velocity = null
  form.value.container1 = null
  form.value.container2 = null
  form.value.container2Ip = null
}

const submitForm = () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const response = await axios.post('http://localhost:8081/plan/add', form.value)
        if (response.data === '添加成功') {
          ElMessage.success('添加成功')
          dialogVisible.value = false
        } else {
          ElMessage.warning(response.data)
        }
      } catch (error) {
        ElMessage.error('添加失败')
        console.error(error)
      }
    }
  })
}

watch(() => form.value.container2, async (newVal) => {
  if (newVal) {
    try {
      const res = await axios.get(`http://localhost:8081/container/ip/${newVal}`)
      const ipMap = res.data
      container2Ips.value = Object.entries(ipMap).map(([network, ip]) => ({
        network,
        ip
      }))
      form.value.container2Ip = container2Ips.value[0]?.ip || ''
    } catch (e) {
      ElMessage.error('获取节点 IP 失败')
      container2Ips.value = []
      form.value.container2Ip = null
    }
  } else {
    container2Ips.value = []
    form.value.container2Ip = null
  }
})

defineExpose({ openDialog })

</script>
