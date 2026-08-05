<template>
  <div class="ai-page">
    <AiCourseAssistant />
  </div>
</template>

<script setup>
import AiCourseAssistant from '../components/AiCourseAssistant.vue';
</script>

<style scoped>
.ai-page {
  padding: 20px;
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>