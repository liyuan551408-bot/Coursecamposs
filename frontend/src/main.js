/** @file Creates the Vue application and installs Pinia, routing, and Element Plus. */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus, { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './style.css'

// Successful mutations are reflected inline in the affected view; keep the global UI free of green toast banners.
ElMessage.success = () => undefined

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus)

// Restore the saved session after a page refresh.
const authStore = useAuthStore()
authStore.restoreSession()

app.mount('#app')
