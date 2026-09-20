import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getModerationQueueCounts } from '../api/reviews'

export const useModerationStore = defineStore('moderation', () => {
  const pendingReviews = ref(0)
  const pendingReports = ref(0)
  const pendingCount = computed(() => pendingReviews.value + pendingReports.value)
  let refreshSequence = 0

  function setCounts(reviews = 0, reports = 0) {
    pendingReviews.value = Math.max(0, Number(reviews) || 0)
    pendingReports.value = Math.max(0, Number(reports) || 0)
  }

  async function refresh() {
    const sequence = ++refreshSequence
    const result = await getModerationQueueCounts()
    if (sequence === refreshSequence) setCounts(result.reviews, result.reports)
    return result
  }

  function reset() {
    refreshSequence += 1
    setCounts()
  }

  return { pendingReviews, pendingReports, pendingCount, setCounts, refresh, reset }
})
