<template>
  <el-dialog title="添加节点" v-model="dialogVisible" width="600px">
    <el-form :model="container" ref="containerForm" label-width="80px" class="container-form">
      <el-form-item label="节点名称" :rules="[{ required: true, message: '请输入节点名称', trigger: 'blur' }]">
        <el-input v-model="container.name" placeholder="请输入节点名称"></el-input>
      </el-form-item>

      <el-form-item label="节点镜像" :rules="[{ required: true, message: '请输入节点名称', trigger: 'blur' }]">
        <el-input v-model="container.image" placeholder="请输入节点名称"></el-input>
      </el-form-item>

      <el-form-item label="节点网络">
        <el-select v-model="container.networks" placeholder="请选择网络名称" multiple>
          <el-option
              v-for="(network, index) in NetworkList"
              :key="index"
              :label="network"
              :value="network"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button type="primary" @click="submitAdd">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>

    <!-- 挂载网络组件，仅供获取数据使用 -->
    <DockerNetworks ref="networksRef" />

  </el-dialog>
</template>

<script setup>
import { ref, defineExpose,nextTick } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import DockerNetworks from '@/components/Network/DockerNetworks.vue'

// 弹出框状态
const dialogVisible = ref(false)
const networksRef = ref(null)
const NetworkList = ref([])

// 节点数据
const container = ref({
  image: 'my_image',
  name: '',
  networks: []
})

// 打开弹窗时调用网络组件获取网络列表
const openDialog = async () => {
  container.value = {
    image: 'my_image',
    name: '',
    networks: []
  }
  dialogVisible.value = true

  await nextTick() // 等待 DockerNetworks 组件挂载
  if (networksRef.value) {
    await networksRef.value.fetchNetworks()
    NetworkList.value = Object.keys(networksRef.value.networks || {})
  } else {
    console.error('DockerNetworks 组件尚未挂载')
  }
}


// 提交节点创建
const submitAdd = async () => {
  try {
    await axios.post('http://localhost:8081/container/create', container.value)
    dialogVisible.value = false
    ElMessage.success('节点添加成功')
  } catch (error) {
    console.error('Error creating container:', error.response || error)
    ElMessage.error('节点添加失败')
  }
}

defineExpose({ openDialog })
</script>

<style scoped>
.container-form {
  padding-top: 10px;
}
</style>
