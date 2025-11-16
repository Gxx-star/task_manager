<template>
  <nav class="app-nav" v-if="authStore.isAuthenticated">
    <div class="nav-container">
      <div class="nav-brand">
        <h2>任务管理</h2>
      </div>

      <div class="nav-links">
        <router-link to="/tasks" class="nav-link" active-class="active">
          <span>📝</span>
          任务列表
        </router-link>
        <router-link to="/projects" class="nav-link" active-class="active">
          <span>📁</span>
          项目管理
        </router-link>
        <router-link to="/profile" class="nav-link" active-class="active">
          <span>👤</span>
          个人资料
        </router-link>
      </div>

      <div class="nav-user">
        <span class="user-email">{{ authStore.user?.email }}</span>
        <button @click="handleSignOut" class="signout-btn">
          退出
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const handleSignOut = async () => {
  try {
    await authStore.signOut()
    router.push('/auth')
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}
</script>

<style scoped>
.app-nav {
  background: #2c3e50;
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-brand h2 {
  margin: 0;
  color: white;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: #bdc3c7;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-link:hover {
  background: #34495e;
  color: white;
}

.nav-link.active {
  background: #3498db;
  color: white;
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-email {
  color: #bdc3c7;
  font-size: 0.9rem;
}

.signout-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

.signout-btn:hover {
  background: #c0392b;
}

@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    gap: 1rem;
  }

  .nav-links {
    gap: 1rem;
  }

  .user-email {
    display: none;
  }
}
</style>
