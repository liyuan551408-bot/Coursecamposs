<!-- @file Coordinates data loading, user actions, and presentation for the compare courses page. -->
<script setup>
/**
 * Course comparison page.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCourses, getCourse } from '../api/courses'
import { getCourseComparisonAnalysis } from '../api/ai'
import { getToken } from '../utils/auth'

const router = useRouter()
const loading = ref(false)
const allCourses = ref([])
const compareIds = ref([])
const compareCourses = ref([])
const searchQuery = ref('')
const aiLoading = ref(false)
const aiAnalysis = ref(null)

const MAX_COMPARE = 4

const filteredCourses = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()
  if (!keyword) return allCourses.value
  return allCourses.value.filter((course) =>
    [course.code, course.name, course.description].some((value) =>
      value?.toLowerCase().includes(keyword)
    )
  )
})

const canAdd = computed(() => compareIds.value.length < MAX_COMPARE)

async function loadCourses() {
  loading.value = true
  try {
    allCourses.value = await getCourses()
  } catch (err) {
    ElMessage.error('Failed to load courses')
  } finally {
    loading.value = false
  }
}

async function addToCompare(courseId) {
  if (!canAdd.value) {
    ElMessage.warning(`You can compare up to ${MAX_COMPARE} courses at a time`)
    return
  }
  if (compareIds.value.includes(Number(courseId))) return

  compareIds.value.push(Number(courseId))
  await loadCompareCourse(courseId)
}

async function loadCompareCourse(courseId) {
  try {
    const course = await getCourse(courseId)
    compareCourses.value.push(course)
    aiAnalysis.value = null
  } catch (err) {
    compareIds.value = compareIds.value.filter((id) => id !== Number(courseId))
    ElMessage.error('Failed to load course details')
  }
}

function removeFromCompare(courseId) {
  const id = Number(courseId)
  compareIds.value = compareIds.value.filter((cid) => cid !== id)
  compareCourses.value = compareCourses.value.filter((c) => c.id !== id)
  aiAnalysis.value = null
}

function clearAll() {
  compareIds.value = []
  compareCourses.value = []
  aiAnalysis.value = null
}

function isInCompare(courseId) {
  return compareIds.value.includes(Number(courseId))
}

/** Request an on-demand AI analysis for the currently selected courses. */
async function generateAiComparison() {
  if (compareIds.value.length < 2) {
    ElMessage.warning('Select at least two courses for an AI comparison')
    return
  }

  if (!getToken()) {
    ElMessage.warning('Please log in before generating an AI comparison')
    router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
    return
  }

  aiLoading.value = true
  aiAnalysis.value = null
  try {
    aiAnalysis.value = await getCourseComparisonAnalysis(compareIds.value)
  } catch (err) {
    const message = err.response?.data?.error
      || err.response?.data?.message
      || (err.response?.status === 404 ? 'The AI comparison endpoint is not available on the current backend' : '')
      || (err.response?.status === 429 ? 'Too many AI requests. Please try again later' : '')
      || (err.response?.status === 503 ? 'The AI provider is busy. Please try again shortly.' : '')
      || (err.response?.status === 504 ? 'The AI provider timed out. Please try again.' : '')
      || (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' ? 'The AI comparison timed out. Please try again.' : '')
      || 'Unable to generate AI comparison'
    ElMessage.error(message)
  } finally {
    aiLoading.value = false
  }
}

/** Convert AI relationship course IDs into readable course codes. */
function courseCodes(courseIds) {
  return courseIds
    .map((id) => compareCourses.value.find((course) => course.id === Number(id))?.code)
    .filter(Boolean)
    .join(' and ')
}

onMounted(loadCourses)
</script>

<template>
  <section class="compare-page">
    <div class="page-header">
      <div>
        <p class="eyebrow">COURSE COMPARISON</p>
        <h1>Compare courses side by side</h1>
        <p>Select up to {{ MAX_COMPARE }} courses to compare credits, workload, ratings and prerequisites.</p>
      </div>
      <el-button v-if="compareCourses.length" plain @click="clearAll">Clear all</el-button>
    </div>

    <!-- Course selection controls. -->
    <el-card class="selector-card" shadow="never">
      <div class="selector-header">
        <h2>Select courses to compare</h2>
        <span class="count-badge">{{ compareIds.length }} / {{ MAX_COMPARE }} selected</span>
      </div>
      <el-input
        v-model="searchQuery"
        clearable
        placeholder="Search by course code, name or keyword"
        class="search-input"
      >
        <template #prefix>⌕</template>
      </el-input>
      <div v-loading="loading" class="course-selector">
        <div
          v-for="course in filteredCourses"
          :key="course.id"
          class="course-item"
          :class="{ selected: isInCompare(course.id), disabled: !canAdd && !isInCompare(course.id) }"
          @click="!isInCompare(course.id) && canAdd && addToCompare(course.id)"
        >
          <div class="course-info">
            <span class="course-code">{{ course.code }}</span>
            <span class="course-name">{{ course.name }}</span>
          </div>
          <el-checkbox
            :model-value="isInCompare(course.id)"
            :disabled="!canAdd && !isInCompare(course.id)"
            @change="isInCompare(course.id) ? removeFromCompare(course.id) : addToCompare(course.id)"
            @click.stop
          />
        </div>
        <el-empty v-if="!loading && !filteredCourses.length" description="No matching courses" />
      </div>
    </el-card>

    <!-- Side-by-side comparison results. -->
    <div v-if="compareCourses.length" class="compare-result">
      <div class="result-heading">
        <h2>Comparison result</h2>
        <el-button
          type="primary"
          :loading="aiLoading"
          :disabled="compareCourses.length < 2"
          @click="generateAiComparison"
        >
          ✨ Generate AI summary
        </el-button>
      </div>

      <!-- On-demand AI analysis of relationships and trade-offs between selected courses. -->
      <el-card v-if="aiAnalysis" class="ai-summary-card" shadow="never">
        <div class="ai-summary-header">
          <div>
            <p class="eyebrow">AI COURSE ANALYSIS</p>
            <h3>How these courses fit together</h3>
          </div>
          <el-tag type="info">Based on selected course data</el-tag>
        </div>

        <p v-if="aiAnalysis.summary" class="ai-summary-text">{{ aiAnalysis.summary }}</p>

        <div v-if="aiAnalysis.relationships?.length" class="ai-section">
          <h4>Course relationships</h4>
          <div v-for="(relationship, index) in aiAnalysis.relationships" :key="`${relationship.type}-${index}`" class="relationship-item">
            <div class="relationship-title">
              <el-tag size="small" type="success">{{ relationship.type }}</el-tag>
              <strong>{{ courseCodes(relationship.courseIds) }}</strong>
            </div>
            <p>{{ relationship.description }}</p>
          </div>
        </div>

        <div v-if="aiAnalysis.learningPath?.length" class="ai-section">
          <h4>Suggested learning order</h4>
          <div class="plain-text-lines">
            <p v-for="item in aiAnalysis.learningPath" :key="`${item.courseId}-${item.position}`">
              <strong>{{ courseCodes([item.courseId]) }}</strong> — {{ item.reason }}
            </p>
          </div>
        </div>

        <div v-if="aiAnalysis.strengths?.length || aiAnalysis.tradeoffs?.length" class="ai-columns ai-section">
          <div v-if="aiAnalysis.strengths?.length">
            <h4>Strengths</h4>
            <div class="plain-text-lines"><p v-for="item in aiAnalysis.strengths" :key="item">{{ item }}</p></div>
          </div>
          <div v-if="aiAnalysis.tradeoffs?.length">
            <h4>Trade-offs</h4>
            <div class="plain-text-lines"><p v-for="item in aiAnalysis.tradeoffs" :key="item">{{ item }}</p></div>
          </div>
        </div>

        <div v-if="aiAnalysis.recommendation" class="ai-recommendation">
          <strong>Overall recommendation</strong>
          <p>{{ aiAnalysis.recommendation }}</p>
        </div>
        <p v-if="aiAnalysis.limitations" class="ai-limitations">{{ aiAnalysis.limitations }}</p>
      </el-card>

    </div>

    <!-- Empty state shown before enough courses are selected. -->
    <el-empty
      v-else
      description="Select courses above to start comparing"
      class="empty-state"
    >
      <el-button type="primary" @click="router.push('/courses')">Browse courses</el-button>
    </el-empty>
  </section>
</template>

<style scoped>
.compare-page {
  max-width: 1100px;
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

.selector-card {
  margin-bottom: 32px;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.selector-header h2 {
  margin: 0;
  font-size: 20px;
}

.count-badge {
  background: var(--accent-bg);
  color: var(--accent);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.search-input {
  margin-bottom: 16px;
}

.course-selector {
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.course-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.15s;
}

.course-item:last-child {
  border-bottom: none;
}

.course-item:hover {
  background: var(--accent-bg);
}

.course-item.selected {
  background: var(--accent-bg);
}

.course-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.course-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.course-code {
  color: var(--accent);
  font-weight: 700;
  font-size: 14px;
}

.course-name {
  color: var(--text-h);
  font-size: 15px;
}

.compare-result h2 {
  margin: 0 0 16px;
  font-size: 24px;
}

.result-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.result-heading h2 {
  margin-bottom: 0;
}

.ai-summary-card {
  margin-bottom: 20px;
  border: 1px solid var(--accent);
  background: var(--accent-bg);
}

.ai-summary-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.ai-summary-header h3 {
  margin: 6px 0 0;
  font-size: 21px;
}

.ai-summary-text,
.relationship-item p,
.ai-recommendation p {
  line-height: 1.6;
}

.ai-summary-text {
  margin: 20px 0 0;
  color: var(--text-h);
  font-size: 16px;
}

.ai-section {
  margin-top: 20px;
}

.ai-section h4 {
  margin: 0 0 10px;
  color: var(--text-h);
}

.relationship-item {
  padding: 10px 0;
  border-top: 1px solid var(--border);
}

.relationship-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.relationship-item p {
  margin: 6px 0 0;
}

.plain-text-lines {
  margin: 0;
  line-height: 1.7;
}

.plain-text-lines p {
  margin: 0 0 8px;
}

.ai-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.ai-recommendation {
  margin-top: 20px;
  padding: 14px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.7);
}

.ai-recommendation p {
  margin: 6px 0 0;
}

.ai-limitations {
  margin: 16px 0 0;
  color: var(--text);
  font-size: 13px;
}

.empty-state {
  padding: 60px 0;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-header h1 {
    font-size: 28px;
  }

  .result-heading,
  .ai-summary-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .ai-columns {
    grid-template-columns: 1fr;
  }
}
</style>
