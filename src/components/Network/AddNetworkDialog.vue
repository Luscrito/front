<template>
  <el-dialog v-model="visible" title="添加网络" width="600px" @close="resetForm">
    <el-form :model="network">
      <el-form-item label="网络名称" required>
        <el-input v-model="network.name" />
      </el-form-item>
      <el-form-item label="驱动类型" required>
        <el-select v-model="network.driver" placeholder="请选择驱动类型">
          <el-option label="bridge" value="bridge" />
          <el-option label="host" value="host" />
          <el-option label="none" value="none" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="handleAdd">添加</el-button>
      <el-button @click="visible = false">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, defineExpose } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const visible = ref(false)
const network = ref({
  name: '',
  driver: 'bridge'
})

const openDialog = () => {
  visible.value = true
}

const resetForm = () => {
  network.value = { name: '', driver: 'bridge' }
}

const handleAdd = async () => {
  try {
    await axios.post('http://localhost:8081/network/create', network.value)
    ElMessage.success('网络添加成功')
    visible.value = false
    resetForm()
  } catch (err) {
    ElMessage.error('添加失败')
  }
}

defineExpose({ openDialog })
</script>
