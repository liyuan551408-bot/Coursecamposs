<!-- @file Provides backend keyword, fuzzy, and structured course search. -->
<script setup>
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { searchCourses } from '../api/courses'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const error = ref('')
const query = ref(typeof route.query.q === 'string' ? route.query.q : '')
const courses = ref([])
const showFilters = ref(false)
const filters = reactive({ level: '', semester: '', assessmentType: '', minCredits: null, maxCredits: null })
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
  Object.assign(filters, { level: '', semester: '', assessmentType: '', minCredits: null, maxCredits: null })
  runSearch()
}

watch(query, scheduleSearch)
onMounted(runSearch)
onBeforeUnmount(() => {
  clearTimeout(debounceTimer)
  latestSearchId += 1
})
</script>

<template>
  <section class="course-page">
    <div class="page-heading">
      <div><p class="eyebrow">COURSE CATALOGUE</p><h1>Discover the right courses for you</h1><p>Search by course code, name or keyword, even when the spelling is not exact.</p></div>
      <el-button type="primary" plain @click="router.push('/ai-recommend')">Get AI recommendations</el-button>
    </div>

    <el-card class="search-panel" shadow="never">
      <div class="search-row">
        <el-input v-model="query" clearable placeholder="Search by course code, name or keyword" size="large" @keyup.enter="runSearch"><template #prefix>⌕</template></el-input>
        <el-button size="large" @click="showFilters = !showFilters">{{ showFilters ? 'Hide' : 'Advanced' }} filters</el-button>
      </div>

      <div v-show="showFilters" class="filter-grid">
        <el-select v-model="filters.level" clearable placeholder="Course level"><el-option v-for="level in [100,200,300,400,500,600,700,800,900]" :key="level" :label="`Level ${level}`" :value="level" /></el-select>
        <el-select v-model="filters.semester" clearable placeholder="Semester"><el-option v-for="([label, value]) in semesterOptions" :key="value" :label="label" :value="value" /></el-select>
        <el-select v-model="filters.assessmentType" clearable placeholder="Assessment type"><el-option v-for="item in assessmentOptions" :key="item" :label="item.toLowerCase().replace('_', ' ')" :value="item" /></el-select>
        <el-input-number v-model="filters.minCredits" :min="0" controls-position="right" placeholder="Min credits" />
        <el-input-number v-model="filters.maxCredits" :min="0" controls-position="right" placeholder="Max credits" />
        <div class="filter-actions"><el-button @click="resetFilters">Reset</el-button><el-button type="primary" @click="runSearch">Apply filters</el-button></div>
      </div>
    </el-card>

    <el-alert v-if="error" type="error" :title="error" show-icon :closable="false" class="state-alert"><template #default><el-button link type="primary" @click="runSearch">Try again</el-button></template></el-alert>
    <div v-loading="loading" class="course-grid">
      <el-card v-for="course in courses" :key="course.id" shadow="hover" class="course-card" @click="router.push(`/courses/${course.id}`)">
        <div class="course-card__top"><span class="course-code">{{ course.code }}</span><el-tag v-if="course.similarity" type="success" size="small">{{ Math.round(course.similarity * 100) }}% match</el-tag><span v-else>{{ course.credits }} credits</span></div>
        <h2>{{ course.name }}</h2><p>{{ course.description || 'No course description is available.' }}</p>
        <div class="tag-row"><el-tag v-if="course.level" size="small" effect="plain">Level {{ course.level }}</el-tag><el-tag v-for="semester in normalizeSemesters(course.offeredSemesters)" :key="semester" size="small" effect="plain">{{ semester.replaceAll('_', ' ') }}</el-tag></div>
        <div class="course-card__bottom"><span>⏱ {{ course.workloadHours || '—' }} hours</span><el-button link type="primary">View details →</el-button></div>
      </el-card>
      <el-empty v-if="!loading && !error && !courses.length" description="No matching courses" />
    </div>
  </section>
</template>

<style scoped>
.course-page{max-width:1040px;margin:0 auto}.page-heading{display:flex;justify-content:space-between;align-items:end;gap:24px;margin-bottom:24px}.page-heading h1{margin:4px 0 8px;font-size:36px}.page-heading p{color:var(--text)}.eyebrow{color:var(--accent)!important;font-size:12px;font-weight:700;letter-spacing:.12em}.search-panel{margin-bottom:24px;background:rgba(255,255,255,.75)}.search-row{display:grid;grid-template-columns:1fr auto;gap:10px}.filter-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:18px;padding-top:18px;border-top:1px solid var(--border)}.filter-grid :deep(.el-input-number){width:100%}.filter-actions{display:flex;justify-content:flex-end;gap:8px}.state-alert{margin-bottom:20px}.course-grid{min-height:180px;display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:18px}.course-card{cursor:pointer;transition:transform .2s ease}.course-card:hover{transform:translateY(-3px)}.course-card__top,.course-card__bottom{display:flex;justify-content:space-between;align-items:center;color:var(--text);font-size:14px}.course-code{color:var(--accent);font-weight:700}.course-card h2{margin:18px 0 10px;font-size:20px}.course-card p{min-height:66px;line-height:1.55;font-size:15px}.tag-row{display:flex;flex-wrap:wrap;gap:6px}.course-card__bottom{border-top:1px solid var(--border);padding-top:14px;margin-top:16px}@media(max-width:720px){.page-heading{align-items:start;flex-direction:column}.page-heading h1{font-size:30px}.search-row{grid-template-columns:1fr}.filter-grid{grid-template-columns:1fr 1fr}}@media(max-width:480px){.filter-grid{grid-template-columns:1fr}}
</style>
