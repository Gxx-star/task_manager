import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase, type Task } from '@/lib/supabase'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const loading = ref(false)

  // 获取任务列表
  const fetchTasks = async () => {
    loading.value = true
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录')

      const { data, error } = await supabase
        .from('tasks')
        .select(
          `
          *,
          project:projects(*)
        `,
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      tasks.value = data || []
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      loading.value = false
    }
  }

  // 创建任务
  const createTask = async (
    title: string,
    description?: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    projectId?: string,
    dueDate?: string,
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录')

      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title,
            description,
            completed: false,
            priority,
            due_date: dueDate,
            project_id: projectId,
            user_id: user.id,
          },
        ])
        .select(
          `
          *,
          project:projects(*)
        `,
        )
        .single()

      if (error) throw error
      tasks.value.unshift(data)
      return data
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  }

  // 更新任务
  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const index = tasks.value.findIndex((task) => task.id === id)
      if (index !== -1) {
        tasks.value[index] = data
      }
      return data
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  }

  // 删除任务
  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id)

      if (error) throw error

      tasks.value = tasks.value.filter((task) => task.id !== id)
    } catch (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  }

  // 切换任务完成状态
  const toggleTask = async (id: string) => {
    const task = tasks.value.find((t) => t.id === id)
    if (task) {
      await updateTask(id, { completed: !task.completed })
    }
  }

  return {
    tasks,
    loading,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
  }
})
