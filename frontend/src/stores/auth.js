/**
 * Authentication state management
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
  const normalizedRole = computed(() => user.value?.role?.toLowerCase())
  const isAdmin = computed(() => normalizedRole.value === 'admin')
  const isModerator = computed(() => normalizedRole.value === 'moderator')
  const userName = computed(() => user.value?.name || user.value?.email || '')

  /** Store backend/mock authentication data in Pinia and localStorage. */
  function applyAuthData(data) {
    token.value = data.token
    user.value = data.user
    setToken(data.token)
    setStoredUser(data.user)
  }

  /** Log in: call the API, save the token/user, then update the store. */
  async function login(credentials) {
    const useMock = import.meta.env.VITE_USE_MOCK === 'true'
    const data = useMock ? await mockLogin(credentials) : await loginApi(credentials)
    applyAuthData(data)
    return data
  }

  /** Register an account, then sign in with the newly created credentials. */
  async function register(formData) {
    const useMock = import.meta.env.VITE_USE_MOCK === 'true'
    if (!useMock) {
      await registerApi(formData)
      return login({ email: formData.email, password: formData.password })
    }
    const data = await mockRegister(formData)
    applyAuthData(data)
    return data
  }

  /** Log out: clear the store and localStorage. */
  function logout() {
    token.value = null
    user.value = null
    clearAuthStorage()
  }

  /** Restore the login state from localStorage after a refresh. */
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
