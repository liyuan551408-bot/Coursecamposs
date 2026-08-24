/**
 * Authentication-related API
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
        reject(new Error('Invalid email or password (Mock: password must be at least 6 characters)'))
      }
    }, 500)
  })
}

/** Mock registration: pretend the backend created an account, then return the same token + user as login. */
export function mockRegister(data) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!data.name || !data.email || data.password?.length < 6) {
        reject(new Error('Please complete all required fields (Mock: password must be at least 6 characters)'))
        return
      }
      if (data.password !== data.confirmPassword) {
        reject(new Error('The two passwords do not match'))
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
