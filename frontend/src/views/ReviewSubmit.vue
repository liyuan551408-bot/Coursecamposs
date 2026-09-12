<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCourse } from '../api/courses'
import { getMyCourseReview, submitReview, updateMyReview } from '../api/reviews'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const submitting = ref(false)
const course = ref(null)
const ownReview = ref(null)
const form = reactive({ overallRating: 0, difficultyRating: 0, workloadRating: 0, teachingRating: 0, usefulnessRating: 0, assessmentStyle: '', comment: '' })

function applyReview(review) {
  ownReview.value = review
  if (review) Object.assign(form, review)
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
  if (![form.overallRating, form.difficultyRating, form.workloadRating].every(Boolean)) {
    ElMessage.warning('Please complete the overall, difficulty, and workload ratings.')
    return
  }
  submitting.value = true
  try {
    const courseId = Number(route.query.courseId)
    const data = { ...form }
    const review = ownReview.value ? await updateMyReview(courseId, data) : await submitReview({ courseId, ...data })
    applyReview(review)
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
          <el-form-item label="Overall rating"><el-rate v-model="form.overallRating" allow-half /></el-form-item>
          <el-form-item label="Difficulty"><el-rate v-model="form.difficultyRating" allow-half /></el-form-item>
          <el-form-item label="Workload"><el-rate v-model="form.workloadRating" allow-half /></el-form-item>
          <el-form-item label="Teaching"><el-rate v-model="form.teachingRating" allow-half /></el-form-item>
          <el-form-item label="Usefulness"><el-rate v-model="form.usefulnessRating" allow-half /></el-form-item>
        </div>
        <el-form-item label="Assessment style"><el-select v-model="form.assessmentStyle" clearable style="width:100%"><el-option label="Exam heavy" value="EXAM_HEAVY" /><el-option label="Coursework heavy" value="COURSEWORK_HEAVY" /><el-option label="Project based" value="PROJECT_BASED" /><el-option label="Practical" value="PRACTICAL" /><el-option label="Balanced" value="BALANCED" /></el-select></el-form-item>
        <el-form-item label="Comment"><el-input v-model="form.comment" type="textarea" :rows="6" maxlength="2000" show-word-limit /></el-form-item>
        <div class="actions"><el-button @click="router.back()">Cancel</el-button><el-button type="primary" :loading="submitting" @click="save">Submit review</el-button></div>
      </el-form>
    </el-card>
  </section>
</template>
