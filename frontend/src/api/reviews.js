import request from './request'

export async function getCourseReviews(courseId) {
  const response = await request.get(`/reviews/course/${courseId}`)
  return response.data || []
}

export async function submitReview(payload) {
  const response = await request.post('/reviews', payload)
  return response.data
}

export async function moderateReview(id, status) {
  const response = await request.patch(`/reviews/${id}/status`, { status })
  return response.data
}
