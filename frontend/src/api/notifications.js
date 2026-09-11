import request from './request'

export async function getNotifications(unreadOnly = false) {
  const response = await request.get('/notifications', { params: { unreadOnly } })
  return response
}

export async function markNotificationRead(id) {
  return request.patch(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead() {
  return request.patch('/notifications/read-all')
}

export async function deleteNotification(id) {
  return request.delete(`/notifications/${id}`)
}

export async function deleteAllNotifications() {
  return request.delete('/notifications')
}
