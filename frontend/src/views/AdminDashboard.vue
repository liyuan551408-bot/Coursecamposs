<!-- @file Coordinates course creation and links administrators to protected moderation tools. -->
<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createCourse } from '../api/courses'

const router = useRouter()
const courseForm = reactive({ name: '', code: '', credits: 15, description: '', workloadHours: 120 })
const prerequisiteIdsInput = ref('')
const courseLoading = ref(false)

function parsePrerequisiteIds(input) {
  return input.split(',').map((id) => id.trim()).filter(Boolean)
}

async function submitCourse() {
  if (!courseForm.name || !courseForm.code) {
    return ElMessage.warning('Enter a course name and code.')
  }

  courseLoading.value = true
  try {
    await createCourse({
      ...courseForm,
      prerequisiteIds: parsePrerequisiteIds(prerequisiteIdsInput.value),
    })
    ElMessage.success('Course created. Its search vector is being generated in the background.')
    Object.assign(courseForm, {
      name: '',
      code: '',
      credits: 15,
      description: '',
      workloadHours: 120,
    })
    prerequisiteIdsInput.value = ''
  } catch (err) {
    ElMessage.error(err.response?.data?.message || 'Unable to create course.')
  } finally {
    courseLoading.value = false
  }
}
</script>

<template>
  <section class="admin-page">
    <div>
      <p class="eyebrow">ADMIN CONSOLE</p>
      <h1>Course management</h1>
      <p class="muted">Create courses, assign prerequisites, and open the publication queue.</p>
    </div>

    <div class="admin-grid">
      <el-card>
        <h2>Create a course</h2>
        <el-form label-position="top">
          <el-form-item label="Course name"><el-input v-model="courseForm.name" /></el-form-item>
          <el-form-item label="Course code"><el-input v-model="courseForm.code" placeholder="e.g. COMP101" /></el-form-item>
          <div class="form-row">
            <el-form-item label="Credits"><el-input-number v-model="courseForm.credits" :min="1" /></el-form-item>
            <el-form-item label="Estimated study hours"><el-input-number v-model="courseForm.workloadHours" :min="1" /></el-form-item>
          </div>
          <el-form-item label="Course description"><el-input v-model="courseForm.description" type="textarea" /></el-form-item>
          <el-form-item label="Prerequisites (IDs or course codes, comma-separated)">
            <el-input v-model="prerequisiteIdsInput" placeholder="e.g. 1, 3 or 159.101, 159.201" />
          </el-form-item>
          <el-button type="primary" :loading="courseLoading" @click="submitCourse">Create course</el-button>
        </el-form>
      </el-card>

      <el-card class="moderation-card">
        <span class="moderation-kicker">PUBLICATION CONTROL</span>
        <h2>Review moderation</h2>
        <p class="muted">Inspect pending student feedback and decide whether each review is ready to publish.</p>
        <el-button type="primary" plain @click="router.push('/moderation')">Open moderation queue</el-button>
      </el-card>
    </div>
  </section>
</template>

<style scoped>
.admin-page { max-width: 950px; margin: 0 auto; }
.eyebrow { color: var(--accent); font-size: 12px; font-weight: 700; letter-spacing: .12em; }
.admin-page h1 { margin: 6px 0; }
.muted { color: var(--text); font-size: 14px; line-height: 1.6; }
.admin-grid { display: grid; grid-template-columns: 1.2fr .8fr; gap: 20px; margin-top: 28px; }
.admin-grid h2 { margin-top: 0; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.moderation-card { border-top: 4px solid var(--accent); }
.moderation-card .el-button { margin-top: 22px; }
.moderation-kicker { display: block; margin-bottom: 10px; color: var(--accent); font: 700 11px/1.4 var(--mono); letter-spacing: .14em; }
@media (max-width: 700px) { .admin-grid { grid-template-columns: 1fr; } }
</style>
