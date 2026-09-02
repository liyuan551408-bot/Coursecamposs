<script setup>
/**
 * 课程对比页面
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCourses, getCourse } from '../api/courses'
import { getCourseReviews } from '../api/reviews'

const router = useRouter()
const loading = ref(false)
const allCourses = ref([])
const compareIds = ref([])
const compareCourses = ref([])
const searchQuery = ref('')

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
    const [course, reviews] = await Promise.all([
      getCourse(courseId),
      getCourseReviews(courseId),
    ])
    const avgRating = reviews.length
      ? (reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length).toFixed(1)
      : '—'
    const avgDifficulty = reviews.length
      ? (reviews.reduce((sum, r) => sum + r.difficultyRating, 0) / reviews.length).toFixed(1)
      : '—'
    const avgWorkload = reviews.length
      ? (reviews.reduce((sum, r) => sum + r.workloadRating, 0) / reviews.length).toFixed(1)
      : '—'

    compareCourses.value.push({
      ...course,
      avgRating,
      avgDifficulty,
      avgWorkload,
      reviewCount: reviews.length,
    })
  } catch (err) {
    compareIds.value = compareIds.value.filter((id) => id !== Number(courseId))
    ElMessage.error('Failed to load course details')
  }
}

function removeFromCompare(courseId) {
  const id = Number(courseId)
  compareIds.value = compareIds.value.filter((cid) => cid !== id)
  compareCourses.value = compareCourses.value.filter((c) => c.id !== id)
}

function clearAll() {
  compareIds.value = []
  compareCourses.value = []
}

function isInCompare(courseId) {
  return compareIds.value.includes(Number(courseId))
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

    <!-- 课程选择区 -->
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

    <!-- 对比结果区 -->
    <div v-if="compareCourses.length" class="compare-result">
      <h2>Comparison result</h2>
      <div class="compare-table-wrapper">
        <table class="compare-table">
          <thead>
            <tr>
              <th class="row-label">Attribute</th>
              <th v-for="course in compareCourses" :key="course.id" class="course-col">
                <div class="col-header">
                  <span class="course-code">{{ course.code }}</span>
                  <el-button link type="danger" size="small" @click="removeFromCompare(course.id)">
                    Remove
                  </el-button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="row-label">Course name</td>
              <td v-for="course in compareCourses" :key="course.id">
                <router-link :to="`/courses/${course.id}`" class="course-link">
                  {{ course.name }}
                </router-link>
              </td>
            </tr>
            <tr>
              <td class="row-label">Credits</td>
              <td v-for="course in compareCourses" :key="course.id">{{ course.credits }} points</td>
            </tr>
            <tr>
              <td class="row-label">Estimated study time</td>
              <td v-for="course in compareCourses" :key="course.id">
                {{ course.workloadHours || 'Not provided' }} {{ course.workloadHours ? 'hours' : '' }}
              </td>
            </tr>
            <tr>
              <td class="row-label">Average rating</td>
              <td v-for="course in compareCourses" :key="course.id">
                <span class="rating-value">{{ course.avgRating }}</span>
                <span class="text-muted"> ({{ course.reviewCount }} reviews)</span>
              </td>
            </tr>
            <tr>
              <td class="row-label">Average difficulty</td>
              <td v-for="course in compareCourses" :key="course.id">
                <el-rate :model-value="Number(course.avgDifficulty) || 0" disabled size="small" />
                <span class="text-muted"> {{ course.avgDifficulty }}/5</span>
              </td>
            </tr>
            <tr>
              <td class="row-label">Average workload</td>
              <td v-for="course in compareCourses" :key="course.id">
                <el-rate :model-value="Number(course.avgWorkload) || 0" disabled size="small" />
                <span class="text-muted"> {{ course.avgWorkload }}/5</span>
              </td>
            </tr>
            <tr>
              <td class="row-label">Prerequisites</td>
              <td v-for="course in compareCourses" :key="course.id">
                <div v-if="course.prerequisites?.length" class="prereq-list">
                  <el-tag
                    v-for="pre in course.prerequisites"
                    :key="pre.id"
                    size="small"
                    type="warning"
                  >
                    {{ pre.code }}
                  </el-tag>
                </div>
                <span v-else class="text-muted">None</span>
              </td>
            </tr>
            <tr>
              <td class="row-label">Description</td>
              <td v-for="course in compareCourses" :key="course.id" class="desc-cell">
                {{ course.description || 'No description available' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 空状态 -->
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

.compare-table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.compare-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.compare-table th,
.compare-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}

.compare-table thead th {
  background: var(--accent-bg);
  font-weight: 600;
}

.compare-table tbody tr:last-child td {
  border-bottom: none;
}

.compare-table tbody tr:hover {
  background: rgba(0, 0, 0, 0.02);
}

.row-label {
  font-weight: 600;
  color: var(--text-h);
  background: rgba(0, 0, 0, 0.02);
  width: 160px;
  position: sticky;
  left: 0;
  z-index: 1;
}

.col-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.course-col {
  min-width: 200px;
}

.course-link {
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
}

.course-link:hover {
  text-decoration: underline;
}

.rating-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-h);
}

.text-muted {
  color: var(--text);
  font-size: 13px;
}

.prereq-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.desc-cell {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text);
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

  .row-label {
    width: 120px;
    font-size: 14px;
  }
}
</style>
