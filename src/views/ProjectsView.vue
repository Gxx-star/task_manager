<template>
  <div class="projects-container">
    <header class="projects-header">
      <h1>我的项目</h1>
      <button @click="showCreateForm = true" class="create-btn">
        + 新建项目
      </button>
    </header>

    <!-- 创建项目表单 -->
    <div v-if="showCreateForm" class="create-form">
      <form @submit.prevent="handleCreateProject">
        <input v-model="newProject.name" type="text" placeholder="项目名称" required class="project-input" />
        <textarea v-model="newProject.description" placeholder="项目描述（可选）" class="project-textarea"></textarea>

        <div class="form-group">
          <label>项目颜色</label>
          <div class="color-picker">
            <div v-for="color in colorOptions" :key="color" class="color-option"
              :class="{ active: newProject.color === color }" :style="{ backgroundColor: color }"
              @click="newProject.color = color"></div>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" :disabled="!newProject.name.trim()" class="save-btn">
            保存
          </button>
          <button type="button" @click="cancelCreate" class="cancel-btn">
            取消
          </button>
        </div>
      </form>
    </div>

    <!-- 项目列表 -->
    <div class="projects-list">
      <div v-if="projectsStore.loading" class="loading">
        加载中...
      </div>

      <div v-else-if="projectsStore.projects.length === 0" class="empty-state">
        <p>还没有项目，创建第一个项目吧！</p>
      </div>

      <div v-else class="projects-grid">
        <div v-for="project in projectsStore.projects" :key="project.id" class="project-card">
          <div class="project-header" :style="{ backgroundColor: project.color }">
            <h3 class="project-name">{{ project.name }}</h3>
            <div class="project-actions">
              <button @click="editProject(project)" class="edit-btn">
                ✏️
              </button>
              <button @click="deleteProject(project.id)" class="delete-btn">
                🗑️
              </button>
            </div>
          </div>
          <div class="project-body">
            <p v-if="project.description" class="project-description">
              {{ project.description }}
            </p>
            <div class="project-meta">
              <span class="project-date">
                创建于 {{ formatDate(project.created_at) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑项目模态框 -->
    <div v-if="editingProject" class="modal-overlay" @click="cancelEdit">
      <div class="modal-content" @click.stop>
        <h2>编辑项目</h2>
        <form @submit.prevent="handleUpdateProject">
          <input v-model="editForm.name" type="text" placeholder="项目名称" required class="project-input" />
          <textarea v-model="editForm.description" placeholder="项目描述（可选）" class="project-textarea"></textarea>

          <div class="form-group">
            <label>项目颜色</label>
            <div class="color-picker">
              <div v-for="color in colorOptions" :key="color" class="color-option"
                :class="{ active: editForm.color === color }" :style="{ backgroundColor: color }"
                @click="editForm.color = color"></div>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="save-btn">保存</button>
            <button type="button" @click="cancelEdit" class="cancel-btn">取消</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import type { Project } from '@/lib/supabase'

const projectsStore = useProjectsStore()

const showCreateForm = ref(false)
const editingProject = ref<Project | null>(null)

const colorOptions = [
  '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
  '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
]

const newProject = reactive({
  name: '',
  description: '',
  color: '#3498db'
})

const editForm = reactive({
  name: '',
  description: '',
  color: '#3498db'
})

onMounted(() => {
  projectsStore.fetchProjects()
})

const handleCreateProject = async () => {
  try {
    await projectsStore.createProject(newProject.name, newProject.description, newProject.color)
    resetNewProjectForm()
    showCreateForm.value = false
  } catch (error) {
    console.error('创建项目失败:', error)
  }
}

const resetNewProjectForm = () => {
  newProject.name = ''
  newProject.description = ''
  newProject.color = '#3498db'
}

const cancelCreate = () => {
  resetNewProjectForm()
  showCreateForm.value = false
}

const editProject = (project: Project) => {
  editingProject.value = project
  editForm.name = project.name
  editForm.description = project.description || ''
  editForm.color = project.color
}

const handleUpdateProject = async () => {
  if (!editingProject.value) return

  try {
    await projectsStore.updateProject(editingProject.value.id, {
      name: editForm.name,
      description: editForm.description,
      color: editForm.color
    })
    cancelEdit()
  } catch (error) {
    console.error('更新项目失败:', error)
  }
}

const cancelEdit = () => {
  editingProject.value = null
  editForm.name = ''
  editForm.description = ''
  editForm.color = '#3498db'
}

const deleteProject = async (id: string) => {
  if (confirm('确定要删除这个项目吗？删除后该项目下的任务将变为无项目状态。')) {
    try {
      await projectsStore.deleteProject(id)
    } catch (error) {
      console.error('删除项目失败:', error)
    }
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.projects-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.projects-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.projects-header h1 {
  color: #333;
  margin: 0;
}

.create-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s;
}

.create-btn:hover {
  background: #45a049;
}

.create-form {
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.project-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.project-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 1rem;
  font-size: 1rem;
  min-height: 80px;
  resize: vertical;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #555;
  font-weight: 500;
}

.color-picker {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.color-option {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.3s;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: #333;
  transform: scale(1.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
}

.save-btn {
  background: #2196F3;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
}

.save-btn:hover {
  background: #1976D2;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  background: #f44336;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #d32f2f;
}

.loading,
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.project-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.project-card:hover {
  transform: translateY(-2px);
}

.project-header {
  padding: 1rem;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-name {
  margin: 0;
  font-size: 1.2rem;
}

.project-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn,
.delete-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}

.edit-btn:hover,
.delete-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.project-body {
  padding: 1rem;
}

.project-description {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

.project-date {
  font-size: 0.8rem;
  color: #999;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #333;
}
</style>
