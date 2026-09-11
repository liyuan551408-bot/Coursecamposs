/** @file Wraps backend auth endpoints behind a small frontend API client. */
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

export function forgotPasswordApi(email) {
  // SMTP authentication can take longer on the first connection, so allow
  // the reset request more time than the normal API timeout.
  return request.post('/auth/forgot-password', { email }, { timeout: 30000 })
}

export function resetPasswordApi(payload) {
  return request.post('/auth/reset-password', payload)
}

