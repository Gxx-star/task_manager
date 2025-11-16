<template>
  <div class="tasks-container">
    <header class="tasks-header">
      <h1>我的任务</h1>
      <button @click="showCreateForm = true" class="create-btn">
        + 新建任务
      </button>
    </header>

    <!-- 创建任务表单 -->
    <div v-if="showCreateForm" class="create-form">
      <form @submit.prevent="handleCreateTask">
        <input v-model="newTask.title" type="text" placeholder="任务标题" required class="task-input" />
        <textarea v-model="newTask.description" placeholder="任务描述（可选）" class="task-textarea"></textarea>

        <div class="form-row">
          <div class="form-group">
            <label>优先级</label>
            <select v-model="newTask.priority" class="task-select">
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>

          <div class="form-group">
            <label>项目</label>
            <select v-model="newTask.projectId" class="task-select">
              <option value="">无项目</option>
              <option v-for="project in projectsStore.projects" :key="project.id" :value="project.id">
                {{ project.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>截止日期</label>
            <input v-model="newTask.dueDate" type="date" class="task-input" />
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" :disabled="!newTask.title.trim()" class="save-btn">
            保存
          </button>
          <button type="button" @click="cancelCreate" class="cancel-btn">
            取消
          </button>
        </div>
      </form>
    </div>

    <!-- 任务列表 -->
    <div class="tasks-list">
      <div v-if="tasksStore.loading" class="loading">
        加载中...
      </div>

      <div v-else-if="tasksStore.tasks.length === 0" class="empty-state">
        <p>还没有任务，创建第一个任务吧！</p>
      </div>

      <div v-else>
        <div v-for="task in tasksStore.tasks" :key="task.id" class="task-item" :class="{ completed: task.completed }">
          <div class="task-content">
            <input type="checkbox" :checked="task.completed" @change="tasksStore.toggleTask(task.id)"
              class="task-checkbox" />
            <div class="task-info">
              <div class="task-header">
                <h3 class="task-title">{{ task.title }}</h3>
                <div class="task-badges">
                  <span class="priority-badge" :style="{ backgroundColor: getPriorityColor(task.priority) }">
                    {{ getPriorityText(task.priority) }}
                  </span>
                  <span v-if="task.project" class="project-badge" :style="{ backgroundColor: task.project.color }">
                    {{ task.project.name }}
                  </span>
                </div>
              </div>
              <p v-if="task.description" class="task-description">
                {{ task.description }}
              </p>
              <div class="task-meta">
                <span class="task-date">
                  创建: {{ formatDate(task.created_at) }}
                </span>
                <span v-if="task.due_date" class="task-due-date" :class="{ overdue: isOverdue(task.due_date) }">
                  截止: {{ formatDate(task.due_date) }}
                </span>
              </div>
            </div>
          </div>
          <div class="task-actions">
            <button @click="editTask(task)" class="edit-btn">
              编辑
            </button>
            <button @click="deleteTask(task.id)" class="delete-btn">
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑任务模态框 -->
    <div v-if="editingTask" class="modal-overlay" @click="cancelEdit">
      <div class="modal-content" @click.stop>
        <h2>编辑任务</h2>
        <form @submit.prevent="handleUpdateTask">
          <input v-model="editForm.title" type="text" placeholder="任务标题" required class="task-input" />
          <textarea v-model="editForm.description" placeholder="任务描述（可选）" class="task-textarea"></textarea>

          <div class="form-row">
            <div class="form-group">
              <label>优先级</label>
              <select v-model="editForm.priority" class="task-select">
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>

            <div class="form-group">
              <label>项目</label>
              <select v-model="editForm.projectId" class="task-select">
                <option value="">无项目</option>
                <option v-for="project in projectsStore.projects" :key="project.id" :value="project.id">
                  {{ project.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>截止日期</label>
              <input v-model="editForm.dueDate" type="date" class="task-input" />
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
import { useTasksStore } from '@/stores/tasks'
import { useProjectsStore } from '@/stores/projects'
import type { Task } from '@/lib/supabase'

const tasksStore = useTasksStore()
const projectsStore = useProjectsStore()

const showCreateForm = ref(false)
const editingTask = ref<Task | null>(null)

const newTask = reactive({
  title: '',
  description: '',
  priority: 'medium' as 'low' | 'medium' | 'high',
  projectId: '',
  dueDate: ''
})

const editForm = reactive({
  title: '',
  description: '',
  priority: 'medium' as 'low' | 'medium' | 'high',
  projectId: '',
  dueDate: ''
})

onMounted(() => {
  tasksStore.fetchTasks()
  projectsStore.fetchProjects()
})

const handleCreateTask = async () => {
  try {
    await tasksStore.createTask(
      newTask.title,
      newTask.description,
      newTask.priority,
      newTask.projectId || undefined,
      newTask.dueDate || undefined
    )
    resetNewTaskForm()
    showCreateForm.value = false
  } catch (error) {
    console.error('创建任务失败:', error)
  }
}

const resetNewTaskForm = () => {
  newTask.title = ''
  newTask.description = ''
  newTask.priority = 'medium'
  newTask.projectId = ''
  newTask.dueDate = ''
}

const cancelCreate = () => {
  resetNewTaskForm()
  showCreateForm.value = false
}

const editTask = (task: Task) => {
  editingTask.value = task
  editForm.title = task.title
  editForm.description = task.description || ''
  editForm.priority = task.priority
  editForm.projectId = task.project_id || ''
  editForm.dueDate = task.due_date ? task.due_date.split('T')[0] : ''
}

const handleUpdateTask = async () => {
  if (!editingTask.value) return

  try {
    await tasksStore.updateTask(editingTask.value.id, {
      title: editForm.title,
      description: editForm.description,
      priority: editForm.priority,
      project_id: editForm.projectId || null,
      due_date: editForm.dueDate || null
    })
    cancelEdit()
  } catch (error) {
    console.error('更新任务失败:', error)
  }
}

const cancelEdit = () => {
  editingTask.value = null
  editForm.title = ''
  editForm.description = ''
  editForm.priority = 'medium'
  editForm.projectId = ''
  editForm.dueDate = ''
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return '#f44336'
    case 'medium': return '#ff9800'
    case 'low': return '#4caf50'
    default: return '#999'
  }
}

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'high': return '高'
    case 'medium': return '中'
    case 'low': return '低'
    default: return '中'
  }
}

const deleteTask = async (id: string) => {
  if (confirm('确定要删除这个任务吗？')) {
    try {
      await tasksStore.deleteTask(id)
    } catch (error) {
      console.error('删除任务失败:', error)
    }
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const isOverdue = (dueDate: string) => {
  return new Date(dueDate) < new Date()
}
</script>

<style scoped>
.tasks-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.tasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.tasks-header h1 {
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

.task-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.task-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 1rem;
  font-size: 1rem;
  min-height: 80px;
  resize: vertical;
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

.task-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: all 0.3s;
}

.task-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.task-item.completed {
  opacity: 0.7;
  background: #f5f5f5;
}

.task-content {
  display: flex;
  align-items: flex-start;
  flex: 1;
}

.task-checkbox {
  margin-right: 1rem;
  margin-top: 0.25rem;
}

.task-info {
  flex: 1;
}

.task-title {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
}

.task-item.completed .task-title {
  text-decoration: line-through;
  color: #888;
}

.task-description {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
  color: #555;
  font-weight: 500;
}

.task-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.9rem;
  background: white;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.task-badges {
  display: flex;
  gap: 0.5rem;
}

.priority-badge,
.project-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  color: white;
  font-weight: 500;
}

.task-meta {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.task-date {
  font-size: 0.8rem;
  color: #999;
}

.task-due-date {
  font-size: 0.8rem;
  color: #666;
}

.task-due-date.overdue {
  color: #f44336;
  font-weight: 500;
}

.task-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn {
  background: #FF9800;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8rem;
}

.edit-btn:hover {
  background: #F57C00;
}

.delete-btn {
  background: #f44336;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8rem;
}

.delete-btn:hover {
  background: #d32f2f;
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
