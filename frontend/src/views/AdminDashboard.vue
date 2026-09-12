<!-- @file Provides administrator course creation, editing, and moderation links. -->
<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createCourse, getAdminCourses, updateCourse } from '../api/courses'

const router = useRouter()
const courses = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editingId = ref(null)
const query = ref('')
const prerequisiteIdsInput = ref('')
const emptyForm = () => ({ name: '', code: '', credits: 15, description: '', workloadHours: 120, level: null, offeredSemesters: [], assessmentTypes: [], officialLink: '', isActive: true })
const courseForm = reactive(emptyForm())
const filteredCourses = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return keyword ? courses.value.filter((course) => `${course.code} ${course.name}`.toLowerCase().includes(keyword)) : courses.value
})
const parsePrerequisiteIds = (input) => input.split(',').map((value) => value.trim()).filter(Boolean)

async function loadCourses() {
  loading.value = true
  try { courses.value = await getAdminCourses() }
  catch (err) { ElMessage.error(err.response?.data?.message || 'Unable to load courses.') }
  finally { loading.value = false }
}
function openCreate() { editingId.value = null; Object.assign(courseForm, emptyForm()); prerequisiteIdsInput.value = ''; dialogVisible.value = true }
function openEdit(course) {
  editingId.value = course.id
  Object.assign(courseForm, { name: course.name, code: course.code, credits: course.credits, description: course.description || '', workloadHours: course.workloadHours, level: course.level, offeredSemesters: [...(course.offeredSemesters || [])], assessmentTypes: [...(course.assessmentTypes || [])], officialLink: course.officialLink || '', isActive: course.isActive })
  prerequisiteIdsInput.value = (course.prerequisites || []).map((item) => item.code).join(', ')
  dialogVisible.value = true
}
async function save() {
  if (!courseForm.name.trim() || !courseForm.code.trim()) return ElMessage.warning('Enter a course name and code.')
  saving.value = true
  try {
    const payload = { ...courseForm, code: courseForm.code.trim().toUpperCase(), prerequisiteIds: parsePrerequisiteIds(prerequisiteIdsInput.value) }
    if (editingId.value) await updateCourse(editingId.value, payload)
    else await createCourse(payload)
    ElMessage.success(editingId.value ? 'Course updated.' : 'Course created.')
    dialogVisible.value = false
    await loadCourses()
  } catch (err) { ElMessage.error(err.response?.data?.message || 'Unable to save course.') }
  finally { saving.value = false }
}
onMounted(loadCourses)
</script>

<template>
  <section class="admin-page">
    <div class="page-heading"><div><p class="eyebrow">ADMIN CONSOLE</p><h1>Course management</h1><p class="muted">Create courses, edit catalogue data and control publication workflows.</p></div><el-button type="primary" @click="openCreate">+ Create course</el-button></div>
    <div class="admin-grid">
      <el-card class="catalogue-card"><template #header><div class="card-header"><strong>Course catalogue</strong><el-input v-model="query" clearable placeholder="Search code or name" /></div></template>
        <el-table v-loading="loading" :data="filteredCourses" max-height="620"><el-table-column prop="code" label="Code" width="120" /><el-table-column prop="name" label="Course" min-width="220" /><el-table-column prop="level" label="Level" width="80" /><el-table-column prop="credits" label="Credits" width="85" /><el-table-column label="Status" width="90"><template #default="{ row }"><el-tag :type="row.isActive ? 'success' : 'info'">{{ row.isActive ? 'Active' : 'Inactive' }}</el-tag></template></el-table-column><el-table-column label="" width="85" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openEdit(row)">Edit</el-button></template></el-table-column></el-table>
      </el-card>
      <el-card class="moderation-card"><span class="moderation-kicker">PUBLICATION CONTROL</span><h2>Review moderation</h2><p class="muted">Approve new reviews and resolve reports about published feedback.</p><el-button type="primary" plain @click="router.push('/moderation')">Open moderation queue</el-button></el-card>
    </div>
    <el-dialog v-model="dialogVisible" :title="editingId ? 'Edit course' : 'Create course'" width="min(720px, 94vw)" :close-on-click-modal="false"><el-form label-position="top"><div class="form-row"><el-form-item label="Course name"><el-input v-model="courseForm.name" /></el-form-item><el-form-item label="Course code"><el-input v-model="courseForm.code" placeholder="e.g. COMP101" /></el-form-item></div><div class="form-row thirds"><el-form-item label="Credits"><el-input-number v-model="courseForm.credits" :min="1" /></el-form-item><el-form-item label="Study hours"><el-input-number v-model="courseForm.workloadHours" :min="1" /></el-form-item><el-form-item label="Level"><el-input-number v-model="courseForm.level" :min="100" :max="900" :step="100" /></el-form-item></div><el-form-item label="Description"><el-input v-model="courseForm.description" type="textarea" :rows="3" /></el-form-item><div class="form-row"><el-form-item label="Offered semesters"><el-select v-model="courseForm.offeredSemesters" multiple style="width:100%"><el-option label="Semester 1" value="SEMESTER_1" /><el-option label="Semester 2" value="SEMESTER_2" /><el-option label="Summer" value="SUMMER" /></el-select></el-form-item><el-form-item label="Assessment types"><el-select v-model="courseForm.assessmentTypes" multiple style="width:100%"><el-option v-for="item in ['EXAM','ASSIGNMENT','QUIZ','PROJECT','LAB','PRESENTATION']" :key="item" :label="item" :value="item" /></el-select></el-form-item></div><el-form-item label="Prerequisites (IDs or exact course codes, comma-separated)"><el-input v-model="prerequisiteIdsInput" placeholder="e.g. 159.101, COMP102" /></el-form-item><el-form-item label="Official course URL"><el-input v-model="courseForm.officialLink" type="url" /></el-form-item><el-form-item v-if="editingId" label="Catalogue status"><el-switch v-model="courseForm.isActive" active-text="Active" inactive-text="Inactive" /></el-form-item></el-form><template #footer><el-button @click="dialogVisible = false">Cancel</el-button><el-button type="primary" :loading="saving" @click="save">{{ editingId ? 'Save changes' : 'Create course' }}</el-button></template></el-dialog>
  </section>
</template>

<style scoped>
.admin-page{max-width:1080px;margin:0 auto}.page-heading{display:flex;align-items:end;justify-content:space-between;gap:20px}.eyebrow,.moderation-kicker{color:var(--accent);font:700 11px/1.4 var(--mono);letter-spacing:.14em}.page-heading h1{margin:6px 0}.muted{color:var(--text);font-size:14px;line-height:1.6}.admin-grid{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:20px;margin-top:28px}.catalogue-card{min-width:0}.card-header{display:flex;align-items:center;justify-content:space-between;gap:20px}.card-header .el-input{max-width:280px}.moderation-card{height:max-content;border-top:4px solid var(--accent)}.moderation-card .el-button{margin-top:22px}.moderation-kicker{display:block;margin-bottom:10px}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}.form-row.thirds{grid-template-columns:repeat(3,1fr)}.form-row :deep(.el-input-number){width:100%}@media(max-width:800px){.admin-grid{grid-template-columns:1fr}.page-heading{align-items:start;flex-direction:column}}@media(max-width:560px){.form-row,.form-row.thirds{grid-template-columns:1fr}.card-header{align-items:start;flex-direction:column}.card-header .el-input{max-width:none}}
</style>
