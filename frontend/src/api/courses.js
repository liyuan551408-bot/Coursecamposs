/** @file Wraps backend courses endpoints behind a small frontend API client. */
import request from './request'

export async function getCourses() {
  const response = await request.get('/courses')
  return response.data || []
}

export async function getAdminCourses() {
  const response = await request.get('/courses/admin/all')
  return response.data || []
}

export async function searchCourses(filters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  )
  const response = await request.get('/courses/search', { params })
  return response.data || []
}

export async function getCourse(id) {
  const response = await request.get(`/courses/${id}`)
  return response.data
}

export async function createCourse(payload) {
  const response = await request.post('/courses', payload)
  return response.data
}

export async function updateCourse(id, payload) {
  const response = await request.patch(`/courses/${id}`, payload)
  return response.data
}
