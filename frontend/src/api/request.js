/**
 * Axios 请求封装
 */
import axios from 'axios'
import { getToken, clearAuthStorage } from '../utils/auth'
import router from '../router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
})

// 请求发出前：如果有 token，自动加到 Header
request.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 收到响应后：401 表示登录失效，清本地数据并跳转登录页
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
