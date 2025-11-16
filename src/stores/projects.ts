import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase, type Project } from '@/lib/supabase'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const loading = ref(false)

  // 获取项目列表
  const fetchProjects = async () => {
    loading.value = true
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录')

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      projects.value = data || []
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      loading.value = false
    }
  }

  // 创建项目
  const createProject = async (name: string, description?: string, color?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录')

      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            name,
            description,
            color: color || '#3498db',
            user_id: user.id
          }
        ])
        .select()
        .single()
      
      if (error) throw error
      projects.value.unshift(data)
      return data
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  }

  // 更新项目
  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      const index = projects.value.findIndex(project => project.id === id)
      if (index !== -1) {
        projects.value[index] = data
      }
      return data
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  }

  // 删除项目
  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      projects.value = projects.value.filter(project => project.id !== id)
    } catch (error) {
      console.error('Error deleting project:', error)
      throw error
    }
  }

  return {
    projects,
    loading,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject
  }
})
