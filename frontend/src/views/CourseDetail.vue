<template>
  <div class="course-detail-container">
    <el-card class="box-card" style="margin-bottom: 24px;">
      <template #header>
        <div class="card-header">
          <h2>{{ course.code }} - {{ course.name }}</h2>
          <el-tag :type="course.isActive ? 'success' : 'info'">
            {{ course.isActive ? 'Active' : 'Inactive' }}
          </el-tag>
        </div>
      </template>
      <el-descriptions border :column="2">
        <el-descriptions-item label="Credits">{{ course.credits }}</el-descriptions-item>
        <el-descriptions-item label="Workload">{{ course.workloadHours }} hours/week</el-descriptions-item>
        <el-descriptions-item label="Description" :span="2">{{ course.description }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="ai-summary-card" shadow="hover" style="margin-bottom: 24px; border-radius: 8px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold; font-size: 16px; color: #409EFF;">
            AI Course Review Summary
          </span>
          <el-button 
            type="primary" 
            :loading="isGenerating" 
            @click="fetchAiSummary"
            round
          >
            {{ summaryData ? 'Regenerate' : 'Generate Summary' }}
          </el-button>
        </div>
      </template>
      
      <div v-if="summaryData" style="white-space: pre-wrap; line-height: 1.6; font-size: 14px; color: #303133;">
        {{ summaryData }}
      </div>
      
      <el-empty 
        v-else 
        description="Want the quick version? Click the button in the top right and let AI summarize real student experiences for you." 
        :image-size="80" 
      />
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">
          <h3>Student Reviews</h3>
        </div>
      </template>
      <div v-if="reviews.length > 0">
        <div v-for="review in reviews" :key="review.id" class="review-item">
          <el-rate v-model="review.overallRating" disabled show-score text-color="#ff9900" />
          <p>{{ review.comment }}</p>
          <el-divider />
        </div>
      </div>
      <el-empty v-else description="No reviews yet." />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import request from '../api/request';

const route = useRoute();
const courseId = route.params.id;

const course = ref({});
const reviews = ref([]);
const isGenerating = ref(false);
const summaryData = ref('');

const fetchCourseDetails = async () => {
  try {
    const response = await request.get(`/api/courses/${courseId}`);
    if (response && response.success) {
      course.value = response.data;
      reviews.value = response.data.reviews || [];
    }
  } catch (error) {
    ElMessage.error('Failed to get course details');
  }
};

const fetchAiSummary = async () => {
  isGenerating.value = true;
  try {
    const response = await request.get(`/api/ai/courses/${courseId}/summary`);
    
    if (response && response.success) {
      summaryData.value = response.summary;
      ElMessage.success('AI summary generated successfully');
    } else {
      ElMessage.warning(response?.message || 'No data available');
    }
  } catch (error) {
    ElMessage.error('The server is temporarily unavailable. Please try again later');
  } finally {
    isGenerating.value = false;
  }
};

onMounted(() => {
  fetchCourseDetails();
});
</script>

<style scoped>
.course-detail-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.review-item {
  margin-bottom: 15px;
}
.review-item p {
  margin-top: 10px;
  color: #606266;
}
</style>
