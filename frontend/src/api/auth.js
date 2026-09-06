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

