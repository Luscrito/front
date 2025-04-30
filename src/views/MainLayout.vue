<template>
  <div class="main-layout">
    <!-- 顶部菜单栏 -->
    <el-menu
        mode="horizontal"
        menu-trigger="hover"
        background-color="#409EFF"
        text-color="#fff"
        active-text-color="#ffd04b"
        class="top-menu"
    >
      <!-- 节点 -->
      <el-sub-menu index="1">
        <template #title>
          <el-icon><Cpu /></el-icon>
          <span class="menu-label">节点</span>
        </template>
        <!-- 添加节点菜单项 -->
        <el-menu-item index="1-1" @click="addContainerDialogRef.openDialog()">添加节点</el-menu-item>
        <el-menu-item index="1-2" @click="deleteContainerDialogRef.openDialog()">删除节点</el-menu-item>
        <el-menu-item index="1-3" @click="startContainerDialogRef.openDialog()">启动节点</el-menu-item>
        <el-menu-item index="1-4" @click="stopContainerDialogRef.openDialog()">停止节点</el-menu-item>
      </el-sub-menu>

      <!-- 网络 -->
      <el-sub-menu index="2">
        <template #title>
          <el-icon><Share /></el-icon>
          <span class="menu-label">网络</span>
        </template>
        <el-menu-item index="2-1" @click="addNetworkDialogRef.openDialog()">创建网络</el-menu-item>
        <el-menu-item index="2-2" @click="deleteNetworkDialogRef.openDialog()">删除网络</el-menu-item>
      </el-sub-menu>

      <!-- 路由 -->
      <el-sub-menu index="3">
        <template #title>
          <el-icon><Guide /></el-icon>
          <span class="menu-label">路由</span>
        </template>
        <el-menu-item index="3-1" @click="addRouteDialogRef.openDialog()">添加静态路由</el-menu-item>
        <el-menu-item index="3-2" @click="deleteRouteDialogRef.openDialog()">删除静态路由</el-menu-item>
        <el-menu-item index="3-3" @click="dynamicConfigDialogRef.openDialog()">添加动态路由</el-menu-item>
        <el-menu-item index="3-4" @click="autoConfigDialogRef.openDialog()">一键动态路由</el-menu-item>
        <el-menu-item index="3-5" @click="resetRouteDialogRef.openDialog()">重置路由配置</el-menu-item>
      </el-sub-menu>

      <!-- 防火墙 -->
      <el-sub-menu index="4">
        <template #title>
          <el-icon><Lock /></el-icon>
          <span class="menu-label">防火墙</span>
        </template>
        <el-menu-item index="4-1" @click="addFirewallRuleDialogRef.openDialog()">添加规则</el-menu-item>
        <el-menu-item index="4-2" @click="deleteFirewallRulesDialogRef.openDialog()">删除规则</el-menu-item>
        <el-menu-item index="4-3" @click="clearFirewallRulesDialogRef.openDialog()">清空规则</el-menu-item>
        <el-menu-item index="4-4" @click="viewFirewallRulesDialogRef.openDialog()">查看规则</el-menu-item>
      </el-sub-menu>

      <!-- 参数 -->
      <el-sub-menu index="5">
        <template #title>
          <el-icon><Setting /></el-icon>
          <span class="menu-label">参数</span>
        </template>
        <el-menu-item index="5-1" @click="sourceParamDialogRef.openDialog()">配置资源</el-menu-item>
        <el-menu-item index="5-2" @click="networkParamDialogRef.openDialog()">网络参数</el-menu-item>
      </el-sub-menu>

      <!-- 测试计划 -->
      <el-sub-menu index="6">
        <template #title>
          <el-icon><DocumentChecked /></el-icon>
          <span class="menu-label">测试计划</span>
        </template>
        <el-menu-item index="6-1" @click="addPlanDialogRef.openDialog()">创建计划</el-menu-item>
      </el-sub-menu>

      <!-- 故障 -->
      <el-sub-menu index="7">
        <template #title>
          <el-icon><Warning /></el-icon>
          <span class="menu-label">故障</span>
        </template>
        <el-menu-item index="7-1" @click="restartContainerRef.openDialog()">模拟掉线</el-menu-item>
      </el-sub-menu>
    </el-menu>

    <!-- 主内容区域 -->
    <div class="layout-body">
      <!-- 拓扑区域（含节点列表） -->
      <div class="topology-area">
        <div class="topology-header">
          <el-icon><PieChart /></el-icon>
          <span class="topology-label">拓扑区域</span>
        </div>
        <div class="topology-content">
          <!-- 左侧节点列表-->
          <div class="container-list">
            <ContainerList />
          </div>
          <!-- 右侧拓扑图 -->
          <div class="topology-graph">
            <TopologyGraph />
          </div>
        </div>
      </div>

      <!-- 监控和测试计划区域上下拆分 -->
      <div class="monitor-area">
        <div class="monitor-section">
          <p><el-icon><Monitor /></el-icon> 监控区域</p>
          <MonitorView />
          <!-- 可以替换为你的实际监控组件 -->
        </div>
        <div class="plan-section">
          <p><el-icon><DocumentChecked /></el-icon> 测试计划</p>
          <!-- 可以替换为你的计划管理组件 -->
          <PlanList />
        </div>
      </div>
    </div>

    <!-- 弹出框 -->
    <AddContainerDialog ref="addContainerDialogRef" />
    <DeleteContainerDialog ref="deleteContainerDialogRef" />
    <StartContainerDialog ref="startContainerDialogRef" />
    <StopContainerDialog ref="stopContainerDialogRef" />
    <ContainerDetailDialog ref="containerDetailDialogRef" />
    <AddNetworkDialog ref="addNetworkDialogRef" />
    <DeleteNetworkDialog ref="deleteNetworkDialogRef" />
    <AddStaticRouteDialog ref="addRouteDialogRef" />
    <DeleteStaticRouteDialog ref="deleteRouteDialogRef" />
    <DynamicConfigDialog ref="dynamicConfigDialogRef" />
    <ResetRouteDialog ref="resetRouteDialogRef" />
    <AutoConfigDialog ref="autoConfigDialogRef" />
    <AddFirewallRuleDialog ref="addFirewallRuleDialogRef" />
    <ViewFirewallRulesDialog ref="viewFirewallRulesDialogRef" />
    <DeleteFirewallRulesDialog ref="deleteFirewallRulesDialogRef" />
    <ClearFirewallRuleDialog ref="clearFirewallRulesDialogRef" />
    <NetworkParamDialog ref="networkParamDialogRef" />
    <SourceParamDialog ref="sourceParamDialogRef" />
    <AddPlanDialog ref="addPlanDialogRef" />
    <RestartContainerDialog ref="restartContainerRef" />

  </div>
