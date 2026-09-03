<script setup>
/**
 * 首页
 */
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import heroImg from '../assets/hero.png'

const router = useRouter()
const authStore = useAuthStore()

const features = [
  {
    title: '智能课程搜索',
    desc: '按专业、学期、难度快速筛选课程，找到最适合你的那一门。',
  },
  {
    title: '多维度对比',
    desc: ' side-by-side 对比课程内容、评分、工作量，决策不再纠结。',
  },
  {
    title: 'AI 智能推荐',
    desc: '基于你的兴趣和成绩，AI 为你量身推荐课程组合。',
  },
]

const stats = [
  { number: '500+', label: '门课程数据' },
  { number: '10k+', label: '学生评价' },
  { number: '98%', label: '规划满意度' },
]

function handleGetStarted() {
  if (authStore.isLoggedIn) {
    router.push('/dashboard')
  } else {
    router.push('/register')
  }
}
</script>

<template>
  <div class="home-page">
    <!-- ===== Hero 区域 ===== -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          找到<span class="highlight">最适合你</span>的课程
        </h1>
        <p class="hero-subtitle">
          CourseCompass 帮你探索、对比、规划你的大学课程。
          不再靠猜，用数据做出更好的选课决策。
        </p>
        <div class="hero-actions">
          <el-button type="primary" size="large" @click="handleGetStarted">
            免费开始使用
          </el-button>
          <el-button size="large" @click="$router.push('/courses')">
            浏览课程
          </el-button>
        </div>
        <div class="hero-stats">
          <div v-for="stat in stats" :key="stat.label" class="stat-item">
            <div class="stat-number">{{ stat.number }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="hero-image-wrapper">
          <img :src="heroImg" alt="CourseCompass" class="hero-image" />
        </div>
      </div>
    </section>

    <!-- ===== 功能特性 ===== -->
    <section class="features-section">
      <div class="section-header">
        <h2>为什么选择 CourseCompass</h2>
        <p>一站式课程规划工具，让你的选课不再迷茫</p>
      </div>
      <div class="features-grid">
        <el-card
          v-for="feature in features"
          :key="feature.title"
          class="feature-card"
          shadow="hover"
        >
          <div class="feature-icon">{{ feature.icon }}</div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.desc }}</p>
        </el-card>
      </div>
    </section>

    <!-- ===== CTA 区域 ===== -->
    <section class="cta-section">
      <el-card class="cta-card" shadow="hover">
        <div class="cta-content">
          <h2>准备好开始了吗？</h2>
          <p>创建免费账号，立刻开始规划你的课程之旅</p>
          <el-button type="primary" size="large" @click="handleGetStarted">
            {{ authStore.isLoggedIn ? '进入控制台' : '立即注册' }}
          </el-button>
        </div>
      </el-card>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  width: 100%;
}

/* ===== Hero ===== */
.hero-section {
  display: flex;
  align-items: center;
  gap: 48px;
  padding: 64px 0;
  min-height: 500px;
}

.hero-content {
  flex: 1;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 20px;
  color: var(--text-h);
}

.highlight {
  color: var(--accent);
}

.hero-subtitle {
  font-size: 18px;
  line-height: 1.6;
  color: var(--text);
  margin-bottom: 32px;
  max-width: 480px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 48px;
}

.hero-stats {
  display: flex;
  gap: 40px;
}

.stat-item {
  text-align: left;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-h);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--text);
}

.hero-visual {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-image-wrapper {
  position: relative;
  width: 320px;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-image {
  width: 100%;
  height: auto;
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* ===== Features ===== */
.features-section {
  padding: 80px 0;
}

.section-header {
  text-align: center;
  margin-bottom: 48px;
}

.section-header h2 {
  font-size: 36px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--text-h);
}

.section-header p {
  font-size: 16px;
  color: var(--text);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.feature-card {
  text-align: left;
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
}

.feature-icon {
  font-size: 40px;
  margin-bottom: 16px;
}

.feature-card h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px;
  color: var(--text-h);
}

.feature-card p {
  font-size: 15px;
  color: var(--text);
  line-height: 1.6;
  margin: 0;
}

/* ===== CTA ===== */
.cta-section {
  padding: 40px 0 80px;
}

.cta-card {
  background: linear-gradient(135deg, var(--accent-bg) 0%, transparent 100%);
  border: 1px solid var(--accent-border);
}

.cta-content {
  text-align: center;
  padding: 32px;
}

.cta-content h2 {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px;
  color: var(--text-h);
}

.cta-content p {
  font-size: 16px;
  color: var(--text);
  margin-bottom: 24px;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .hero-section {
    flex-direction: column;
    text-align: center;
    padding: 40px 0;
  }

  .hero-title {
    font-size: 32px;
  }

  .hero-subtitle {
    margin: 0 auto 24px;
  }

  .hero-actions {
    justify-content: center;
  }

  .hero-stats {
    justify-content: center;
    gap: 24px;
  }

  .hero-visual {
    order: -1;
  }

  .hero-image-wrapper {
    width: 200px;
    height: 200px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .section-header h2 {
    font-size: 28px;
  }
}
</style>
