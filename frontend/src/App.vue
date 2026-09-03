<script setup>

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
        <router-link to="/courses">Courses</router-link>
        <router-link to="/saved">Saved</router-link>
        <router-link to="/planner">Planner</router-link>
        <router-link to="/compare">Compare</router-link>
        <!-- Add AI recommendations to the top navigation -->
        <router-link to="/ai-recommend">AI Recommendations</router-link>
        <router-link v-if="authStore.isAdmin" to="/admin">Admin</router-link>
      </nav>

      <div class="auth-area">
        <template v-if="authStore.isLoggedIn">
          <router-link to="/profile">{{ authStore.userName }}</router-link>
          <el-button size="small" @click="handleLogout">Log out</el-button>
        </template>
        <router-link v-else to="/login">Log in</router-link>
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
