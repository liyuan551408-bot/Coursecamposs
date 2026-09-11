<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteAllNotifications, deleteNotification, getNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notifications'
import { useNotificationStore } from '../stores/notifications'

const notifications = ref([])
const loading = ref(true)
const notificationStore = useNotificationStore()

async function load() {
  loading.value = true
  try { const result = await getNotifications(); notifications.value = result.items || []; notificationStore.unreadCount = result.unreadCount || 0 } catch (error) { ElMessage.error(error.response?.data?.message || 'Unable to load notifications') } finally { loading.value = false }
}

async function markRead(item) {
  if (item.readAt) return
  try {
    await markNotificationRead(item.id)
    item.readAt = new Date().toISOString()
    notificationStore.unreadCount = Math.max(0, notificationStore.unreadCount - 1)
  } catch (error) {
    ElMessage.error(error.response?.data?.message || 'Unable to mark notification as read')
  }
}

async function markAllRead() {
  try {
    await markAllNotificationsRead()
    notifications.value.forEach((item) => { item.readAt = item.readAt || new Date().toISOString() })
    notificationStore.unreadCount = 0
    ElMessage.success('All notifications marked as read')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || 'Unable to update notifications')
  }
}

async function removeNotification(item) {
  try {
    await ElMessageBox.confirm('Delete this notification? This action cannot be undone.', 'Confirm deletion', { type: 'warning', confirmButtonText: 'Delete', cancelButtonText: 'Cancel' })
    await deleteNotification(item.id)
    notifications.value = notifications.value.filter((entry) => entry.id !== item.id)
    if (!item.readAt) notificationStore.unreadCount = Math.max(0, notificationStore.unreadCount - 1)
    ElMessage.success('Notification deleted')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || 'Unable to delete notification')
  }
}

async function removeAllNotifications() {
  try {
    await ElMessageBox.confirm('Delete all notifications? This action cannot be undone.', 'Confirm deletion', { type: 'warning', confirmButtonText: 'Delete all', cancelButtonText: 'Cancel' })
    await deleteAllNotifications()
    notifications.value = []
    notificationStore.unreadCount = 0
    ElMessage.success('All notifications deleted')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || 'Unable to delete notifications')
  }
}

onMounted(load)
</script>

<template>
  <section class="notifications-page">
    <div class="page-heading"><div><p class="eyebrow">ACCOUNT UPDATES</p><h1>Notifications</h1><p>Stay informed about reviews, reports, and saved course changes.</p></div><div class="page-actions"><el-button v-if="notifications.some((item) => !item.readAt)" @click="markAllRead">Mark all as read</el-button><el-button v-if="notifications.length" type="danger" plain @click="removeAllNotifications">Delete all</el-button></div></div>
    <div v-loading="loading" class="notification-list">
      <el-empty v-if="!loading && !notifications.length" description="No notifications yet" />
      <article v-for="item in notifications" :key="item.id" class="notification" :class="{ unread: !item.readAt }" @click="markRead(item)">
        <div class="notification-icon">{{ item.type?.startsWith('REVIEW') ? '✦' : item.type?.startsWith('PLAN') ? '↗' : '◌' }}</div>
        <div class="notification-content"><div class="notification-heading"><h3>{{ item.title }}</h3><el-tag v-if="!item.readAt" type="primary" size="small">New</el-tag></div><p>{{ item.message }}</p><time>{{ new Date(item.createdAt).toLocaleString() }}</time></div>
        <el-button class="delete-button" link type="danger" aria-label="Delete notification" @click.stop="removeNotification(item)">Delete</el-button>
        <span v-if="!item.readAt" class="unread-dot" aria-label="Unread notification" />
      </article>
    </div>
  </section>
</template>

<style scoped>
.notifications-page { max-width: 900px; margin: 0 auto; }
.page-heading { display:flex; justify-content:space-between; align-items:flex-end; gap:20px; margin-bottom:24px; }
.page-actions { display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end; }
.eyebrow { color:var(--accent); font-size:12px; font-weight:700; letter-spacing:.12em; }
h1 { margin:6px 0; }
.notification-list { display:grid; gap:14px; min-height:120px; }
.notification { display:grid; grid-template-columns:42px minmax(0, 1fr) auto auto; align-items:start; gap:14px; padding:20px 22px; border:1px solid var(--line); border-radius:16px; background:var(--surface, #fff); box-shadow:0 8px 24px rgba(50,37,79,.05); cursor:pointer; transition:transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
.notification:hover { transform:translateY(-2px); box-shadow:0 12px 28px rgba(50,37,79,.1); border-color:var(--accent); }
.notification.unread { border-color:rgba(114,81,232,.42); background:linear-gradient(110deg, rgba(114,81,232,.09), #fff 62%); }
.notification-icon { width:42px; height:42px; display:grid; place-items:center; border-radius:13px; color:var(--accent); background:var(--accent-bg); font-size:21px; font-weight:700; }
.notification-content { min-width:0; }
.notification-heading { display:flex; align-items:center; gap:10px; }
.notification h3 { margin:0 0 7px; }
.notification p { margin:0 0 8px; color:var(--text); }
time { color:var(--muted); font-size:12px; }
.unread-dot { width:9px; height:9px; margin-top:8px; border-radius:50%; background:var(--accent); box-shadow:0 0 0 4px rgba(114,81,232,.12); }
.delete-button { align-self:center; opacity:.72; }
.delete-button:hover { opacity:1; }
@media (max-width:600px) { .notification { grid-template-columns:34px minmax(0, 1fr) auto; padding:16px; } .notification-icon { width:34px; height:34px; font-size:17px; } .unread-dot { display:none; } }
</style>
