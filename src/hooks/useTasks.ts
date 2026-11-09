import { useCallback } from 'react'
import useSWR from 'swr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Task, TaskDraft, TaskUpdate } from '../types/task'

const TASK_COLUMNS = 'id,user_id,title,description,priority,due_date,is_completed,created_at,updated_at'

function taskErrorMessage(error: { code?: string; message: string }) {
  if (error.code === '42P01' || error.code === 'PGRST205') {
    return 'The tasks table is not available yet. Connect the selected Supabase project and apply the migration in supabase/migrations.'
  }
  return error.message || 'Something went wrong while loading your tasks.'
}

export function useTasks(client: SupabaseClient | null, userId: string | undefined) {
  const key = client && userId ? ['tasks', userId] as const : null
  const { data, error, isLoading, mutate } = useSWR<Task[], Error>(
    key,
    async ([, requestedUserId]) => {
      if (!client) throw new Error('Supabase is not configured.')

      const { data: rows, error: queryError } = await client
        .from('tasks')
        .select(TASK_COLUMNS)
        .eq('user_id', requestedUserId)
        .order('created_at', { ascending: false })

      if (queryError) throw new Error(taskErrorMessage(queryError))
      return (rows ?? []) as Task[]
    },
  )
  const tasks = data ?? []

  const loadTasks = useCallback(async () => {
    await mutate()
  }, [mutate])

  const createTask = useCallback(async (draft: TaskDraft) => {
    if (!client || !userId) throw new Error('Sign in to create tasks.')

    const { data: row, error: insertError } = await client
      .from('tasks')
      .insert({ ...draft, user_id: userId })
      .select(TASK_COLUMNS)
      .single()

    if (insertError) throw new Error(taskErrorMessage(insertError))
    const created = row as Task
    await mutate((current) => current ? [created, ...current] : [created], { revalidate: false })
    return created
  }, [client, userId, mutate])

  const updateTask = useCallback(async (taskId: string, changes: TaskUpdate) => {
    if (!client || !userId) throw new Error('Sign in to update tasks.')

    const { data: row, error: updateError } = await client
      .from('tasks')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .eq('user_id', userId)
      .select(TASK_COLUMNS)
      .single()

    if (updateError) throw new Error(taskErrorMessage(updateError))
    const updated = row as Task
    await mutate((current) => (current ?? []).map((task) => task.id === taskId ? updated : task), { revalidate: false })
    return updated
  }, [client, userId, mutate])

  const deleteTask = useCallback(async (taskId: string) => {
    if (!client || !userId) throw new Error('Sign in to delete tasks.')

    const { error: deleteError } = await client
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId)

    if (deleteError) throw new Error(taskErrorMessage(deleteError))
    await mutate((current) => (current ?? []).filter((task) => task.id !== taskId), { revalidate: false })
  }, [client, userId, mutate])

  return { tasks, isLoading, error: error?.message ?? null, loadTasks, createTask, updateTask, deleteTask }
}
