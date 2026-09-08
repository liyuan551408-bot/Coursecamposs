<!-- @file Coordinates data loading, user actions, and presentation for the planner page. -->
<script setup>
/**
 * Semester planner page.
 */
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePlannerStore } from '../stores/planner'
import { useSavedStore } from '../stores/saved'

const router = useRouter()
const plannerStore = usePlannerStore()
const savedStore = useSavedStore()

const loading = ref(false)
const allCourses = computed(() => savedStore.courses)
const addDialogVisible = ref(false)
const planDialogVisible = ref(false)
const savingPlan = ref(false)
const selectedSemesterId = ref(null)
const searchQuery = ref('')
const planForm = reactive({ name: '', year: new Date().getFullYear(), semester: 'SEMESTER_1' })

const filteredCourses = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()
  if (!keyword) return allCourses.value
  return allCourses.value.filter((course) =>
    [course.code, course.name, course.description].some((value) =>
      value?.toLowerCase().includes(keyword)
    )
  )
})

const totalCredits = computed(() => plannerStore.totalCredits)

const semesterStats = computed(() => {
  return plannerStore.semesters.map((sem) => ({
    ...sem,
    credits: sem.courses.reduce((sum, c) => sum + (c.credits || 0), 0),
    workload: sem.courses.reduce((sum, c) => sum + (c.workloadHours || 0), 0),
  }))
})

async function loadCourses() {
  loading.value = true
  try {
    await Promise.all([
      savedStore.loadSaved({ force: true }),
      plannerStore.loadPlans({ force: true }),
    ])
  } catch (err) {
    ElMessage.error(err.response?.data?.message || 'Failed to load saved courses and plans')
  } finally {
    loading.value = false
  }
}

async function openAddDialog(semesterId) {
  selectedSemesterId.value = semesterId
  searchQuery.value = ''
  loading.value = true
  try {
    await savedStore.loadSaved({ force: true })
    addDialogVisible.value = true
  } catch (err) {
    ElMessage.error(err.response?.data?.message || 'Unable to load your saved courses')
  } finally {
    loading.value = false
  }
}

function isCourseInPlanner(courseId) {
  return plannerStore.isInPlanner(courseId)
}

async function addCourseToSemester(course) {
  if (isCourseInPlanner(course.id)) {
    ElMessage.warning('This course is already in your plan')
    return
  }

  try {
    const result = await plannerStore.addCourse(selectedSemesterId.value, course)
    if (!result.added) return ElMessage.warning('This course is already in your plan')
    ElMessage.success(`${course.code} added to ${getSemesterName(selectedSemesterId.value)}`)
    if (result.warnings.length) ElMessage.warning(result.warnings.join(' '))
    addDialogVisible.value = false
  } catch (err) {
    ElMessage.error(err.response?.data?.message || 'Failed to add course')
  }
}

function getSemesterName(semesterId) {
  const sem = plannerStore.semesters.find((s) => s.id === semesterId)
  return sem ? sem.name : 'Unknown semester'
}

function removeCourse(semesterId, courseId, courseName) {
  ElMessageBox.confirm(
    `Remove "${courseName}" from ${getSemesterName(semesterId)}?`,
    'Remove course',
    {
      confirmButtonText: 'Remove',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }
  )
    .then(async () => {
      await plannerStore.removeCourse(semesterId, courseId)
      ElMessage.success('Course removed')
    })
    .catch((error) => { if (error !== 'cancel' && error !== 'close') ElMessage.error(error.response?.data?.message || 'Unable to remove course') })
}

function addSemester() {
  Object.assign(planForm, { name: `Plan ${plannerStore.semesters.length + 1}`, year: new Date().getFullYear(), semester: 'SEMESTER_1' })
  planDialogVisible.value = true
}

async function createSemester() {
  if (!planForm.name.trim()) return ElMessage.warning('Enter a plan name')
  savingPlan.value = true
  try {
    await plannerStore.addSemester({ ...planForm, name: planForm.name.trim() })
    planDialogVisible.value = false
    ElMessage.success('Semester plan created')
  } catch (err) {
    ElMessage.error(err.response?.data?.message || 'Unable to create plan')
  } finally {
    savingPlan.value = false
  }
}

