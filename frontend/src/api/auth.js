/**
 * Authentication API
 */
import request from './request'

export function loginApi(credentials) {
  return request.post('/auth/login', credentials).then((response) => ({
    token: response.token,
    user: response.data,
  }))
}

export function registerApi(data) {
  return request.post('/auth/register', data)
}

export function getMeApi() {
  return request.get('/users/me')
}

/**
 * Mock data for development
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
            name: 'Test User',
            role: credentials.email.includes('admin') ? 'admin' : 'student',
          },
        })
      } else {
        reject(new Error('Invalid email or password (mock mode requires at least 6 characters)'))
      }
    }, 500)
  })
}

/** Mock registration: return a token and user as if the backend created the account. */
export function mockRegister(data) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!data.name || !data.email || data.password?.length < 6) {
        reject(new Error('Please complete all required fields (mock mode requires at least 6 characters)'))
        return
      }
      if (data.password !== data.confirmPassword) {
        reject(new Error('Passwords do not match'))
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
