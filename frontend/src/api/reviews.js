import request from './request'

const demoReviews = [
  { id: 1, overallRating: 5, difficultyRating: 3, workloadRating: 3, comment: 'Clear teaching and a genuinely rewarding project.', createdAt: '2026-08-12T00:00:00.000Z', user: { name: 'Alex', major: 'Computer Science' } },
]

const useMock = () => import.meta.env.VITE_USE_MOCK === 'true'

export async function getCourseReviews(courseId) {
  if (useMock()) return demoReviews.map((review) => ({ ...review, courseId: Number(courseId) }))
  const response = await request.get(`/reviews/course/${courseId}`)
  return response.data || []
}

export async function submitReview(payload) {
  if (useMock()) return { id: Date.now(), ...payload, status: 'PENDING' }
  const response = await request.post('/reviews', payload)
  return response.data
}

export async function moderateReview(id, status) {
  if (useMock()) return { id: Number(id), status }
  const response = await request.patch(`/reviews/${id}/status`, { status })
  return response.data
}
