<script setup>
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div>
    <h1>Dashboard</h1>
    <p v-if="authStore.isLoggedIn">
      Welcome, {{ authStore.userName }}! You have successfully logged in.
    </p>
    <p v-else>Please log in first.</p>
  </div>
</template>
