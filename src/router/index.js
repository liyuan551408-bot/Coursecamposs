import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import CourseList from '../views/CourseList.vue'
import CourseDetail from '../views/CourseDetail.vue'
import CompareCourses from '../views/CompareCourses.vue'
import Planner from '../views/Planner.vue'
import SavedCourses from '../views/SavedCourses.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import Profile from '../views/Profile.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/login', name: 'Login', component: Login },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard },
  { path: '/courses', name: 'CourseList', component: CourseList },
  { path: '/courses/:id', name: 'CourseDetail', component: CourseDetail }, // :id 是动态参数,后面查课程详情用
  { path: '/compare', name: 'CompareCourses', component: CompareCourses },
  { path: '/planner', name: 'Planner', component: Planner },
  { path: '/saved', name: 'SavedCourses', component: SavedCourses },
  { path: '/admin', name: 'AdminDashboard', component: AdminDashboard },
  { path: '/profile', name: 'Profile', component: Profile },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router