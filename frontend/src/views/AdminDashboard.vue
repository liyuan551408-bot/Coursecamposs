<!-- @file Provides administrator course creation, editing, and moderation links. -->
<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createCourse, getAdminCourses, updateCourse } from '../api/courses'
import {
  getAdminStats,
  getAdminUsers,
  changeUserRole,
} from '../api/admin'
import {
  getSubjects,
  createSubject,
  updateSubject,
} from '../api/subjects'

const router = useRouter()
const courses = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editingId = ref(null)
const query = ref('')
const prerequisiteIdsInput = ref('')
const stats = ref(null)
const users = ref([])
const userTotal = ref(0)
const userPage = ref(1)
const usersLoading = ref(false)
const changingRoleId = ref(null)
const subjects = ref([])
const subjectCode = ref('')
const subjectName = ref('')
const editingSubjectId = ref(null)
const subjectSaving = ref(false)
const emptyForm = () => ({ name: '', code: '', credits: 15, description: '', workloadHours: 120, level: null, offeredSemesters: [], assessmentTypes: [], officialLink: '', subjectId: null, isActive: true })
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
  Object.assign(courseForm, { name: course.name, code: course.code, credits: course.credits, description: course.description || '', workloadHours: course.workloadHours, level: course.level, offeredSemesters: [...(course.offeredSemesters || [])], assessmentTypes: [...(course.assessmentTypes || [])], officialLink: course.officialLink || '', subjectId: course.subjectId ?? null, isActive: course.isActive })
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
async function loadStats() {
  try {
    stats.value = await getAdminStats()
  } catch (err) {
    ElMessage.error(
      err.response?.data?.message ||
      'Unable to load admin statistics.',
    )
  }
}

async function loadUsers() {
  usersLoading.value = true

  try {
    const result = await getAdminUsers(userPage.value, 20)
    users.value = result.items
    userTotal.value = result.total
  } catch (err) {
    ElMessage.error(
      err.response?.data?.message ||
      'Unable to load users.',
    )
  } finally {
    usersLoading.value = false
  }
}

async function handleRoleChange(user, newRole) {
  if (newRole === user.role) return

  changingRoleId.value = user.id

  try {
    await changeUserRole(user.id, newRole)
    ElMessage.success('User role updated.')
    await loadUsers()
  } catch (err) {
    ElMessage.error(
      err.response?.data?.message ||
      'Unable to update user role.',
    )
  } finally {
    changingRoleId.value = null
  }
}

function changeUserPage(page) {
  userPage.value = page
  loadUsers()
}

async function loadSubjects() {
  try {
    subjects.value = await getSubjects()
  } catch (err) {
    ElMessage.error(
      err.response?.data?.message ||
      'Unable to load subjects.',
    )
  }
}

function startSubjectEdit(subject) {
  editingSubjectId.value = subject.id
  subjectCode.value = subject.code
  subjectName.value = subject.name
}

function resetSubjectForm() {
  editingSubjectId.value = null
  subjectCode.value = ''
  subjectName.value = ''
}

async function saveSubject() {
  const code = subjectCode.value.trim().toUpperCase()
  const name = subjectName.value.trim()

  if (!name || (!editingSubjectId.value && !code)) {
    ElMessage.warning('Enter a code and name.')
    return
  }

  subjectSaving.value = true

  try {
    if (editingSubjectId.value) {
      await updateSubject(editingSubjectId.value, name)
    } else {
      await createSubject({ code, name })
    }

    ElMessage.success('Subject saved.')
    resetSubjectForm()
    await loadSubjects()
  } catch (err) {
    ElMessage.error(
      err.response?.data?.message ||
      'Unable to save subject.',
    )
  } finally {
    subjectSaving.value = false
  }
}

onMounted(() => {
  loadCourses()
  loadStats()
  loadUsers()
  loadSubjects()
})
</script>

