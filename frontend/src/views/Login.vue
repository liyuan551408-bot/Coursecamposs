<!-- @file Coordinates data loading, user actions, and presentation for the login page. -->
<script setup>
/**
 * Login page
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
    { required: true, message: 'Enter your email address', trigger: 'blur' },
    { type: 'email', message: 'Enter a valid email address', trigger: 'blur' },
  ],
  password: [
    { required: true, message: 'Enter your password', trigger: 'blur' },
  ],
}

const formRef = ref(null)
async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await authStore.login({ email: form.email, password: form.password })
    ElMessage.success('Signed in successfully')

    // Return to the originally requested page, or the dashboard by default.
    const redirect = route.query.redirect || '/dashboard'
    router.push(typeof redirect === 'string' ? redirect : '/dashboard')
  } catch (err) {
    ElMessage.error(err.response?.data?.message || err.message || 'Sign-in failed. Check your email and password.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <el-card class="login-card" shadow="hover">
      <h1>CourseCompass</h1>
      <p class="subtitle">Sign in to your account</p>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="Email" prop="email">
          <el-input
            v-model="form.email"
            placeholder="student@massey.ac.nz"
            type="email"
            autocomplete="email"
          />
        </el-form-item>

        <el-form-item label="Password" prop="password">
          <el-input
            v-model="form.password"
            placeholder="Enter your password"
            type="password"
            show-password
            autocomplete="current-password"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <div class="forgot-link"><router-link to="/forgot-password">Forgot password?</router-link></div>

        <el-button type="primary" class="login-btn" :loading="loading" @click="handleLogin">
          Log in
        </el-button>
      </el-form>

      <p class="footer-link">
        New to CourseCompass?
        <router-link to="/register">Create an account</router-link>
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
.forgot-link { margin-top: -10px; margin-bottom: 12px; text-align: right; font-size: 13px; }
.forgot-link a { color: var(--accent); text-decoration: none; }

.footer-link {
  margin-top: 16px;
  text-align: center;
  font-size: 14px;
}

.footer-link a {
  color: var(--accent);
  text-decoration: none;
}

</style>
