<script setup>
/**
 * 登录页
 */
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loading = ref(false)

const form = reactive({
  email: '',
  password: '',
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
}

const formRef = ref(null)
const isMockMode = import.meta.env.VITE_USE_MOCK === 'true'

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await authStore.login({ email: form.email, password: form.password })
    ElMessage.success('登录成功')

    // 登录前想访问的页面，登录后跳回去；否则去 dashboard
    const redirect = route.query.redirect || '/dashboard'
    router.push(typeof redirect === 'string' ? redirect : '/dashboard')
  } catch (err) {
    ElMessage.error(err.message || '登录失败，请检查账号密码')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <el-card class="login-card" shadow="hover">
      <h1>CourseCompass</h1>
      <p class="subtitle">登录你的账号</p>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="form.email"
            placeholder="student@massey.ac.nz"
            type="email"
            autocomplete="email"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            placeholder="至少 6 位"
            type="password"
            show-password
            autocomplete="current-password"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-button type="primary" class="login-btn" :loading="loading" @click="handleLogin">
          登录
        </el-button>
      </el-form>

      <p class="footer-link">
        还没有账号？
        <router-link to="/register">去注册</router-link>
      </p>

      <p v-if="isMockMode" class="mock-hint">
        开发模式：任意邮箱 + 6 位以上密码即可登录；邮箱含 admin 会以管理员身份进入
      </p>
    </el-card>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  text-align: left;
}

.login-card h1 {
  font-size: 28px;
  margin: 0 0 4px;
  text-align: center;
}

.subtitle {
  text-align: center;
  color: var(--text);
  margin-bottom: 24px;
}

.login-btn {
  width: 100%;
  margin-top: 8px;
}

.footer-link {
  margin-top: 16px;
  text-align: center;
  font-size: 14px;
}

.footer-link a {
  color: var(--accent);
  text-decoration: none;
}

.mock-hint {
  margin-top: 12px;
  font-size: 13px;
  color: var(--text);
  line-height: 1.5;
}
</style>
