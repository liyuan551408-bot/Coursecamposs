import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getNotifications } from '../api/notifications'

export const useNotificationStore = defineStore('notifications', () => {
  const unreadCount = ref(0)
  const syncVersion = ref(0)
  let refreshSequence = 0

  async function refresh() {
    const sequence = ++refreshSequence
    const result = await getNotifications(true)
    if (sequence === refreshSequence) {
      unreadCount.value = result.unreadCount || 0
      syncVersion.value += 1
    }
    return result
  }

  function reset() {
    refreshSequence += 1
    unreadCount.value = 0
    syncVersion.value = 0
  }

  return { unreadCount, syncVersion, refresh, reset }
})
