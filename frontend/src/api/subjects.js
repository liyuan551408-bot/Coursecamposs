import request from './request'

export async function getSubjects() {
  const response = await request.get('/subjects')
  return response.data || []
}

export async function createSubject(payload) {
  const response = await request.post('/subjects', payload)
  return response.data
}

export async function updateSubject(id, name) {
  const response = await request.patch(
    `/subjects/${id}`,
    { name },
  )
  return response.data
}
