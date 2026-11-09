export type Priority = 'low' | 'medium' | 'high'

export type Task = {
  id: string
  user_id: string
  title: string
  description: string
  priority: Priority
  due_date: string | null
  is_completed: boolean
  created_at: string
  updated_at: string
}

export type TaskDraft = {
  title: string
  description: string
  priority: Priority
  due_date: string | null
}

export type TaskUpdate = Partial<TaskDraft> & {
  is_completed?: boolean
}
