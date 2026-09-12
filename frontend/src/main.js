/** @file Creates the Vue application and installs Pinia, routing, and Element Plus. */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import {
  ElAlert, ElButton, ElCard, ElCheckbox, ElDatePicker, ElDialog, ElEmpty,
  ElForm, ElFormItem, ElInput, ElInputNumber, ElLoading, ElMessage, ElOption,
  ElRadio, ElRadioGroup, ElRate, ElResult, ElSelect, ElSwitch, ElTable,
  ElTableColumn, ElTag,
} from 'element-plus'
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
for (const component of [
  ElAlert, ElButton, ElCard, ElCheckbox, ElDatePicker, ElDialog, ElEmpty,
  ElForm, ElFormItem, ElInput, ElInputNumber, ElOption, ElRadio, ElRadioGroup,
  ElRate, ElResult, ElSelect, ElSwitch, ElTable, ElTableColumn, ElTag,
]) {
  app.component(component.name, component)
}
app.use(ElLoading)

// Restore the saved session after a page refresh.
const authStore = useAuthStore()
authStore.restoreSession()

app.mount('#app')
