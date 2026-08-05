<script setup>
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div>
    <h1>Dashboard</h1>
    <p v-if="authStore.isLoggedIn">
      欢迎，{{ authStore.userName }}！你已经成功登录。
    </p>
    <p v-else>请先登录。</p>
  </div>
</template>
