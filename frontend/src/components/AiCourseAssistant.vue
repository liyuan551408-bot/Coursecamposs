<template>
  <div class="ai-assistant-container">
    <h2>AI Course Selection Assistant</h2>
    <div class="search-box">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="I want to take a computer science course about deep learning or machine learning..." 
        @keyup.enter="handleSearch"
        :disabled="isLoading"
      />
      <button @click="handleSearch" :disabled="isLoading || !searchQuery.trim()">
        {{ isLoading ? 'AI is analyzing...' : 'Get Recommendations' }}
      </button>
    </div>

    <div v-if="result" class="result-area">
   
      <div class="ai-rationale">
        <h3>Recommendation Analysis</h3>
        <p style="white-space: pre-wrap;">{{ result.aiRationale }}</p>
      </div>

      <div class="course-list">
        <h3>Recommended Courses</h3>
        <div class="course-card" v-for="course in result.candidateCourses" :key="course.id">
          <div class="course-header">
            <span class="course-code">{{ course.code }}</span>
            <span class="course-name">{{ course.name }}</span>
          </div>
          <p class="course-desc">{{ course.description }}</p>
          <div class="course-footer">
            <span class="similarity">Match: {{ (course.similarity * 100).toFixed(1) }}%</span>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { getCourseRecommendations } from '../api/ai.js';

const searchQuery = ref('');
const isLoading = ref(false);
const result = ref(null);

const handleSearch = async () => {
  if (!searchQuery.value.trim()) return;
  
  isLoading.value = true;
  result.value = null;
  
  try {
    const res = await getCourseRecommendations(searchQuery.value);
    if (res.success) {
      result.value = res.data;
    }
  } catch (error) {
    alert('Request failed. Please check whether the backend service is running.');
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>

.ai-assistant-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: sans-serif;
}
.search-box {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
}
.search-box input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.search-box button {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.search-box button:disabled {
  background-color: #9e9e9e;
  cursor: not-allowed;
}
.ai-rationale {
  background-color: #f0f7ff;
  padding: 20px;
  border-left: 5px solid #2196F3;
  margin-bottom: 20px;
  border-radius: 4px;
}
.course-card {
  border: 1px solid #e0e0e0;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.course-header {
  font-weight: bold;
  font-size: 1.1em;
  margin-bottom: 10px;
}
.course-code {
  color: #E91E63;
  margin-right: 10px;
}
.course-desc {
  color: #555;
  font-size: 0.95em;
}
.similarity {
  color: #4CAF50;
  font-weight: bold;
}
</style>
