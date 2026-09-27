<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCourse } from '../api/courses'
import { getMyCourseReview, submitReview, updateMyReview } from '../api/reviews'
import { useNotificationStore } from '../stores/notifications'
import { buildReviewPayload, isWholeRating, reviewToForm } from '../utils/reviewPayload'

const route = useRoute()
const router = useRouter()
const notificationStore = useNotificationStore()
const loading = ref(true)
const submitting = ref(false)
const course = ref(null)
const ownReview = ref(null)
const form = reactive({ overallRating: 0, difficultyRating: 0, workloadRating: 0, teachingRating: 0, usefulnessRating: 0, assessmentStyle: '', comment: '' })

function applyReview(review) {
  ownReview.value = review
  Object.assign(form, reviewToForm(review))
}

async function load() {
  const courseId = Number(route.query.courseId)
  if (!Number.isInteger(courseId) || courseId <= 0) {
    ElMessage.error('A valid course is required to submit a review.')
    router.replace('/courses')
    return
  }
  try {
    const [courseData, review] = await Promise.all([getCourse(courseId), getMyCourseReview(courseId)])
    course.value = courseData
    applyReview(review)
  } catch (error) {
    ElMessage.error(error.response?.data?.message || 'Unable to load the review form.')
    router.replace(`/courses/${courseId}`)
  } finally {
    loading.value = false
  }
}

async function save() {
  const requiredRatings = [form.overallRating, form.difficultyRating, form.workloadRating]
  const optionalRatings = [form.teachingRating, form.usefulnessRating]
  if (!requiredRatings.every((rating) => isWholeRating(rating, { required: true }))) {
    ElMessage.warning('Please complete the required ratings using whole numbers from 1 to 5.')
    return
  }
  if (!optionalRatings.every((rating) => isWholeRating(rating))) {
    ElMessage.warning('Optional ratings must use whole numbers from 1 to 5.')
    return
  }
  submitting.value = true
  try {
    const courseId = Number(route.query.courseId)
    const data = buildReviewPayload(form)
    const review = ownReview.value ? await updateMyReview(courseId, data) : await submitReview({ courseId, ...data })
    applyReview(review)
    await notificationStore.refresh().catch(() => {})
    ElMessage.success('Your review was submitted and is pending approval.')
    router.push(`/courses/${courseId}`)
  } catch (error) {
    ElMessage.error(error.response?.data?.message || 'Review submission failed.')
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<template>
  <section v-loading="loading" class="review-submit-page">
    <el-card v-if="course" class="review-submit-card">
      <template #header><div><span class="eyebrow">COURSE REVIEW</span><h1>{{ ownReview ? 'Update your review' : 'Share your experience' }}</h1><p>{{ course.code }} · {{ course.name }}</p></div></template>
      <el-alert type="info" :closable="false" title="Reviews are checked by a moderator before publication." />
      <el-form label-position="top" class="review-form" @submit.prevent="save">
        <div class="rating-grid">
          <el-form-item label="Overall rating"><el-rate v-model="form.overallRating" /></el-form-item>
          <el-form-item label="Difficulty"><el-rate v-model="form.difficultyRating" /></el-form-item>
          <el-form-item label="Workload"><el-rate v-model="form.workloadRating" /></el-form-item>
          <el-form-item label="Teaching"><el-rate v-model="form.teachingRating" clearable /></el-form-item>
          <el-form-item label="Usefulness"><el-rate v-model="form.usefulnessRating" clearable /></el-form-item>
        </div>
        <el-form-item label="Assessment style"><el-select v-model="form.assessmentStyle" clearable style="width:100%"><el-option label="Exam heavy" value="EXAM_HEAVY" /><el-option label="Coursework heavy" value="COURSEWORK_HEAVY" /><el-option label="Project based" value="PROJECT_BASED" /><el-option label="Practical" value="PRACTICAL" /><el-option label="Balanced" value="BALANCED" /></el-select></el-form-item>
        <el-form-item label="Comment"><el-input v-model="form.comment" type="textarea" :rows="6" maxlength="2000" show-word-limit /></el-form-item>
        <div class="actions"><el-button @click="router.back()">Cancel</el-button><el-button type="primary" :loading="submitting" @click="save">Submit review</el-button></div>
      </el-form>
    </el-card>
  </section>
</template>
