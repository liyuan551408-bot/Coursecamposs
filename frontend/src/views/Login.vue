<!-- @file Coordinates data loading, user actions, and presentation for the login page. -->
<script setup>
/**
 * Login page
 */
import { computed, ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loading = ref(false)

const form = reactive({
  role: '',
  email: '',
  password: '',
})

const roleOptions = [
  { value: 'STUDENT', label: 'Student', mark: 'ST', description: 'Plan courses, save favourites and share reviews.' },
  { value: 'MODERATOR', label: 'Moderator', mark: 'MO', description: 'Review submissions and resolve reported content.' },
  { value: 'ADMIN', label: 'Administrator', mark: 'AD', description: 'Manage courses, subjects and user access.' },
]

const selectedRole = computed(() => roleOptions.find((option) => option.value === form.role))

function selectRole(role) {
  form.role = role
}

function changeRole() {
  form.role = ''
}

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
  if (!form.role) {
    ElMessage.warning('Select your account type first.')
    return
  }
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await authStore.login({ role: form.role, email: form.email, password: form.password })
    ElMessage.success('Signed in successfully')

    // Return to the originally requested page, or the dashboard by default.
    const defaultRoute = authStore.isAdmin ? '/admin' : authStore.isModerator ? '/moderation' : '/dashboard'
    const redirect = route.query.redirect || defaultRoute
    router.push(typeof redirect === 'string' ? redirect : defaultRoute)
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
      <div class="brand-lockup">
        <span class="brand-mark">C</span>
        <div><strong>CourseCompass</strong><small>Account access</small></div>
      </div>

      <div class="login-steps" aria-label="Login progress">
        <span class="is-active">1 <b>Identity</b></span>
        <i />
        <span :class="{ 'is-active': form.role }">2 <b>Credentials</b></span>
      </div>

      <template v-if="!form.role">
        <div class="login-heading">
          <p class="eyebrow">CHOOSE YOUR ACCESS</p>
          <h1>How are you signing in?</h1>
          <p>Select the account type assigned to your email address.</p>
        </div>

        <div class="role-grid">
          <button v-for="option in roleOptions" :key="option.value" type="button" class="role-card" @click="selectRole(option.value)">
            <span class="role-mark">{{ option.mark }}</span>
            <span class="role-copy"><strong>{{ option.label }}</strong><small>{{ option.description }}</small></span>
            <span class="role-arrow">→</span>
          </button>
        </div>
      </template>

      <template v-else>
        <div class="selected-role">
          <span class="role-mark">{{ selectedRole.mark }}</span>
          <span><small>SIGNING IN AS</small><strong>{{ selectedRole.label }}</strong></span>
          <el-button link type="primary" @click="changeRole">Change</el-button>
        </div>

        <div class="login-heading credentials-heading">
          <h1>Welcome back</h1>
          <p>Enter the credentials for your {{ selectedRole.label.toLowerCase() }} account.</p>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
          <el-form-item label="Email" prop="email">
            <el-input v-model="form.email" placeholder="name@massey.ac.nz" type="email" autocomplete="email" />
          </el-form-item>

          <el-form-item label="Password" prop="password">
            <el-input v-model="form.password" placeholder="Enter your password" type="password" show-password autocomplete="current-password" @keyup.enter="handleLogin" />
          </el-form-item>

          <div class="forgot-link"><router-link to="/forgot-password">Forgot password?</router-link></div>

          <el-button type="primary" class="login-btn" :loading="loading" @click="handleLogin">
            Log in as {{ selectedRole.label }}
          </el-button>
        </el-form>
      </template>

      <p v-if="!form.role || form.role === 'STUDENT'" class="footer-link">New to CourseCompass? <router-link to="/register">Create a student account</router-link></p>

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
  max-width: 560px;
  text-align: left;
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 11px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border);
}

.brand-mark,
.role-mark {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: var(--accent);
  color: white;
  font: 800 12px/1 var(--mono);
  letter-spacing: .05em;
}

.brand-lockup > div {
  display: grid;
}

.brand-lockup strong {
  color: var(--text-h);
  font-size: 16px;
}

.brand-lockup small {
  color: var(--text-muted);
}

.login-steps {
  display: flex;
  align-items: center;
  margin: 20px 0 26px;
  color: var(--text-muted);
  font-size: 12px;
}

.login-steps span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.login-steps span.is-active {
  color: var(--accent);
}

.login-steps i {
  flex: 1;
  height: 1px;
  margin: 0 12px;
  background: var(--border);
}

.login-heading {
  margin-bottom: 20px;
}

.login-heading h1 {
  margin: 5px 0 7px;
  color: var(--text-h);
  font-size: 27px;
}

.login-heading > p:last-child {
  margin: 0;
  color: var(--text);
  line-height: 1.55;
}

.eyebrow {
  margin: 0;
  color: var(--accent);
  font: 700 10px/1.3 var(--mono);
  letter-spacing: .13em;
}

.role-grid {
  display: grid;
  gap: 10px;
}

.role-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 13px;
  width: 100%;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 13px;
  background: var(--bg);
  color: var(--text);
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: transform .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease;
}

.role-card:hover,
.role-card:focus-visible {
  border-color: var(--accent);
  background: var(--accent-bg);
  box-shadow: 0 8px 20px rgba(50, 37, 79, .08);
  transform: translateY(-2px);
}

.role-card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.role-copy {
  display: grid;
  gap: 3px;
}

.role-copy strong {
  color: var(--text-h);
  font-size: 15px;
}

.role-copy small {
  line-height: 1.4;
}

.role-arrow {
  color: var(--accent);
  font-size: 20px;
}

.selected-role {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  margin-bottom: 22px;
  padding: 12px;
  border: 1px solid var(--accent-border);
  border-radius: 13px;
  background: var(--accent-bg);
}

.selected-role > span:nth-child(2) {
  display: grid;
}

.selected-role small {
  color: var(--accent);
  font: 700 9px/1.4 var(--mono);
  letter-spacing: .1em;
}

.selected-role strong {
  color: var(--text-h);
}

.credentials-heading {
  margin-bottom: 18px;
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
