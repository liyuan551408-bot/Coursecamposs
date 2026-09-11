/** @file Defines application routes and enforces authentication and role metadata. */
import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '../utils/auth'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import ForgotPassword from '../views/ForgotPassword.vue'
import ResetPassword from '../views/ResetPassword.vue'
import Dashboard from '../views/Dashboard.vue'
import CourseList from '../views/CourseList.vue'
import CourseDetail from '../views/CourseDetail.vue'
import CompareCourses from '../views/CompareCourses.vue'
import Planner from '../views/Planner.vue'
import SavedCourses from '../views/SavedCourses.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import ModerationDashboard from '../views/ModerationDashboard.vue'
import Profile from '../views/Profile.vue'
import AiRecommendation from '../views/AiRecommendation.vue'
import Notifications from '../views/Notifications.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/login', name: 'Login', component: Login, meta: { guestOnly: true } },
  { path: '/register', name: 'Register', component: Register, meta: { guestOnly: true } },
  { path: '/forgot-password', name: 'ForgotPassword', component: ForgotPassword, meta: { guestOnly: true } },
  { path: '/reset-password', name: 'ResetPassword', component: ResetPassword, meta: { guestOnly: true } },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
  },
  { path: '/courses', name: 'CourseList', component: CourseList },
  { path: '/courses/:id', name: 'CourseDetail', component: CourseDetail },
  { path: '/compare', name: 'CompareCourses', component: CompareCourses },
  { path: '/ai-recommend', name: 'AiRecommendation', component: AiRecommendation, meta: { requiresAuth: true } },
  { path: '/planner', name: 'Planner', component: Planner, meta: { requiresAuth: true } },
  { path: '/saved', name: 'SavedCourses', component: SavedCourses, meta: { requiresAuth: true } },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/moderation',
    name: 'ModerationDashboard',
    component: ModerationDashboard,
    meta: { requiresAuth: true, roles: ['admin', 'moderator'] },
  },
  { path: '/profile', name: 'Profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/notifications', name: 'Notifications', component: Notifications, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

/**
 * Route guard: validate access before navigation.
 */
router.beforeEach((to, _from, next) => {
  const token = getToken()
  const user = JSON.parse(localStorage.getItem('course_compass_user') || 'null')

  if (to.meta.requiresAuth && !token) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.roles && (!user || !to.meta.roles.includes(user.role?.toLowerCase()))) {
    next({ name: 'Home' })
    return
  }

  if (to.meta.guestOnly && token) {
    next({ name: 'Dashboard' })
    return
  }

  next()
})

export default router
