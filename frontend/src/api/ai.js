import axios from 'axios';

const aiClient = axios.create({
  baseURL: 'http://localhost:3000/api/ai',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  }
});

/**
 * @param {string} userQuery
 * @returns {Promise} 
 */
export const getCourseRecommendations = async (userQuery) => {
  try {
    const response = await aiClient.post('/recommend', {
      query: userQuery
    });
    return response.data;
  } catch (error) {
    console.error('AI 推荐接口请求失败:', error);
    throw error;
  }
};