function removeSemester(semesterId, semesterName) {
  const sem = plannerStore.semesters.find((s) => s.id === semesterId)
  if (sem?.courses.length) {
    ElMessageBox.confirm(
      `${semesterName} contains ${sem.courses.length} course(s). Remove this semester?`,
      'Remove semester',
      {
        confirmButtonText: 'Remove',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )
      .then(async () => {
        await plannerStore.removeSemester(semesterId)
        ElMessage.success('Semester removed')
      })
      .catch((error) => { if (error !== 'cancel' && error !== 'close') ElMessage.error(error.response?.data?.message || 'Unable to remove plan') })
  } else {
    plannerStore.removeSemester(semesterId).then(() => ElMessage.success('Semester removed')).catch((error) => ElMessage.error(error.response?.data?.message || 'Unable to remove plan'))
  }
}

function clearPlan() {
  ElMessageBox.confirm(
    'Clear all planned courses? This action cannot be undone.',
    'Clear plan',
    {
      confirmButtonText: 'Clear all',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }
  )
    .then(async () => {
      await plannerStore.clearAll()
      ElMessage.success('Plan cleared')
    })
    .catch((error) => { if (error !== 'cancel' && error !== 'close') ElMessage.error(error.response?.data?.message || 'Unable to clear plans') })
}

function goToCourseDetail(courseId) {
  router.push(`/courses/${courseId}`)
}

onMounted(loadCourses)
</script>

<template>
  <section class="planner-page">
    <div class="page-header">
      <div>
        <p class="eyebrow">SEMESTER PLANNER</p>
        <h1>Plan your degree pathway</h1>
        <p>Arrange courses across semesters, track credits and check prerequisites.</p>
      </div>
      <div class="header-actions">
        <el-button plain @click="clearPlan">Clear plan</el-button>
        <el-button type="primary" @click="router.push('/courses')">Browse courses</el-button>
      </div>
    </div>

    <!-- Aggregate plan statistics. -->
    <div class="overview-bar">
      <div class="overview-item">
        <span class="overview-number">{{ plannerStore.semesters.length }}</span>
        <span class="overview-label">Semesters</span>
      </div>
      <div class="overview-item">
        <span class="overview-number">{{ totalCredits }}</span>
        <span class="overview-label">Total credits</span>
      </div>
      <div class="overview-item">
        <span class="overview-number">
          {{ plannerStore.semesters.reduce((sum, s) => sum + s.courses.length, 0) }}
        </span>
        <span class="overview-label">Planned courses</span>
      </div>
    </div>

    <!-- Editable semester list. -->
    <div class="semesters-container">
      <div
        v-for="sem in semesterStats"
        :key="sem.id"
        class="semester-card"
      >
        <div class="semester-header">
          <div class="semester-title">
            <h2>{{ sem.name }}</h2>
            <span class="semester-stats">{{ sem.year }} · {{ sem.semester.replaceAll('_', ' ') }} · {{ sem.credits }} credits · {{ sem.workload }} hours</span>
          </div>
          <el-button
            link
            type="danger"
            size="small"
            @click="removeSemester(sem.id, sem.name)"
          >
            Remove
          </el-button>
        </div>

        <div class="semester-courses">
          <div
            v-for="course in sem.courses"
            :key="course.id"
            class="planned-course"
          >
            <div class="course-info" @click="goToCourseDetail(course.id)">
              <span class="course-code">{{ course.code }}</span>
              <span class="course-name">{{ course.name }}</span>
            </div>
            <div class="course-actions">
              <span class="course-credits">{{ course.credits }} pts</span>
              <el-button
                link
                type="danger"
                size="small"
                @click="removeCourse(sem.id, course.id, course.name)"
              >
                ×
              </el-button>
            </div>
          </div>

          <el-empty
            v-if="!sem.courses.length"
            description="No courses planned"
            :image-size="60"
          />
        </div>

        <el-button
          type="primary"
          plain
          class="add-course-btn"
          @click="openAddDialog(sem.id)"
        >
          + Add course
        </el-button>
      </div>

      <!-- Add-semester action. -->
      <div class="add-semester-card" @click="addSemester">
        <div class="add-icon">+</div>
        <span>Add semester</span>
      </div>
    </div>

    <!-- Course selection dialog. -->
    <el-dialog
      v-model="addDialogVisible"
      title="Add course to semester"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-input
        v-model="searchQuery"
        clearable
        placeholder="Search by course code, name or keyword"
        class="dialog-search"
      >
        <template #prefix>⌕</template>
      </el-input>

      <div v-loading="loading" class="course-picker">
        <div
          v-for="course in filteredCourses"
          :key="course.id"
          class="picker-item"
          :class="{ disabled: isCourseInPlanner(course.id) }"
        >
          <div class="picker-info">
            <span class="course-code">{{ course.code }}</span>
            <span class="course-name">{{ course.name }}</span>
            <span class="course-meta">{{ course.credits }} credits · {{ course.workloadHours }}h</span>
          </div>
          <el-button
            v-if="!isCourseInPlanner(course.id)"
            type="primary"
            size="small"
            @click="addCourseToSemester(course)"
          >
            Add
          </el-button>
          <el-tag v-else type="info" size="small">In plan</el-tag>
        </div>
        <el-empty
          v-if="!loading && !filteredCourses.length"
          :description="allCourses.length ? 'No matching saved courses' : 'Save a course before adding it to a plan'"
        >
          <el-button v-if="!allCourses.length" type="primary" @click="addDialogVisible = false; router.push('/courses')">Browse and save courses</el-button>
        </el-empty>
      </div>
    </el-dialog>

    <el-dialog v-model="planDialogVisible" title="Create semester plan" width="min(480px, 94vw)">
      <el-form label-position="top">
        <el-form-item label="Plan name"><el-input v-model="planForm.name" placeholder="e.g. Computer Science pathway" /></el-form-item>
        <div class="plan-form-row">
          <el-form-item label="Year"><el-input-number v-model="planForm.year" :min="2000" :max="2200" /></el-form-item>
          <el-form-item label="Teaching period"><el-select v-model="planForm.semester"><el-option label="Semester 1" value="SEMESTER_1" /><el-option label="Semester 2" value="SEMESTER_2" /><el-option label="Summer" value="SUMMER" /></el-select></el-form-item>
        </div>
      </el-form>
      <template #footer><el-button @click="planDialogVisible = false">Cancel</el-button><el-button type="primary" :loading="savingPlan" @click="createSemester">Create plan</el-button></template>
    </el-dialog>
  </section>
</template>

<style scoped>
.planner-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  margin-bottom: 24px;
}

