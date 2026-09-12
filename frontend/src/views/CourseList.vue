<!-- @file Provides backend keyword, fuzzy, and structured course search with quick-save. -->
<script setup>
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { searchCourses } from '../api/courses'
import { useSavedStore } from '../stores/saved'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const savedStore = useSavedStore()
const authStore = useAuthStore()

const loading = ref(false)
const error = ref('')
const query = ref(typeof route.query.q === 'string' ? route.query.q : '')
const courses = ref([])
const showFilters = ref(false)
const savingIds = ref(new Set())
const filters = reactive({ subject: '', level: '', semester: '', assessmentType: '', minCredits: null, maxCredits: null, minWorkload: null, maxWorkload: null, minRating: null, hasPrerequisites: '' })
let debounceTimer
let latestSearchId = 0

const semesterOptions = [
  ['Semester 1', 'SEMESTER_1'], ['Semester 2', 'SEMESTER_2'], ['Summer', 'SUMMER'],
]
const assessmentOptions = ['EXAM', 'ASSIGNMENT', 'QUIZ', 'PROJECT', 'LAB', 'PRESENTATION']

function normalizeSemesters(value) {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string') return []

  const content = value.trim().replace(/^\{/, '').replace(/\}$/, '')
  return content
    ? content.split(',').map((semester) => semester.trim().replace(/^"|"$/g, '')).filter(Boolean)
    : []
}

function cleanFilters() {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value !== null))
}

async function runSearch() {
  clearTimeout(debounceTimer)
  const searchId = ++latestSearchId
  if (filters.minCredits !== null && filters.maxCredits !== null && filters.minCredits > filters.maxCredits) {
    loading.value = false
    ElMessage.warning('Minimum credits cannot exceed maximum credits.')
    return
  }
  if (filters.minWorkload !== null && filters.maxWorkload !== null && filters.minWorkload > filters.maxWorkload) {
    loading.value = false
    ElMessage.warning('Minimum workload cannot exceed maximum workload.')
    return
  }
  loading.value = true
  error.value = ''
  try {
    const advanced = cleanFilters()
    const matches = await searchCourses({ keyword: query.value.trim(), mode: 'fuzzy', ...advanced })
    if (searchId !== latestSearchId) return
    courses.value = matches
    router.replace({ query: { ...(query.value.trim() && { q: query.value.trim() }) } })
  } catch (err) {
    if (searchId !== latestSearchId) return
    error.value = err.response?.data?.error || err.response?.data?.message || 'Courses cannot be searched right now.'
  } finally {
    if (searchId === latestSearchId) loading.value = false
  }
}

function scheduleSearch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(runSearch, 250)
}

function resetFilters() {
  Object.assign(filters, { subject: '', level: '', semester: '', assessmentType: '', minCredits: null, maxCredits: null, minWorkload: null, maxWorkload: null, minRating: null, hasPrerequisites: '' })
  runSearch()
}

async function handleQuickSave(course, event) {
  event.stopPropagation()
  if (!authStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: route.fullPath } })
    return
  }
  const id = Number(course.id)
  if (savingIds.value.has(id)) return
  savingIds.value.add(id)
  try {
    const saved = await savedStore.toggleSave(id)
    ElMessage.success(saved ? `Saved "${course.code}" to your list` : `Removed "${course.code}" from saved`)
  } catch (err) {
    ElMessage.error(err.response?.data?.message || 'Unable to update saved courses')
  } finally {
    savingIds.value.delete(id)
  }
}

function goToDetail(courseId) {
  router.push(`/courses/${courseId}`)
}

watch(query, scheduleSearch)

onMounted(async () => {
  runSearch()
  if (authStore.isLoggedIn) {
    savedStore.loadSaved().catch(() => {})
  }
})

onBeforeUnmount(() => {
  clearTimeout(debounceTimer)
  latestSearchId += 1
})
</script>

