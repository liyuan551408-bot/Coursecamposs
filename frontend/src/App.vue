<template>
  <div>
    <nav>
      <router-link to="/">首页</router-link> |
      <router-link to="/login">登录</router-link> |
      <router-link to="/courses">课程列表</router-link> |
      <router-link to="/dashboard">仪表盘</router-link> |
      <router-link to="/ai-recommend">AI 智能推荐</router-link>
    </nav>
    <router-view />
  </div>
</template>