<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCourses } from '../api/courses'

const router = useRouter()
const loading = ref(false), error = ref(''), query = ref(''), courses = ref([])
const filteredCourses = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return keyword ? courses.value.filter((course) => [course.code, course.name, course.description].some((value) => value?.toLowerCase().includes(keyword))) : courses.value
})
async function loadCourses() {
  loading.value = true; error.value = ''
  try { courses.value = await getCourses() }
  catch (err) { error.value = err.response?.data?.message || 'Courses cannot be loaded right now. Please check that the backend service is running.'; ElMessage.error(error.value) }
  finally { loading.value = false }
}
onMounted(loadCourses)
</script>

<template>
  <section class="course-page">
    <div class="page-heading"><div><p class="eyebrow">COURSE CATALOGUE</p><h1>Discover the right courses for you</h1><p>Review credits, estimated study time and prerequisites before making a confident choice.</p></div><el-button type="primary" plain @click="router.push('/ai-recommend')">Find courses with AI</el-button></div>
    <el-input v-model="query" clearable placeholder="Search by course code, name or keyword" size="large" class="course-search"><template #prefix>⌕</template></el-input>
    <el-alert v-if="error" type="error" :title="error" show-icon :closable="false" class="state-alert"><template #default><el-button link type="primary" @click="loadCourses">Try again</el-button></template></el-alert>
    <div v-loading="loading" class="course-grid"><el-card v-for="course in filteredCourses" :key="course.id" shadow="hover" class="course-card" @click="router.push(`/courses/${course.id}`)"><div class="course-card__top"><span class="course-code">{{ course.code }}</span><span>{{ course.credits }} credits</span></div><h2>{{ course.name }}</h2><p>{{ course.description || 'No course description is available.' }}</p><div class="course-card__bottom"><span>⏱ {{ course.workloadHours || '—' }} hours</span><el-button link type="primary">View details →</el-button></div></el-card><el-empty v-if="!loading && !error && !filteredCourses.length" description="No matching courses" /></div>
  </section>
</template>

<style scoped>
.course-page{max-width:1000px;margin:0 auto}.page-heading{display:flex;justify-content:space-between;align-items:end;gap:24px;margin-bottom:24px}.page-heading h1{margin:4px 0 8px;font-size:36px}.page-heading p{color:var(--text)}.eyebrow{color:var(--accent)!important;font-size:12px;font-weight:700;letter-spacing:.12em}.course-search{margin-bottom:24px}.state-alert{margin-bottom:20px}.course-grid{min-height:180px;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px}.course-card{cursor:pointer;transition:transform .2s ease}.course-card:hover{transform:translateY(-3px)}.course-card__top,.course-card__bottom{display:flex;justify-content:space-between;align-items:center;color:var(--text);font-size:14px}.course-code{color:var(--accent);font-weight:700}.course-card h2{margin:18px 0 10px;font-size:20px}.course-card p{min-height:66px;line-height:1.55;font-size:15px}.course-card__bottom{border-top:1px solid var(--border);padding-top:14px;margin-top:16px}@media(max-width:640px){.page-heading{align-items:start;flex-direction:column}.page-heading h1{font-size:30px}}
</style>
