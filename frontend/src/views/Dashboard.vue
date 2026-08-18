<script setup>
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div>
    <h1>Dashboard</h1>
    <p v-if="authStore.isLoggedIn">
      Welcome, {{ authStore.userName }}! You are signed in.
    </p>
    <p v-else>Please log in first.</p>
  </div>
</template>