<template>
  <section class="admin-page">
    <div class="page-heading"><div><p class="eyebrow">ADMIN CONSOLE</p><h1>Course management</h1><p class="muted">Create courses, edit catalogue data and control publication workflows.</p></div><el-button type="primary" @click="openCreate">+ Create course</el-button></div>
    <div v-if="stats" class="stats-grid">
      <el-card><strong>Users</strong><h2>{{ stats.users }}</h2></el-card>
      <el-card><strong>Courses</strong><h2>{{ stats.courses }}</h2></el-card>
      <el-card><strong>Active courses</strong><h2>{{ stats.activeCourses }}</h2></el-card>
      <el-card><strong>Reviews</strong><h2>{{ stats.reviews }}</h2></el-card>
      <el-card><strong>Pending reviews</strong><h2>{{ stats.pendingReviews }}</h2></el-card>
      <el-card><strong>Plans</strong><h2>{{ stats.plans }}</h2></el-card>
      <el-card><strong>Reports</strong><h2>{{ stats.reports }}</h2></el-card>
      <el-card><strong>Pending reports</strong><h2>{{ stats.pendingReports }}</h2></el-card>
    </div>
    <div class="admin-grid">
      <el-card class="catalogue-card"><template #header><div class="card-header"><strong>Course catalogue</strong><el-input v-model="query" clearable placeholder="Search code or name" /></div></template>
        <el-table v-loading="loading" :data="filteredCourses" max-height="620"><el-table-column prop="code" label="Code" width="120" /><el-table-column prop="name" label="Course" min-width="220" /><el-table-column label="Subject" min-width="150"><template #default="{ row }">{{ row.subject?.name || 'Unassigned' }}</template></el-table-column><el-table-column prop="level" label="Level" width="80" /><el-table-column prop="credits" label="Credits" width="85" /><el-table-column label="Status" width="90"><template #default="{ row }"><el-tag :type="row.isActive ? 'success' : 'info'">{{ row.isActive ? 'Active' : 'Inactive' }}</el-tag></template></el-table-column><el-table-column label="" width="85" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openEdit(row)">Edit</el-button></template></el-table-column></el-table>
      </el-card>
      <el-card class="moderation-card"><span class="moderation-kicker">PUBLICATION CONTROL</span><h2>Review moderation</h2><p class="muted">Approve new reviews and resolve reports about published feedback.</p><el-button type="primary" plain @click="router.push('/moderation')">Open moderation queue</el-button></el-card>
    </div>
    <el-card class="subjects-card">
      <template #header>
        <strong>Subject management</strong>
      </template>

      <div class="subject-form">
        <el-input
          v-model="subjectCode"
          placeholder="Code, e.g. COMP"
          :disabled="editingSubjectId !== null"
        />

        <el-input
          v-model="subjectName"
          placeholder="Name, e.g. Computer Science"
        />

        <el-button
          type="primary"
          :loading="subjectSaving"
          @click="saveSubject"
        >
          {{ editingSubjectId ? 'Save name' : 'Add subject' }}
        </el-button>

        <el-button
          v-if="editingSubjectId"
          @click="resetSubjectForm"
        >
          Cancel
        </el-button>
      </div>

      <el-table :data="subjects">
        <el-table-column prop="code" label="Code" width="120" />
        <el-table-column prop="name" label="Name" />
        <el-table-column label="Courses" width="100">
          <template #default="{ row }">
            {{ row._count?.courses ?? 0 }}
          </template>
        </el-table-column>
        <el-table-column label="Action" width="100">
          <template #default="{ row }">
            <el-button link type="primary" @click="startSubjectEdit(row)">
              Edit
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-card class="users-card">
      <template #header>
        <strong>User management</strong>
      </template>

      <el-table
        v-loading="usersLoading"
        :data="users"
        max-height="520"
      >
        <el-table-column prop="id" label="ID" width="75" />
        <el-table-column prop="name" label="Name" min-width="150" />
        <el-table-column prop="email" label="Email" min-width="220" />
        <el-table-column prop="major" label="Programme" min-width="150" />

        <el-table-column label="Role" width="165">
          <template #default="{ row }">
            <el-select
              :model-value="row.role"
              :disabled="changingRoleId === row.id"
              @change="role => handleRoleChange(row, role)"
            >
              <el-option label="Student" value="STUDENT" />
              <el-option label="Moderator" value="MODERATOR" />
              <el-option label="Admin" value="ADMIN" />
            </el-select>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="userTotal > 20"
        :current-page="userPage"
        :page-size="20"
        :total="userTotal"
        layout="prev, pager, next"
        @current-change="changeUserPage"
      />
    </el-card>
    <el-dialog v-model="dialogVisible" :title="editingId ? 'Edit course' : 'Create course'" width="min(720px, 94vw)" :close-on-click-modal="false"><el-form label-position="top"><div class="form-row"><el-form-item label="Course name"><el-input v-model="courseForm.name" /></el-form-item><el-form-item label="Course code"><el-input v-model="courseForm.code" placeholder="e.g. COMP101" /></el-form-item></div><el-form-item label="Subject"><el-select v-model="courseForm.subjectId" clearable placeholder="Select a subject" style="width:100%"><el-option v-for="subject in subjects" :key="subject.id" :label="`${subject.code} — ${subject.name}`" :value="subject.id" /></el-select></el-form-item><div class="form-row thirds"><el-form-item label="Credits"><el-input-number v-model="courseForm.credits" :min="1" /></el-form-item><el-form-item label="Study hours"><el-input-number v-model="courseForm.workloadHours" :min="1" /></el-form-item><el-form-item label="Level"><el-input-number v-model="courseForm.level" :min="100" :max="900" :step="100" /></el-form-item></div><el-form-item label="Description"><el-input v-model="courseForm.description" type="textarea" :rows="3" /></el-form-item><div class="form-row"><el-form-item label="Offered semesters"><el-select v-model="courseForm.offeredSemesters" multiple style="width:100%"><el-option label="Semester 1" value="SEMESTER_1" /><el-option label="Semester 2" value="SEMESTER_2" /><el-option label="Summer" value="SUMMER" /></el-select></el-form-item><el-form-item label="Assessment types"><el-select v-model="courseForm.assessmentTypes" multiple style="width:100%"><el-option v-for="item in ['EXAM','ASSIGNMENT','QUIZ','PROJECT','LAB','PRESENTATION']" :key="item" :label="item" :value="item" /></el-select></el-form-item></div><el-form-item label="Prerequisites (IDs or exact course codes, comma-separated)"><el-input v-model="prerequisiteIdsInput" placeholder="e.g. 159.101, COMP102" /></el-form-item><el-form-item label="Official course URL"><el-input v-model="courseForm.officialLink" type="url" /></el-form-item><el-form-item v-if="editingId" label="Catalogue status"><el-switch v-model="courseForm.isActive" active-text="Active" inactive-text="Inactive" /></el-form-item></el-form><template #footer><el-button @click="dialogVisible = false">Cancel</el-button><el-button type="primary" :loading="saving" @click="save">{{ editingId ? 'Save changes' : 'Create course' }}</el-button></template></el-dialog>
  </section>