</template>

<script setup>
import { ref } from 'vue'
import {Cpu, Share, Monitor, PieChart, Guide, Lock, Setting, DocumentChecked, Warning} from '@element-plus/icons-vue'
import AddContainerDialog from '@/components/Container/AddContainerDialog.vue'
import DeleteContainerDialog from '@/components/Container/DeleteContainerDialog.vue'
import StartContainerDialog from '@/components/Container/StartContainerDialog.vue'
import StopContainerDialog from '@/components/Container/StopContainerDialog.vue'
import ContainerList from '@/components/Container/ContainerList.vue'
import ContainerDetailDialog from "@/components/Container/ContainerDetailDialog.vue"
import AddNetworkDialog from "@/components/Network/AddNetworkDialog.vue"
import DeleteNetworkDialog from '@/components/Network/DeleteNetworkDialog.vue'
import AddStaticRouteDialog from "@/components/Bird/AddStaticRouteDialog.vue";
import DeleteStaticRouteDialog from '@/components/Bird/DeleteStaticRouteDialog.vue'
import DynamicConfigDialog from "@/components/Bird/DynamicConfigDialog.vue";
import ResetRouteDialog from "@/components/Bird/ResetRouteDialog.vue";
import AutoConfigDialog from "@/components/Bird/AutoConfigDialog.vue";
import AddFirewallRuleDialog from "@/components/Firewall/AddFirewallRuleDialog.vue";
import ViewFirewallRulesDialog from "@/components/Firewall/ViewFirewallRulesDialog.vue";
import DeleteFirewallRulesDialog from "@/components/Firewall/DeleteFirewallRulesDialog.vue";
import ClearFirewallRuleDialog from "@/components/Firewall/ClearFirewallRuleDialog.vue";
import NetworkParamDialog from "@/components/Paramter/NetworkParamDialog.vue";
import SourceParamDialog from "@/components/Paramter/SourceParamDialog.vue";
import PlanList from "@/components/Plan/PlanList.vue";
import AddPlanDialog from "@/components/Plan/AddPlanDialog.vue";
import MonitorView from "@/components/Monitor/MonitorView.vue";
import RestartContainerDialog from "@/components/Fault/RestartContainerDialog.vue";
import TopologyGraph from "@/components/Topology/TopologyGraph.vue";

