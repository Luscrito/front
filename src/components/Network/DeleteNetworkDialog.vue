<template>
  <el-dialog title="删除网络" v-model="dialogVisible" width="30%">
    <el-form :model="network" vlabel-width="80px" class="network-form">
      <el-form-item label="节点名称" :rules="[{ required: true, message: '请选择网络', trigger: 'change' }]">
        <el-select v-model="network.name" placeholder="请选择要删除的网络">
          <el-option
              v-for="name in Object.keys(networksRef?.networks || {})"
              :key="name"
              :label="name"
              :value="name"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button type="danger" @click="submitDelete">删 除</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
    <DockerNetworks ref="networksRef" />
  </el-dialog>
</template>

<script setup>
import {ref, defineExpose, nextTick} from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import DockerNetworks from "@/components/Network/DockerNetworks.vue"; // 引入子组件

const dialogVisible = ref(false)
const network = ref({ name: '' })

const networksRef = ref(null) // 用于访问 DockerNetworks 组件

// 打开弹窗时刷新节点列表
const openDialog = async () => {
  network.value.name = ''
  dialogVisible.value = true
  await nextTick()
  networksRef.value?.fetchNetworks()
}

const submitDelete = async () => {
  if (!network.value.name) {
    ElMessage.warning('请选择网络名称')
    return
  }

  try {
    await axios.delete(`http://localhost:8081/network/delete/${network.value.name}`)
    ElMessage.success('删除成功')
    dialogVisible.value = false
  } catch (err) {
    ElMessage.error('删除失败')
  }
}

// 向父组件暴露方法
defineExpose({
  openDialog
})
</script>

<style scoped>
.network-form {
  padding-top: 10px;
}
</style>