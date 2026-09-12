<!-- @file Displays and edits profile preferences and completed courses. -->
<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { searchCourses } from '../api/courses'
import { getCompletedCourses, getProfile, markCourseCompleted, unmarkCourseCompleted, updateProfile } from '../api/users'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const loading = ref(true)
const saving = ref(false)
const completedLoading = ref(false)
const profile = ref(null)
const completed = ref([])
const courseOptions = ref([])
const selectedCourseId = ref(null)
const completedAt = ref(new Date().toISOString().slice(0, 10))
const form = reactive({ name: '', major: '', studyYear: null, interests: [], goals: [], preferredCredits: 60, preferredAssessmentTypes: [], preferredWorkload: '', avoidExamHeavy: false, planningNotes: '' })
const completedIds = computed(() => new Set(completed.value.map((item) => item.courseId)))
const availableCourses = computed(() => courseOptions.value.filter((course) => !completedIds.value.has(course.id)))
const completedCredits = computed(() => completed.value.reduce((sum, item) => sum + (item.course.credits || 0), 0))

function fillForm(user) {
  const preferences = user.planningPreferences || {}
  Object.assign(form, {
    name: user.name || '', major: user.major || '', studyYear: user.studyYear,
    interests: [...(user.interests || [])], goals: [...(user.goals || [])],
    preferredCredits: preferences.maxCreditsPerSemester ?? preferences.preferredCredits ?? 60,
    preferredAssessmentTypes: [...(preferences.preferredAssessmentTypes || [])],
    preferredWorkload: preferences.preferredWorkload || '',
    avoidExamHeavy: Boolean(preferences.avoidExamHeavy),
    planningNotes: preferences.notes || '',
  })
}

async function loadPage() {
  loading.value = true
  try {
    const [user, completedRecords, courses] = await Promise.all([getProfile(), getCompletedCourses(), searchCourses()])
    profile.value = user
    completed.value = completedRecords
    courseOptions.value = courses
    fillForm(user)
  } catch (err) { ElMessage.error(err.response?.data?.message || 'Unable to load your profile.') }
  finally { loading.value = false }
}

async function saveProfile() {
  if (!form.name.trim()) return ElMessage.warning('Name is required.')
  saving.value = true
  try {
    const preferences = {
      ...(profile.value?.planningPreferences || {}),
      maxCreditsPerSemester: form.preferredCredits,
      preferredAssessmentTypes: form.preferredAssessmentTypes,
      preferredWorkload: form.preferredWorkload || null,
      avoidExamHeavy: form.avoidExamHeavy,
      notes: form.planningNotes.trim(),
    }
    const user = await updateProfile({ name: form.name, major: form.major, studyYear: form.studyYear, interests: form.interests, goals: form.goals, planningPreferences: preferences })
    profile.value = user
    authStore.updateUser(user)
    ElMessage.success('Profile saved.')
  } catch (err) { ElMessage.error(err.response?.data?.message || 'Unable to save profile.') }
  finally { saving.value = false }
}

async function addCompleted() {
  if (!selectedCourseId.value) return ElMessage.warning('Select a course first.')
  completedLoading.value = true
  try {
    const record = await markCourseCompleted(selectedCourseId.value, completedAt.value)
    completed.value.push(record)
    selectedCourseId.value = null
    ElMessage.success('Completed course added.')
  } catch (err) { ElMessage.error(err.response?.data?.message || 'Unable to add completed course.') }
  finally { completedLoading.value = false }
}


async function removeCompleted(record) {
  try {
    await ElMessageBox.confirm(`Remove ${record.course.code} from completed courses?`, 'Remove completed course', { type: 'warning' })
    await unmarkCourseCompleted(record.courseId)
    completed.value = completed.value.filter((item) => item.courseId !== record.courseId)
    ElMessage.success('Completed course removed.')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error(error.response?.data?.message || 'Unable to remove completed course.')
  }
}

onMounted(loadPage)
</script>

