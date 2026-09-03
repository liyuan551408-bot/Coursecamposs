/**
 * Axios request wrapper
 */
import axios from 'axios'
import { getToken, clearAuthStorage } from '../utils/auth'
import router from '../router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
})

// Before requests are sent, add the token to the header if it exists.
request.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// After receiving a response, 401 means the session is invalid. Clear local data and redirect to login.
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthStorage()
      router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
    }
    return Promise.reject(error)
  }
)

export default request
