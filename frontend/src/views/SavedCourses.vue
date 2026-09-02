<script setup>
/**
 * 收藏课程页面
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCourse } from '../api/courses'
import { getCourseReviews } from '../api/reviews'
import { useSavedStore } from '../stores/saved'

const router = useRouter()
const savedStore = useSavedStore()

const loading = ref(false)
const savedCourses = ref([])

const hasCourses = computed(() => savedCourses.value.length > 0)

async function loadSavedCourses() {
  if (savedStore.savedIds.length === 0) {
    savedCourses.value = []
    return
  }

  loading.value = true
  try {
    const results = await Promise.all(
      savedStore.savedIds.map(async (id) => {
        try {
          const [course, reviews] = await Promise.all([
            getCourse(id),
            getCourseReviews(id),
          ])
          const avgRating = reviews.length
            ? (reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length).toFixed(1)
            : '—'
          return { ...course, avgRating, reviewCount: reviews.length }
        } catch {
          return null
        }
      })
    )
    savedCourses.value = results.filter(Boolean)
  } catch (err) {
    ElMessage.error('Failed to load saved courses')
  } finally {
    loading.value = false
  }
}

function handleRemove(courseId, courseName) {
  ElMessageBox.confirm(
    `Remove "${courseName}" from your saved list?`,
    'Remove course',
    {
      confirmButtonText: 'Remove',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }
  )
    .then(() => {
      savedStore.removeSaved(courseId)
      savedCourses.value = savedCourses.value.filter((c) => c.id !== Number(courseId))
      ElMessage.success('Course removed from saved list')
    })
    .catch(() => {
      // user cancelled
    })
}

function handleClearAll() {
  if (!hasCourses.value) return
  ElMessageBox.confirm(
    'Remove all saved courses? This action cannot be undone.',
    'Clear all',
    {
      confirmButtonText: 'Clear all',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }
  )
    .then(() => {
      savedStore.clearAll()
      savedCourses.value = []
      ElMessage.success('All saved courses removed')
    })
    .catch(() => {
      // user cancelled
    })
}

function goToDetail(courseId) {
  router.push(`/courses/${courseId}`)
}

onMounted(loadSavedCourses)
</script>

<template>
  <section class="saved-page">
    <div class="page-header">
      <div>
        <p class="eyebrow">SAVED COURSES</p>
        <h1>Your saved courses</h1>
        <p>Courses you have saved for later comparison and planning.</p>
      </div>
      <div class="header-actions">
        <el-button v-if="hasCourses" plain @click="handleClearAll">Clear all</el-button>
        <el-button type="primary" @click="router.push('/courses')">Browse courses</el-button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div v-if="hasCourses" class="stats-bar">
      <div class="stat-item">
        <span class="stat-number">{{ savedCourses.length }}</span>
        <span class="stat-label">Saved courses</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ savedCourses.reduce((sum, c) => sum + (c.credits || 0), 0) }}</span>
        <span class="stat-label">Total credits</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ savedCourses.reduce((sum, c) => sum + (c.workloadHours || 0), 0) }}</span>
        <span class="stat-label">Total study hours</span>
      </div>
    </div>

    <!-- 课程列表 -->
    <div v-loading="loading" class="course-list">
      <el-card
        v-for="course in savedCourses"
        :key="course.id"
        shadow="hover"
        class="course-card"
        @click="goToDetail(course.id)"
      >
        <div class="card-content">
          <div class="course-main">
            <div class="course-top">
              <span class="course-code">{{ course.code }}</span>
              <span class="course-credits">{{ course.credits }} credits</span>
            </div>
            <h2 class="course-name">{{ course.name }}</h2>
            <p class="course-desc">{{ course.description || 'No description available' }}</p>
            <div class="course-meta">
              <span class="meta-item">
                <el-rate :model-value="Number(course.avgRating) || 0" disabled size="small" />
                <span class="meta-text">{{ course.avgRating }} ({{ course.reviewCount }} reviews)</span>
              </span>
              <span class="meta-item">
                ⏱ {{ course.workloadHours || '—' }} hours
              </span>
            </div>
          </div>
          <div class="card-actions" @click.stop>
            <el-button type="primary" plain size="small" @click="goToDetail(course.id)">
              View details
            </el-button>
            <el-button type="danger" plain size="small" @click="handleRemove(course.id, course.name)">
              Remove
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 空状态 -->
      <el-empty
        v-if="!loading && !hasCourses"
        description="You haven't saved any courses yet"
        class="empty-state"
      >
        <el-button type="primary" @click="router.push('/courses')">Browse courses</el-button>
      </el-empty>
    </div>
  </section>
</template>

<style scoped>
.saved-page {
  max-width: 1000px;
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

.stats-bar {
  display: flex;
  gap: 32px;
  padding: 20px 24px;
  background: var(--accent-bg);
  border-radius: 12px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-h);
}

.stat-label {
  font-size: 13px;
  color: var(--text);
  margin-top: 2px;
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.course-card {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.course-card:hover {
  transform: translateY(-2px);
}

.card-content {
  display: flex;
  justify-content: space-between;
  gap: 24px;
}

.course-main {
  flex: 1;
}

.course-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.course-code {
  color: var(--accent);
  font-weight: 700;
  font-size: 14px;
}

.course-credits {
  color: var(--text);
  font-size: 13px;
}

.course-name {
  margin: 0 0 8px;
  font-size: 20px;
  color: var(--text-h);
}

.course-desc {
  color: var(--text);
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-meta {
  display: flex;
  gap: 24px;
  align-items: center;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text);
}

.meta-text {
  margin-left: 4px;
}

.card-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
  min-width: 120px;
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

  .stats-bar {
    gap: 20px;
    flex-wrap: wrap;
  }

  .card-content {
    flex-direction: column;
  }

  .card-actions {
    flex-direction: row;
    min-width: auto;
  }
}
</style>
