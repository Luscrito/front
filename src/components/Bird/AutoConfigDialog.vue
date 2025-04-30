<template>
  <el-dialog title="一键动态配置 BIRD" v-model="dialogVisible" width="600px">
    <p>该操作将对以下节点执行 BIRD 的动态配置：</p>
    <ul>
      <li v-for="(container, index) in filteredContainerList" :key="index">
        {{ container.name.replace(/^\//, '') }}
      </li>
    </ul>

    <template #footer>
      <el-button type="primary" @click="handleAutoConfigure" :loading="loading">开始配置</el-button>
      <el-button @click="dialogVisible = false" :disabled="loading">取消</el-button>
    </template>

    <!-- 获取节点列表 -->
    <DockerContainers ref="containersRef" />
  </el-dialog>
</template>

<script setup>
import { ref, nextTick, defineExpose, computed } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import DockerContainers from '@/components/Container/DockerContainers.vue'

const dialogVisible = ref(false)
const containers = ref([])
const containersRef = ref(null)
const loading = ref(false)

// 过滤掉名为 portainer 的节点
const filteredContainerList = computed(() =>
    containers.value.filter(c => c.name.replace(/^\//, '') !== 'portainer')
)

const openDialog = async () => {
  dialogVisible.value = true
  await nextTick()
  if (containersRef.value) {
    await containersRef.value.fetchContainers()
    containers.value = containersRef.value.containers || []
  }
}

const handleAutoConfigure = async () => {
  const targetNames = filteredContainerList.value.map(c => c.name.replace(/^\//, ''))

  if (targetNames.length === 0) {
    ElMessage.warning('无可配置的节点')
    return
  }

  loading.value = true
  try {
    await axios.post('http://localhost:8081/bird/actives', targetNames)
    ElMessage.success('批量动态配置成功')
  } catch (err) {
    console.error('配置失败', err)
    ElMessage.error('配置失败')
  } finally {
    loading.value = false
    dialogVisible.value = false
  }
}

defineExpose({ openDialog })
</script>

<style scoped>
ul {
  margin: 10px 0;
  padding-left: 20px;
}
</style>
