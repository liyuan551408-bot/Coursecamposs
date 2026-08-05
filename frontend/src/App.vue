<script setup>
/**
 * 根组件 —— 所有页面共用的「外壳」
 * 顶部导航 + 中间内容由 <router-view> 根据 URL 切换
 */
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div id="app-root">
    <header class="app-header">
      <router-link to="/" class="logo">CourseCompass</router-link>

      <nav class="nav-links">
        <router-link to="/courses">课程</router-link>
        <router-link to="/saved">收藏</router-link>
        <router-link to="/planner">规划</router-link>
        <router-link to="/compare">对比</router-link>
        <router-link v-if="authStore.isAdmin" to="/admin">管理</router-link>
      </nav>

      <div class="auth-area">
        <template v-if="authStore.isLoggedIn">
          <router-link to="/profile">{{ authStore.userName }}</router-link>
          <el-button size="small" @click="handleLogout">退出</el-button>
        </template>
        <router-link v-else to="/login">登录</router-link>
      </div>
    </header>

    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
#app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 24px;
  border-bottom: 1px solid var(--border);
}

.logo {
  font-weight: 600;
  color: var(--text-h);
  text-decoration: none;
  font-size: 18px;
}

.nav-links {
  display: flex;
  gap: 16px;
  flex: 1;
}

.nav-links a {
  color: var(--text);
  text-decoration: none;
}

.nav-links a.router-link-active {
  color: var(--accent);
}

.auth-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.auth-area a {
  color: var(--text-h);
  text-decoration: none;
}

.app-main {
  flex: 1;
  padding: 24px;
  max-width: 1126px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}
</style>
