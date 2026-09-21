/** @file Wraps backend ai endpoints behind a small frontend API client. */
import request from './request'

/** Call the authenticated backend recommendation endpoint with the student's query. */
export async function getCourseRecommendations(query, filters = {}) {
  // Embedding retries and the language-model fallback can exceed the global
  // 10-second API timeout, so keep this request alive for the full workflow.
  const response = await request.post('/ai/recommend', { query, ...filters }, { timeout: 150000 })
  return response.data
}

/** Generate a grounded comparison analysis for the selected course IDs. */
export async function getCourseComparisonAnalysis(courseIds) {
  // Leave headroom for the backend's provider timeout and one retry.
  const response = await request.post('/ai/compare', { courseIds }, { timeout: 90000 })
  return response.data
}