</template>

<style scoped>
.admin-page{max-width:1080px;margin:0 auto}.page-heading{display:flex;align-items:end;justify-content:space-between;gap:20px}.eyebrow,.moderation-kicker{color:var(--accent);font:700 11px/1.4 var(--mono);letter-spacing:.14em}.page-heading h1{margin:6px 0}.muted{color:var(--text);font-size:14px;line-height:1.6}.admin-grid{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:20px;margin-top:28px}.catalogue-card{min-width:0}.card-header{display:flex;align-items:center;justify-content:space-between;gap:20px}.card-header .el-input{max-width:280px}.moderation-card{height:max-content;border-top:4px solid var(--accent)}.moderation-card .el-button{margin-top:22px}.moderation-kicker{display:block;margin-bottom:10px}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}.form-row.thirds{grid-template-columns:repeat(3,1fr)}.form-row :deep(.el-input-number){width:100%}@media(max-width:800px){.admin-grid{grid-template-columns:1fr}.page-heading{align-items:start;flex-direction:column}}@media(max-width:560px){.form-row,.form-row.thirds{grid-template-columns:1fr}.card-header{align-items:start;flex-direction:column}.card-header .el-input{max-width:none}}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 24px;
}

.stats-grid h2 {
  margin: 8px 0 0;
}

.users-card {
  margin-top: 24px;
}

.users-card :deep(.el-pagination) {
  justify-content: flex-end;
  margin-top: 16px;
}

.subjects-card {
  margin-top: 24px;
}

.subject-form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;
}

.subject-form .el-input {
  width: 220px;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
