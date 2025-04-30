<template>
  <div class="container-list">
    <h4>节点列表</h4>
    <ul>
      <li
          v-for="(container, index) in containersRef?.containers || []"
          :key="index"
          :title="container.name"
          @click="showDetail(container)"
      >
        <el-icon><Cpu /></el-icon>
        {{ container.name.replace(/^\//, '') }}
      </li>
    </ul>
    <ContainerDetailDialog ref="dialogRef" />
    <DockerContainers ref="containersRef" />
  </div>
</template>

<script setup>
import {ref, defineExpose, onMounted, onBeforeUnmount} from 'vue'
import { Cpu } from '@element-plus/icons-vue'
import ContainerDetailDialog from './ContainerDetailDialog.vue'
import DockerContainers from './DockerContainers.vue'

const dialogRef = ref(null)
const containersRef = ref(null)

const showDetail = (container) => {
  dialogRef.value.openDialog(container)
}

// 手动刷新容器列表的函数
const refreshContainers = () => {
  containersRef.value.fetchContainers()
}

let intervalId = null
onMounted(() => {
  intervalId = setInterval(() => {
    refreshContainers()
  }, 1000) // 每 1 秒刷新一次
})

// 清理定时器，防止内存泄漏
onBeforeUnmount(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})

defineExpose({ refreshContainers})
</script>

<style scoped>
.container-list {
  width: 220px;
  background-color: #f9f9f9;
  padding: 12px;
  border-right: 1px solid #ddd;
  font-size: 14px;
  max-height: 550px;
  overflow-y: auto;
}

.container-list li {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  cursor: pointer;
  padding: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
