/**
 * 登录状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, registerApi, mockLogin, mockRegister } from '../api/auth'
import {
  getToken,
  setToken,
  removeToken,
  getStoredUser,
  setStoredUser,
  clearAuthStorage,
} from '../utils/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(getToken())
  const user = ref(getStoredUser())

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isModerator = computed(() => user.value?.role === 'moderator')
  const userName = computed(() => user.value?.name || user.value?.email || '')

  /** 把后端/mock 返回的数据写入 Store 和 localStorage */
  function applyAuthData(data) {
    token.value = data.token
    user.value = data.user
    setToken(data.token)
    setStoredUser(data.user)
  }

  /** 登录：调 API → 存 token/user → 更新 Store */
  async function login(credentials) {
    const useMock = import.meta.env.VITE_USE_MOCK === 'true'
    const data = useMock ? await mockLogin(credentials) : await loginApi(credentials)
    applyAuthData(data)
    return data
  }

  /** 注册：创建账号后通常会自动登录，流程和 login 类似 */
  async function register(formData) {
    const useMock = import.meta.env.VITE_USE_MOCK === 'true'
    const data = useMock ? await mockRegister(formData) : await registerApi(formData)
    applyAuthData(data)
    return data
  }

  /** 退出：清 Store + 清 localStorage */
  function logout() {
    token.value = null
    user.value = null
    clearAuthStorage()
  }

  /** 页面刷新时，从 localStorage 恢复登录态 */
  function restoreSession() {
    token.value = getToken()
    user.value = getStoredUser()
  }

  return {
    token,
    user,
    isLoggedIn,
    isAdmin,
    isModerator,
    userName,
    login,
    register,
    logout,
    restoreSession,
  }
})
