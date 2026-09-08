/** @file Wraps authenticated semester-plan endpoints. */
import request from './request'

export async function getPlans() {
  const response = await request.get('/plans')
  return response.data || []
}

export async function createPlan(payload) {
  const response = await request.post('/plans', payload)
  return response.data
}

export async function addPlanCourse(planId, courseId) {
  const response = await request.post(`/plans/${planId}/courses`, { courseId: Number(courseId) })
  return { course: response.data, warnings: response.warnings || [] }
}

export function removePlanCourse(planId, courseId) {
  return request.delete(`/plans/${planId}/courses/${courseId}`)
}

export function deletePlan(planId) {
  return request.delete(`/plans/${planId}`)
}