<template>
  <section v-loading="loading" class="profile-page">
    <div class="page-heading"><div><p class="eyebrow">YOUR ACCOUNT</p><h1>Profile & study context</h1><p>Keep your course history and preferences current so planning and AI recommendations can fit you better.</p></div><el-tag v-if="profile" size="large">{{ profile.role }}</el-tag></div>

    <div v-if="profile" class="profile-grid">
      <el-card><template #header><strong>Profile details</strong></template>
        <el-form label-position="top">
          <div class="form-row"><el-form-item label="Name"><el-input v-model="form.name" /></el-form-item><el-form-item label="Email"><el-input :model-value="profile.email" disabled /></el-form-item></div>
          <div class="form-row"><el-form-item label="Major"><el-input v-model="form.major" placeholder="e.g. Computer Science" /></el-form-item><el-form-item label="Study year"><el-input-number v-model="form.studyYear" :min="1" :max="8" /></el-form-item></div>
          <el-form-item label="Interests"><el-select v-model="form.interests" multiple filterable allow-create default-first-option placeholder="Type an interest and press Enter" style="width:100%" /></el-form-item>
          <el-form-item label="Study goals"><el-select v-model="form.goals" multiple filterable allow-create default-first-option placeholder="Type a goal and press Enter" style="width:100%" /></el-form-item>
        </el-form>
      </el-card>

      <el-card><template #header><strong>Planning preferences</strong></template>
        <el-form label-position="top">
          <el-form-item label="Preferred credits per semester"><el-input-number v-model="form.preferredCredits" :min="0" :max="200" /></el-form-item>
          <el-form-item label="Preferred assessment types"><el-select v-model="form.preferredAssessmentTypes" multiple clearable style="width:100%"><el-option v-for="item in ['EXAM','ASSIGNMENT','QUIZ','PROJECT','LAB','PRESENTATION']" :key="item" :label="item" :value="item" /></el-select></el-form-item>
          <div class="form-row"><el-form-item label="Preferred workload"><el-select v-model="form.preferredWorkload" clearable style="width:100%"><el-option label="Light" value="LIGHT" /><el-option label="Medium" value="MEDIUM" /><el-option label="High" value="HIGH" /></el-select></el-form-item><el-form-item label="Assessment balance"><el-checkbox v-model="form.avoidExamHeavy">Avoid exam-heavy courses</el-checkbox></el-form-item></div>
          <el-form-item label="Planning notes"><el-input v-model="form.planningNotes" type="textarea" :rows="4" maxlength="500" show-word-limit /></el-form-item>
          <el-button type="primary" :loading="saving" @click="saveProfile">Save profile</el-button>
        </el-form>
      </el-card>

    </div>

    <el-card v-if="profile" class="completed-card">
      <template #header><div class="card-heading"><div><strong>Completed courses</strong><span>{{ completed.length }} courses · {{ completedCredits }} credits</span></div></div></template>
      <div class="completed-form"><el-select v-model="selectedCourseId" filterable placeholder="Select a course" style="width:100%"><el-option v-for="course in availableCourses" :key="course.id" :label="`${course.code} · ${course.name}`" :value="course.id" /></el-select><el-date-picker v-model="completedAt" type="date" value-format="YYYY-MM-DD" placeholder="Completion date" /><el-button type="primary" :loading="completedLoading" @click="addCompleted">Add completed</el-button></div>
      <el-table :data="completed"><el-table-column label="Course" min-width="250"><template #default="{ row }"><strong>{{ row.course.code }}</strong> · {{ row.course.name }}</template></el-table-column><el-table-column prop="course.credits" label="Credits" width="90" /><el-table-column label="Completed" width="150"><template #default="{ row }">{{ row.completedAt ? new Date(row.completedAt).toLocaleDateString('en-NZ') : 'Not specified' }}</template></el-table-column><el-table-column width="90"><template #default="{ row }"><el-button link type="danger" @click="removeCompleted(row)">Remove</el-button></template></el-table-column></el-table>
      <el-empty v-if="!completed.length" description="No completed courses recorded" :image-size="70" />
    </el-card>
  </section>
</template>

<style scoped>
.profile-page{max-width:1040px;margin:0 auto;min-height:320px}.page-heading{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:24px}.page-heading h1{margin:6px 0 8px}.page-heading p{color:var(--text);max-width:720px}.eyebrow{color:var(--accent)!important;font:700 12px/1.4 var(--mono);letter-spacing:.12em}.profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}.form-row :deep(.el-input-number){width:100%}.completed-card{margin-top:18px}.card-heading>div{display:flex;align-items:center;justify-content:space-between}.card-heading span{color:var(--text);font-size:13px}.completed-form{display:grid;grid-template-columns:1fr 190px auto;gap:10px;margin-bottom:18px}@media(max-width:760px){.profile-grid{grid-template-columns:1fr}.completed-form{grid-template-columns:1fr}.completed-form :deep(.el-date-editor){width:100%}}@media(max-width:500px){.form-row{grid-template-columns:1fr}}
</style>
