<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCourse } from '../api/courses'
import { getCourseReviews, submitReview } from '../api/reviews'
import request from '../api/request'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const course = ref(null)
const reviews = ref([])
const isGenerating = ref(false)
const summaryData = ref('')
const form = reactive({ overallRating: 0, difficultyRating: 0, workloadRating: 0, comment: '' })
const average = computed(() => reviews.value.length
  ? (reviews.value.reduce((total, item) => total + item.overallRating, 0) / reviews.value.length).toFixed(1)
  : '-')

async function loadPage() {
  loading.value = true
  error.value = ''
  try {
    [course.value, reviews.value] = await Promise.all([
      getCourse(route.params.id),
      getCourseReviews(route.params.id),
    ])
  } catch (err) {
    error.value = err.response?.data?.message || 'Course details cannot be loaded right now.'
  } finally {
    loading.value = false
  }
}

async function fetchAiSummary() {
  isGenerating.value = true
  try {
    const response = await request.get(`/ai/courses/${route.params.id}/summary`)
    if (response?.success) {
      summaryData.value = response.summary
      ElMessage.success('AI summary generated successfully')
    } else {
      ElMessage.warning(response?.message || 'No data available')
    }
  } catch (err) {
    ElMessage.error('The AI summary service is temporarily unavailable.')
  } finally {
    isGenerating.value = false
  }
}

async function handleReview() {
  if (!authStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: route.fullPath } })
    return
  }
  if (![form.overallRating, form.difficultyRating, form.workloadRating].every(Boolean)) {
    ElMessage.warning('Please complete all three ratings.')
    return
  }
  submitting.value = true
  try {
    await submitReview({ courseId: Number(route.params.id), ...form })
    ElMessage.success('Your review was submitted and will be visible after approval.')
    Object.assign(form, { overallRating: 0, difficultyRating: 0, workloadRating: 0, comment: '' })
  } catch (err) {
    ElMessage.error(err.response?.data?.message || 'Submission failed. Please try again later.')
  } finally {
    submitting.value = false
  }
}

onMounted(loadPage)
</script>

<template>
  <section v-loading="loading" class="detail-page">
    <el-result v-if="error" icon="warning" title="Course unavailable" :sub-title="error">
      <template #extra><el-button @click="loadPage">Try again</el-button></template>
    </el-result>
    <template v-else-if="course">
      <el-button link @click="router.push('/courses')">Back to course catalogue</el-button>
      <div class="course-hero">
        <div>
          <span class="course-code">{{ course.code }}</span>
          <h1>{{ course.name }}</h1>
          <p>{{ course.description || 'No course description is available.' }}</p>
        </div>
        <div class="rating-box"><b>{{ average }}</b><span>Course rating · {{ reviews.length }} reviews</span></div>
      </div>

      <el-card class="ai-summary-card">
        <template #header>
          <div class="summary-header">
            <span>AI Course Review Summary</span>
            <el-button type="primary" :loading="isGenerating" @click="fetchAiSummary">
              {{ summaryData ? 'Regenerate' : 'Generate Summary' }}
            </el-button>
          </div>
        </template>
        <p v-if="summaryData" class="summary-text">{{ summaryData }}</p>
        <el-empty v-else description="Generate an AI summary of approved student reviews." :image-size="80" />
      </el-card>

      <div class="detail-grid">
        <el-card>
          <h2>Course information</h2>
          <dl><dt>Credits</dt><dd>{{ course.credits }}</dd><dt>Estimated study time</dt><dd>{{ course.workloadHours || 'Not provided' }} {{ course.workloadHours ? 'hours' : '' }}</dd></dl>
        </el-card>
        <el-card>
          <h2>Prerequisites</h2>
          <p v-if="!course.prerequisites?.length" class="muted">This course has no prerequisites.</p>
          <div v-else class="tag-list"><el-tag v-for="item in course.prerequisites" :key="item.id" @click="router.push(`/courses/${item.id}`)">{{ item.code }} · {{ item.name }}</el-tag></div>
          <h3>Unlocks next</h3>
          <p v-if="!course.prerequisiteFor?.length" class="muted">No follow-on courses have been recorded.</p>
          <div v-else class="tag-list"><el-tag v-for="item in course.prerequisiteFor" :key="item.id" type="success" @click="router.push(`/courses/${item.id}`)">{{ item.code }}</el-tag></div>
        </el-card>
      </div>

      <div class="review-layout">
        <div>
          <h2>Student reviews</h2>
          <el-empty v-if="!reviews.length" description="There are no approved reviews yet" />
          <article v-for="review in reviews" :key="review.id" class="review">
            <div><b>{{ review.user?.name || 'Anonymous student' }}</b><span class="muted"> · {{ review.user?.major || 'Student' }}</span></div>
            <el-rate :model-value="review.overallRating" disabled />
            <p>{{ review.comment || 'This student did not leave a written review.' }}</p>
          </article>
        </div>
        <el-card class="review-form">
          <h2>Write a review</h2>
          <p class="muted">Your review will be published after approval.</p>
          <el-form label-position="top">
            <el-form-item label="Overall recommendation"><el-rate v-model="form.overallRating" /></el-form-item>
            <el-form-item label="Course difficulty"><el-rate v-model="form.difficultyRating" /></el-form-item>
            <el-form-item label="Study workload"><el-rate v-model="form.workloadRating" /></el-form-item>
            <el-form-item label="Your review"><el-input v-model="form.comment" type="textarea" :rows="4" maxlength="500" show-word-limit placeholder="Share your learning experience (optional)" /></el-form-item>
            <el-button type="primary" :loading="submitting" @click="handleReview">Submit review</el-button>
          </el-form>
        </el-card>
      </div>
    </template>
  </section>
</template>

<style scoped>
.detail-page { max-width: 1000px; margin: 0 auto; }
.course-hero { display: flex; justify-content: space-between; gap: 32px; padding: 28px 0; }
.course-hero h1 { margin: 8px 0; font-size: 40px; }
.course-hero p { max-width: 670px; line-height: 1.65; }
.course-code { color: var(--accent); font-weight: 700; }
.rating-box { min-width: 145px; text-align: center; border-left: 1px solid var(--border); padding-left: 24px; }
.rating-box b { display: block; font-size: 38px; color: var(--text-h); }
.rating-box span, .muted { color: var(--text); font-size: 14px; }
.summary-header { display: flex; justify-content: space-between; align-items: center; font-weight: 700; }
.summary-text { white-space: pre-wrap; line-height: 1.6; }
.detail-grid, .review-layout { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; margin: 20px 0 40px; }
.detail-grid h2, .review-layout h2 { margin-top: 0; }
dl { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
dt { color: var(--text); }
dd { margin: 0; font-weight: 600; }
.tag-list { display: flex; flex-wrap: wrap; gap: 8px; }
.tag-list .el-tag { cursor: pointer; }
h3 { font-size: 15px; margin: 20px 0 8px; }
.review-layout { grid-template-columns: 1.4fr .8fr; }
.review { padding: 16px 0; border-bottom: 1px solid var(--border); }
.review p { margin-top: 8px; line-height: 1.55; }
.review-form { height: max-content; }
@media (max-width: 700px) { .course-hero, .detail-grid, .review-layout { grid-template-columns: 1fr; display: grid; } .rating-box { border-left: 0; border-top: 1px solid var(--border); padding: 16px 0 0; text-align: left; } .course-hero h1 { font-size: 32px; } }
</style>
