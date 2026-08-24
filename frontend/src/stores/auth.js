/**
 * Login state management
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

  /** Write backend/mock response data to the store and localStorage. */
  function applyAuthData(data) {
    token.value = data.token
    user.value = data.user
    setToken(data.token)
    setStoredUser(data.user)
  }

  /** Login: call API, store token/user, and update store. */
  async function login(credentials) {
    const useMock = import.meta.env.VITE_USE_MOCK === 'true'
    const data = useMock ? await mockLogin(credentials) : await loginApi(credentials)
    applyAuthData(data)
    return data
  }

  /** Register: account creation usually logs in automatically, similar to login. */
  async function register(formData) {
    const useMock = import.meta.env.VITE_USE_MOCK === 'true'
    const data = useMock ? await mockRegister(formData) : await registerApi(formData)
    applyAuthData(data)
    return data
  }

  /** Logout: clear store and localStorage. */
  function logout() {
    token.value = null
    user.value = null
    clearAuthStorage()
  }

  /** Restore login state from localStorage on page refresh. */
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
