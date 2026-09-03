<script setup>
/**
 * Application shell shared by all pages.
 * The header remains visible while router-view changes the page content.
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
      <router-link to="/" class="logo"><span class="logo-mark">C</span>CourseCompass</router-link>

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
  padding: 14px 32px;
  border-bottom: 1px solid rgba(91, 74, 130, 0.1);
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(18px);
  position: sticky;
  top: 0;
  z-index: 10;
}

.logo {
  font-weight: 800;
  color: var(--text-h);
  text-decoration: none;
  font-size: 18px;
  letter-spacing: -0.6px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
}

.logo-mark {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  color: white;
  border-radius: 10px;
  background: linear-gradient(135deg, #6d4aff, #c14bdb);
  box-shadow: 0 7px 14px rgba(109, 74, 255, 0.25);
}

.nav-links {
  display: flex;
  gap: 16px;
  flex: 1;
}

.nav-links a {
  color: var(--text);
  text-decoration: none;
  padding: 7px 9px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  transition: .2s ease;
}

.nav-links a.router-link-active {
  color: var(--accent);
  background: var(--accent-bg);
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
  padding: 36px 24px 56px;
  max-width: 1126px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

@media (max-width: 800px) {
  .app-header { padding: 12px 16px; gap: 12px; flex-wrap: wrap; }
  .nav-links { order: 3; flex-basis: 100%; overflow-x: auto; padding-bottom: 2px; }
  .auth-area { margin-left: auto; }
  .app-main { padding: 24px 16px 40px; }
}
</style>
