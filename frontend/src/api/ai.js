import request from './request'

/** Call the authenticated backend recommendation endpoint with the student's query. */
export async function getCourseRecommendations(query, filters = {}) {
  const response = await request.post('/ai/recommend', { query, ...filters })
  return response.data
}