<template>
  <section class="course-page">
    <div class="page-heading">
      <div class="heading-text">
        <p class="eyebrow">COURSE CATALOGUE</p>
        <h1>Discover the right courses for you</h1>
        <p>Search by course code, name or keyword — even when the spelling is not exact. Quick-save courses for later.</p>
      </div>
      <el-button type="primary" plain @click="router.push('/ai-recommend')" class="heading-btn">
        🤖 Get AI recommendations
      </el-button>
    </div>

    <el-card class="search-panel" shadow="never">
      <div class="search-row">
        <el-input
          v-model="query"
          clearable
          placeholder="Search by course code, name or keyword..."
          size="large"
          @keyup.enter="runSearch"
        >
          <template #prefix>
            <span class="search-icon">⌕</span>
          </template>
        </el-input>
        <el-button size="large" @click="showFilters = !showFilters" class="filter-btn">
          {{ showFilters ? 'Hide filters' : 'Advanced filters' }}
        </el-button>
      </div>

      <div v-show="showFilters" class="filter-grid">
        <el-input v-model="filters.subject" clearable placeholder="Subject or code prefix" />
        <el-select v-model="filters.level" clearable placeholder="Course level">
          <el-option v-for="level in [100,200,300,400,500,600,700,800,900]" :key="level" :label="`Level ${level}`" :value="level" />
        </el-select>
        <el-select v-model="filters.semester" clearable placeholder="Semester">
          <el-option v-for="([label, value]) in semesterOptions" :key="value" :label="label" :value="value" />
        </el-select>
        <el-select v-model="filters.assessmentType" clearable placeholder="Assessment type">
          <el-option v-for="item in assessmentOptions" :key="item" :label="item.toLowerCase().replace('_', ' ')" :value="item" />
        </el-select>
        <el-input-number v-model="filters.minCredits" :min="0" controls-position="right" placeholder="Min credits" />
        <el-input-number v-model="filters.maxCredits" :min="0" controls-position="right" placeholder="Max credits" />
        <el-input-number v-model="filters.minWorkload" :min="0" controls-position="right" placeholder="Min workload hours" />
        <el-input-number v-model="filters.maxWorkload" :min="0" controls-position="right" placeholder="Max workload hours" />
        <el-input-number v-model="filters.minRating" :min="1" :max="5" controls-position="right" placeholder="Min rating" />
        <el-select v-model="filters.hasPrerequisites" clearable placeholder="Prerequisites">
          <el-option label="Has prerequisites" value="true" />
          <el-option label="No prerequisites" value="false" />
        </el-select>
        <div class="filter-actions">
          <el-button @click="resetFilters">Reset</el-button>
          <el-button type="primary" @click="runSearch">Apply filters</el-button>
        </div>
      </div>
    </el-card>

    <el-alert
      v-if="error"
      type="error"
      :title="error"
      show-icon
      :closable="false"
      class="state-alert"
    >
      <template #default>
        <el-button link type="primary" @click="runSearch">Try again</el-button>
      </template>
    </el-alert>

    <div v-loading="loading" class="course-grid">
      <el-card
        v-for="course in courses"
        :key="course.id"
        shadow="hover"
        class="course-card"
        role="link"
        tabindex="0"
        @click="goToDetail(course.id)"
        @keydown.enter.self="goToDetail(course.id)"
        @keydown.space.self.prevent="goToDetail(course.id)"
      >
        <!-- Quick save button -->
        <button
          class="quick-save-btn"
          :class="{ 'quick-save-btn--saved': savedStore.isSaved(course.id), 'quick-save-btn--loading': savingIds.has(course.id) }"
          :title="savedStore.isSaved(course.id) ? 'Remove from saved' : 'Quick save'"
          @click="handleQuickSave(course, $event)"
        >
          <svg v-if="!savedStore.isSaved(course.id)" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>

        <div class="course-card__top">
          <span class="course-code">{{ course.code }}</span>
          <el-tag v-if="course.similarity" type="success" size="small" effect="dark">
            {{ Math.round(course.similarity * 100) }}% match
          </el-tag>
          <span v-else class="course-credits">{{ course.credits }} credits</span>
        </div>

        <h2 class="course-name text-clamp-2">{{ course.name }}</h2>
        <p class="course-desc text-clamp-3">{{ course.description || 'No course description is available.' }}</p>

        <div class="tag-row">
          <el-tag v-if="course.level" size="small" effect="plain" type="info">Level {{ course.level }}</el-tag>
          <el-tag
            v-for="semester in normalizeSemesters(course.offeredSemesters)"
            :key="semester"
            size="small"
            effect="plain"
          >
            {{ semester.replaceAll('_', ' ') }}
          </el-tag>
        </div>

        <div class="course-card__bottom">
          <span class="workload">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {{ course.workloadHours || '—' }} hours
          </span>
          <span class="view-details">View details →</span>
        </div>
      </el-card>

      <el-empty v-if="!loading && !error && !courses.length" description="No matching courses found" class="empty-state" />
    </div>
  </section>
