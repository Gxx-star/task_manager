import { createClient } from '@supabase/supabase-js'

// 这些环境变量需要在 .env 文件中配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库类型定义
export interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  created_at: string
  updated_at: string
  user_id: string
  project_id?: string
  project?: Project
}

export interface Project {
  id: string
  name: string
  description?: string
  color: string
  created_at: string
  updated_at: string
  user_id: string
}

export interface Profile {
  id: string
  username: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}
