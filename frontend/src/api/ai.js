import request from './request'

export async function getCourseRecommendations(query, filters = {}) {
  const response = await request.post('/ai/recommend', { query, ...filters })
  return response.data
}
