import request from './request'

export async function getAdminStats() {
  const response = await request.get('/admin/stats')
  return response.data
}

export async function getAdminUsers(page = 1, limit = 20, role = '') {
  const response = await request.get('/admin/users', {
    params: { page, limit, ...(role && { role }) },
  })
  return response.data
}

export async function createStaffUser(user) {
  const response = await request.post('/admin/users', user)
  return response.data
}

export async function changeUserRole(id, role) {
  const response = await request.patch(
    `/admin/users/${id}/role`,
    { role },
  )
  return response.data
}
