/**
 * 收藏课程状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const SAVED_KEY = 'course_compass_saved'

function loadSaved() {
  try {
    const raw = localStorage.getItem(SAVED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const useSavedStore = defineStore('saved', () => {
  const savedIds = ref(loadSaved())

  const savedCount = computed(() => savedIds.value.length)

  function isSaved(courseId) {
    return savedIds.value.includes(Number(courseId))
  }

  function toggleSave(courseId) {
    const id = Number(courseId)
    const index = savedIds.value.indexOf(id)
    if (index > -1) {
      savedIds.value.splice(index, 1)
    } else {
      savedIds.value.push(id)
    }
    persist()
  }

  function removeSaved(courseId) {
    const id = Number(courseId)
    savedIds.value = savedIds.value.filter((item) => item !== id)
    persist()
  }

  function clearAll() {
    savedIds.value = []
    persist()
  }

  function persist() {
    localStorage.setItem(SAVED_KEY, JSON.stringify(savedIds.value))
  }

  return {
    savedIds,
    savedCount,
    isSaved,
    toggleSave,
    removeSaved,
    clearAll,
  }
})
