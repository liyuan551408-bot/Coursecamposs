<script setup>
/**
 * Home page
 */
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import heroImg from '../assets/hero.png'

const router = useRouter()
const authStore = useAuthStore()

const features = [
  {
    icon: '🔍',
    title: 'Smart course search',
    desc: 'Filter by subject, semester and difficulty to find the course that fits you.',
  },
  {
    icon: '⚖️',
    title: 'Side-by-side comparison',
    desc: 'Compare course content, ratings and workload to make clearer decisions.',
  },
  {
    icon: '🤖',
    title: 'AI recommendations',
    desc: 'Get a tailored course shortlist based on your interests and learning goals.',
  },
  {
    icon: '📅',
    title: 'Semester planner',
    desc: 'Plan your degree pathway and see your graduation pace ahead of time.',
  },
]

const stats = [
  { number: '500+', label: 'courses' },
  { number: '10k+', label: 'student reviews' },
  { number: '98%', label: 'planning satisfaction' },
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
    <!-- Hero -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          Find courses that <span class="highlight">fit you best</span>
        </h1>
        <p class="hero-subtitle">
          CourseCompass helps you explore, compare and plan your university courses.
          Make better enrolment decisions with data, not guesswork.
        </p>
        <div class="hero-actions">
          <el-button type="primary" size="large" @click="handleGetStarted">
            Get started free
          </el-button>
          <el-button size="large" @click="$router.push('/courses')">
            Browse courses
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

    <!-- Features -->
    <section class="features-section">
      <div class="section-header">
        <h2>Why CourseCompass</h2>
        <p>Your all-in-one course planning toolkit</p>
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

    <!-- Call to action -->
    <section class="cta-section">
      <el-card class="cta-card" shadow="hover">
        <div class="cta-content">
          <h2>Ready to get started?</h2>
          <p>Create a free account and begin planning your course journey.</p>
          <el-button type="primary" size="large" @click="handleGetStarted">
            {{ authStore.isLoggedIn ? 'Go to dashboard' : 'Create an account' }}
          </el-button>
        </div>
      </el-card>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  width: 100%;
  overflow: hidden;
}

/* ===== Hero ===== */
.hero-section {
  display: flex;
  align-items: center;
  gap: 48px;
  padding: 64px 0;
  min-height: 540px;
  position: relative;
}

.hero-content {
  flex: 1;
}

.hero-title {
  font-size: clamp(42px, 5vw, 64px);
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 20px;
  color: var(--text-h);
}

.highlight {
  color: #7251e8;
  background: linear-gradient(100deg, #7251e8, #c14bdb);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
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
  width: 370px;
  height: 370px;
  border-radius: 38% 62% 58% 42% / 45% 44% 56% 55%;
  background: linear-gradient(135deg, rgba(114,81,232,.18), rgba(94,207,191,.14));
  box-shadow: 0 26px 70px rgba(90, 61, 148, .15);
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
  padding: 90px 0;
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
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 20px;
  border-top: 3px solid rgba(114,81,232,.3);
}

.feature-card:hover {
  transform: translateY(-7px);
  box-shadow: 0 20px 38px rgba(61, 43, 92, .12);
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
  background: linear-gradient(120deg, #6e4ce2 0%, #a84dde 100%);
  border: 0;
  box-shadow: 0 20px 42px rgba(93, 59, 173, .24);
}

.cta-content {
  text-align: center;
  padding: 32px;
}

.cta-content h2 {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px;
  color: white;
}

.cta-content p {
  font-size: 16px;
  color: rgba(255,255,255,.82);
  margin-bottom: 24px;
}

/* Responsive layout */
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
