/**
 * 学期规划器状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const PLANNER_KEY = 'course_compass_planner'

const defaultSemesters = [
  { id: 1, name: 'Semester 1', courses: [] },
  { id: 2, name: 'Semester 2', courses: [] },
]

function loadPlanner() {
  try {
    const raw = localStorage.getItem(PLANNER_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return defaultSemesters
}

export const usePlannerStore = defineStore('planner', () => {
  const semesters = ref(loadPlanner())

  const totalCredits = computed(() => {
    return semesters.value.reduce((total, sem) => {
      return total + sem.courses.reduce((sum, c) => sum + (c.credits || 0), 0)
    }, 0)
  })

  function getSemesterCourses(semesterId) {
    const sem = semesters.value.find((s) => s.id === semesterId)
    return sem ? sem.courses : []
  }

  function isInPlanner(courseId) {
    return semesters.value.some((sem) =>
      sem.courses.some((c) => c.id === Number(courseId))
    )
  }

  function addCourse(semesterId, course) {
    const sem = semesters.value.find((s) => s.id === semesterId)
    if (!sem) return false
    if (sem.courses.some((c) => c.id === course.id)) return false
    if (isInPlanner(course.id)) return false
    sem.courses.push({ ...course })
    persist()
    return true
  }

  function removeCourse(semesterId, courseId) {
    const sem = semesters.value.find((s) => s.id === semesterId)
    if (!sem) return
    sem.courses = sem.courses.filter((c) => c.id !== Number(courseId))
    persist()
  }

  function moveCourse(courseId, fromSemesterId, toSemesterId) {
    const fromSem = semesters.value.find((s) => s.id === fromSemesterId)
    const toSem = semesters.value.find((s) => s.id === toSemesterId)
    if (!fromSem || !toSem) return
    const courseIndex = fromSem.courses.findIndex((c) => c.id === Number(courseId))
    if (courseIndex === -1) return
    const [course] = fromSem.courses.splice(courseIndex, 1)
    toSem.courses.push(course)
    persist()
  }

  function addSemester(name) {
    const newId = Math.max(...semesters.value.map((s) => s.id), 0) + 1
    semesters.value.push({ id: newId, name: name || `Semester ${newId}`, courses: [] })
    persist()
  }

  function removeSemester(semesterId) {
    semesters.value = semesters.value.filter((s) => s.id !== semesterId)
    persist()
  }

  function clearAll() {
    semesters.value = defaultSemesters.map((s) => ({ ...s, courses: [] }))
    persist()
  }

  function persist() {
    localStorage.setItem(PLANNER_KEY, JSON.stringify(semesters.value))
  }

  return {
    semesters,
    totalCredits,
    getSemesterCourses,
    isInPlanner,
    addCourse,
    removeCourse,
    moveCourse,
    addSemester,
    removeSemester,
    clearAll,
  }
})
