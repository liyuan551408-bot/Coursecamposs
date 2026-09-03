import request from './request'

export async function getCourseRecommendations(query) {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    const isAiRelated = /ai|artificial intelligence|machine learning|deep learning/i.test(query)
    return {
      aiRationale: isAiRelated
        ? 'Based on your interest in AI, build confidence in programming and algorithms before moving into machine learning. This sequence makes later modelling and project work easier to approach.'
        : 'I have assembled a progressive shortlist based on your goals, workload preferences and course descriptions. Review each course’s prerequisites before making your final selection.',
      candidateCourses: [
        { id: 1, code: 'COMP101', name: 'Programming Fundamentals', description: 'Build a foundation in programming and problem solving.', similarity: 0.92 },
        { id: 2, code: 'COMP201', name: 'Data Structures and Algorithms', description: 'Prepare for advanced software and data courses.', similarity: 0.84 },
        { id: 3, code: 'COMP302', name: 'Introduction to Machine Learning', description: 'Explore model training and evaluation through practice.', similarity: 0.78 },
      ],
    }
  }
  const response = await request.post('/ai/recommend', { query })
  return response.data
}
