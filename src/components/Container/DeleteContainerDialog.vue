<template>
  <el-dialog title="删除节点" v-model="dialogVisible" width="600px">
    <el-form :model="container" label-width="80px" class="container-form">
      <el-form-item label="节点名称" :rules="[{ required: true, message: '请选择节点', trigger: 'change' }]">
        <el-select v-model="container.name" placeholder="请选择要删除的节点">
          <el-option
              v-for="container in containersRef?.containers || []"
              :key="container.id"
              :label="container.name.startsWith('/') ? container.name.slice(1) : container.name"
              :value="container.name.startsWith('/') ? container.name.slice(1) : container.name"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button type="danger" @click="submitDelete">删 除</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
    <DockerContainers ref="containersRef" />
  </el-dialog>
</template>

<script setup>
import { ref, nextTick, defineExpose } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import DockerContainers from "@/components/Container/DockerContainers.vue"

const dialogVisible = ref(false)
const container = ref({ name: '' })

const containersRef = ref(null)

// 打开弹窗时刷新容器列表
const openDialog = async () => {
  container.value.name = ''
  dialogVisible.value = true
  await nextTick()
  containersRef.value?.fetchContainers()
}

// 发起删除请求
const submitDelete = async () => {
  if (!container.value.name) {
    ElMessage.warning('请选择要删除的节点')
    return
  }

  try {
    await axios.delete(`http://localhost:8081/container/delete/${encodeURIComponent(container.value.name)}`)
    dialogVisible.value = false
    ElMessage.success('节点删除成功')
  } catch (error) {
    console.error('删除节点出错：', error)
    ElMessage.error('删除失败：' + (error.response?.data || error.message))
  }
}

// 暴露方法供外部调用
defineExpose({ openDialog })
</script>

<style scoped>
.container-form {
  padding-top: 10px;
}
</style>