const addContainerDialogRef = ref(null)
const deleteContainerDialogRef = ref(null)
const startContainerDialogRef = ref(null)
const stopContainerDialogRef = ref(null)
const addNetworkDialogRef = ref(null)
const deleteNetworkDialogRef = ref(null)
const addRouteDialogRef = ref(null)
const deleteRouteDialogRef = ref(null)
const dynamicConfigDialogRef = ref(null)
const resetRouteDialogRef = ref(null)
const autoConfigDialogRef = ref(null)
const addFirewallRuleDialogRef = ref(null)
const viewFirewallRulesDialogRef = ref(null)
const deleteFirewallRulesDialogRef = ref(null)
const clearFirewallRulesDialogRef = ref(null)
const networkParamDialogRef = ref(null)
const sourceParamDialogRef = ref(null)
const addPlanDialogRef = ref(null)
const restartContainerRef = ref(null)

</script>

<style scoped>

.main-layout {
  min-height: 100vh; /* 修改原有height: 105vh */
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

/* 顶部菜单栏 */
.top-menu {
  width: 100%;
  justify-content: space-evenly;
  border-bottom: none;
  font-size: 16px;
}

/* 修改主体区域 */
.layout-body {
  display: flex;
  flex: 1; /* 新增 */
  gap: 24px; /* 替换原有gap:30px */
  padding: 20px; /* 新增 */
  height: calc(100vh - 60px); /* 新增 */
  max-width: 1600px; /* 扩展原有1600px */
  max-height: 700px; /* 扩展原有1600px */
  margin: 0 auto; /* 修改原有margin */
  width: 100%;
  box-sizing: border-box; /* 新增 */
}

.menu-label {
  margin-left: 6px;
  font-weight: 500;
  font-size: 16px;
}

/* 拓扑区域改造 */
.topology-area {
  width: 650px;
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05); /* 优化阴影 */
  padding: 16px; /* 调整内边距 */
  /* 删除原有min-height设置 */
}

.topology-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.topology-label {
  margin-left: 10px;
  font-weight: 500;
  font-size: 18px;
}

.topology-content {
  flex: 1;
  display: flex;
  gap: 20px; /* 新增间距 */
  margin-top: 12px; /* 新增 */
  min-height: 500px; /* 新增最小高度 */
}

/* 节点列表样式 */
.container-list {
  width: 200px; /* 新增固定宽度 */
  border-right: 1px solid #ebeef5; /* 新增分割线 */
  overflow-y: auto; /* 新增滚动 */
}

/* 拓扑图样式调整 */
.topology-graph {
  width: 95%;
  height: 100%;
  min-height: 300px; /* 确保最小高度 */
  box-sizing: border-box; /* 防止padding影响尺寸 */
}

/* 监控区域改造 */
.monitor-area {
  width: 650px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05); /* 优化阴影 */
  /* 删除原有min-height */
}

.monitor-section,
.plan-section {
  flex: 1;
  min-height: 200px; /* 新增最小高度 */
  overflow: auto;
  padding: 12px;
  border: 1px solid #ebeef5; /* 新增边框 */
  border-radius: 6px; /* 新增圆角 */
}

/* 响应式适配 */
@media (max-width: 1600px) {
  .layout-body {
    flex-direction: column; /* 小屏幕纵向排列 */
  }

  .topology-area,
  .monitor-area {
    width: 100%; /* 占满宽度 */
    min-width: auto; /* 取消最小宽度限制 */
  }

  .topology-content {
    min-height: 400px; /* 调整最小高度 */
  }

  .topology-graph {
    min-height: 350px; /* 小屏时更小 */
  }

  .container-list {
    width: 200px; /* 缩小节点列表宽度 */
  }
}

/* 滚动条优化（放在样式表最后） */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f5f5f5;
}

::-webkit-scrollbar-thumb {
  background-color: #409EFF;
  border-radius: 4px;
}

</style>
