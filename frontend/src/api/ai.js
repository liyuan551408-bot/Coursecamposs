/** @file Wraps backend ai endpoints behind a small frontend API client. */
import request from './request'

export async function semanticSearchCourses(query, filters = {}) {
  const response = await request.post('/ai/semantic-search', { query, limit: 10, ...filters })
  return response.data || []
}

/** Call the authenticated backend recommendation endpoint with the student's query. */
export async function getCourseRecommendations(query, filters = {}) {
  const response = await request.post('/ai/recommend', { query, ...filters })
  return response.data
}

/** Generate a grounded comparison analysis for the selected course IDs. */
export async function getCourseComparisonAnalysis(courseIds) {
  // Leave headroom for the backend's provider timeout and one retry.
  const response = await request.post('/ai/compare', { courseIds }, { timeout: 90000 })
  return response.data
}
