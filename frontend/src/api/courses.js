import request from './request'

const demoCourses = [
  { id: 1, code: 'COMP101', name: 'Programming Fundamentals', credits: 15, workloadHours: 120, description: 'Build a practical foundation in programming and problem solving.' },
  { id: 2, code: 'COMP201', name: 'Data Structures and Algorithms', credits: 15, workloadHours: 140, description: 'Learn the data structures and algorithms behind scalable software.' },
  { id: 3, code: 'COMP302', name: 'Introduction to Machine Learning', credits: 15, workloadHours: 150, description: 'Use data to train, evaluate and explain predictive models.' },
]

function useMock() {
  return import.meta.env.VITE_USE_MOCK === 'true'
}

export async function getCourses() {
  if (useMock()) return demoCourses
  const response = await request.get('/courses')
  return response.data || []
}

export async function getCourse(id) {
  if (useMock()) {
    const course = demoCourses.find((item) => item.id === Number(id)) || demoCourses[0]
    return {
      ...course,
      prerequisites: course.id === 1 ? [] : [demoCourses[course.id - 2]],
      prerequisiteFor: course.id === 3 ? [] : [demoCourses[course.id]],
    }
  }
  const response = await request.get(`/courses/${id}`)
  return response.data
}

export async function createCourse(payload) {
  if (useMock()) return { id: Date.now(), ...payload }
  const response = await request.post('/courses', payload)
  return response.data
}
