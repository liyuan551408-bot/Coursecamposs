import request from './request'

export async function getCourses() {
  const response = await request.get('/courses')
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