</template>

<style scoped>
.course-page {
  max-width: 1100px;
  margin: 0 auto;
}

.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  margin-bottom: 28px;
}

.heading-text {
  flex: 1;
  min-width: 0;
}

.heading-text h1 {
  margin: 6px 0 8px;
  font-size: clamp(26px, 3.5vw, 38px);
  font-weight: 700;
}

.heading-text p {
  color: var(--text);
  font-size: 15px;
  line-height: 1.6;
  max-width: 560px;
}

.eyebrow {
  color: var(--accent) !important;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin: 0;
  text-transform: uppercase;
}

.heading-btn {
  flex-shrink: 0;
  white-space: nowrap;
}

/* Search panel */
.search-panel {
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-lg) !important;
}

.search-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.search-icon {
  font-size: 18px;
  color: var(--text-muted);
}

.filter-btn {
  white-space: nowrap;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
}

.filter-grid :deep(.el-input-number) {
  width: 100%;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  align-items: center;
}

.state-alert {
  margin-bottom: 20px;
  border-radius: var(--radius) !important;
}

/* Course grid */
.course-grid {
  min-height: 200px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

/* Course card */
.course-card {
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  position: relative;
  overflow: visible;
  border-radius: var(--radius-lg) !important;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--accent-border);
}

/* Quick save button */
.quick-save-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  color: var(--text-muted);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.2s ease;
  padding: 0;
}

.quick-save-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-bg);
  transform: scale(1.1);
}

.quick-save-btn--saved {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-bg);
}

.quick-save-btn--saved:hover {
  color: var(--danger);
  border-color: var(--danger);
  background: rgba(239, 68, 68, 0.1);
}

.quick-save-btn--loading {
  opacity: 0.5;
  pointer-events: none;
}

/* Card content */
.course-card__top {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  color: var(--text);
  font-size: 14px;
  padding-right: 44px;
}

.course-code {
  color: var(--accent);
  font-weight: 700;
  font-size: 13px;
  background: var(--accent-bg);
  padding: 3px 8px;
  border-radius: 6px;
}

.course-credits {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.course-name {
  margin: 14px 0 8px;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--text-h);
  min-height: 50px;
}

.course-desc {
  min-height: 66px;
  line-height: 1.6;
  font-size: 14px;
  color: var(--text);
  margin: 0 0 14px;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}

.course-card__bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border-light);
  padding-top: 14px;
}

.workload {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
}

.view-details {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  transition: transform 0.2s ease;
}

.course-card:hover .view-details {
  transform: translateX(4px);
}

.empty-state {
  grid-column: 1 / -1;
  padding: 60px 0;
}

/* Responsive */
@media (max-width: 768px) {
  .page-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .search-row {
    grid-template-columns: 1fr;
  }

  .filter-grid {
    grid-template-columns: 1fr 1fr;
  }

  .course-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .filter-grid {
    grid-template-columns: 1fr;
  }
}
</style>
