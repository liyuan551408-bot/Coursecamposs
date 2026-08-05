/**
 * 认证相关 API
 */
import request from './request'

export function loginApi(credentials) {
  return request.post('/auth/login', credentials)
}

export function registerApi(data) {
  return request.post('/auth/register', data)
}

export function getMeApi() {
  return request.get('/auth/me')
}

/**
 * Mock 数据（开发用）
 */
export function mockLogin(credentials) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (credentials.email && credentials.password.length >= 6) {
        resolve({
          token: 'mock-jwt-token-for-dev',
          user: {
            id: 1,
            email: credentials.email,
            name: '测试用户',
            role: credentials.email.includes('admin') ? 'admin' : 'student',
          },
        })
      } else {
        reject(new Error('邮箱或密码不正确（Mock：密码至少 6 位）'))
      }
    }, 500)
  })
}

/** Mock 注册：假装后端创建账号，然后返回和登录一样的 token + user */
export function mockRegister(data) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!data.name || !data.email || data.password?.length < 6) {
        reject(new Error('请填写完整信息（Mock：密码至少 6 位）'))
        return
      }
      if (data.password !== data.confirmPassword) {
        reject(new Error('两次密码不一致'))
        return
      }
      resolve({
        token: 'mock-jwt-token-for-dev',
        user: {
          id: Date.now(),
          email: data.email,
          name: data.name,
          role: 'student',
          programme: data.programme || '',
          year: data.year || '',
        },
      })
    }, 500)
  })
}