.eyebrow {
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin: 0;
}

.page-header h1 {
  margin: 8px 0;
  font-size: 36px;
}

.page-header p {
  color: var(--text);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.overview-bar {
  display: flex;
  gap: 32px;
  padding: 20px 24px;
  background: var(--accent-bg);
  border-radius: 12px;
  margin-bottom: 24px;
}

.overview-item {
  display: flex;
  flex-direction: column;
}

.overview-number {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-h);
}

.overview-label {
  font-size: 13px;
  color: var(--text);
  margin-top: 2px;
}

.semesters-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.semester-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

.semester-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.semester-title h2 {
  margin: 0 0 4px;
  font-size: 20px;
  color: var(--text-h);
}

.semester-stats {
  font-size: 13px;
  color: var(--text);
}

.semester-courses {
  flex: 1;
  min-height: 120px;
  margin-bottom: 16px;
}

.planned-course {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: var(--accent-bg);
  border-radius: 8px;
  margin-bottom: 8px;
}

.course-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex: 1;
  min-width: 0;
}

.course-info:hover .course-name {
  color: var(--accent);
}

.course-code {
  color: var(--accent);
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}

.course-name {
  font-size: 14px;
  color: var(--text-h);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.15s;
}

.course-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.course-credits {
  font-size: 12px;
  color: var(--text);
}

.add-course-btn {
  width: 100%;
}

.add-semester-card {
  border: 2px dashed var(--border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 200px;
  color: var(--text);
}

.add-semester-card:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-bg);
}

.add-icon {
  font-size: 36px;
  font-weight: 300;
  line-height: 1;
}

.dialog-search {
  margin-bottom: 16px;
}

.plan-form-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.plan-form-row :deep(.el-input-number), .plan-form-row :deep(.el-select) { width:100%; }

.course-picker {
  max-height: 400px;
  overflow-y: auto;
}

.picker-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.picker-item:last-child {
  border-bottom: none;
}

.picker-item.disabled {
  opacity: 0.6;
}

.picker-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.picker-info .course-name {
  font-size: 14px;
}

.course-meta {
  font-size: 12px;
  color: var(--text);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-header h1 {
    font-size: 28px;
  }

  .overview-bar {
    gap: 20px;
    flex-wrap: wrap;
  }

  .semesters-container {
    grid-template-columns: 1fr;
  }
}
</style>
