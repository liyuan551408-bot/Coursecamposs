<script setup>
/**
 * 注册页
 */
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const formRef = ref(null)
const isMockMode = import.meta.env.VITE_USE_MOCK === 'true'

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  programme: '',
  year: '',
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== form.password) {
          callback(new Error('两次密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

async function handleRegister() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await authStore.register({ ...form })
    ElMessage.success('注册成功，已自动登录')
    router.push('/dashboard')
  } catch (err) {
    ElMessage.error(err.message || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <el-card class="auth-card" shadow="hover">
      <h1>创建账号</h1>
      <p class="subtitle">加入 CourseCompass，开始规划你的课程</p>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="你的姓名" autocomplete="name" />
        </el-form-item>

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
            autocomplete="new-password"
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            placeholder="再输入一次密码"
            type="password"
            show-password
            autocomplete="new-password"
            @keyup.enter="handleRegister"
          />
        </el-form-item>

        <el-form-item label="专业（可选）" prop="programme">
          <el-input v-model="form.programme" placeholder="例如 Computer Science" />
        </el-form-item>

        <el-form-item label="年级（可选）" prop="year">
          <el-select v-model="form.year" placeholder="选择年级" clearable style="width: 100%">
            <el-option label="Year 1" value="1" />
            <el-option label="Year 2" value="2" />
            <el-option label="Year 3" value="3" />
            <el-option label="Year 4+" value="4" />
          </el-select>
        </el-form-item>

        <el-button type="primary" class="submit-btn" :loading="loading" @click="handleRegister">
          注册
        </el-button>
      </el-form>

      <p class="footer-link">
        已有账号？
        <router-link to="/login">去登录</router-link>
      </p>

      <p v-if="isMockMode" class="mock-hint">
        开发模式：填完整表单即可注册，注册成功后会自动登录
      </p>
    </el-card>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.auth-card {
  width: 100%;
  max-width: 440px;
  text-align: left;
}

.auth-card h1 {
  font-size: 28px;
  margin: 0 0 4px;
  text-align: center;
}

.subtitle {
  text-align: center;
  color: var(--text);
  margin-bottom: 24px;
}

.submit-btn {
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
