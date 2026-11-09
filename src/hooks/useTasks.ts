import { useCallback } from 'react'
import useSWR from 'swr'
import { createTask as createTaskRequest, deleteTask as deleteTaskRequest, listTasks, updateTask as updateTaskRequest } from '../lib/api'
import type { Task, TaskDraft, TaskUpdate } from '../types/task'

export function useTasks(userId: string | undefined) {
  const key = userId ? ['tasks', userId] as const : null
  const { data, error, isLoading, mutate } = useSWR<Task[], Error>(
    key,
    listTasks,
  )
  const tasks = data ?? []

  const loadTasks = useCallback(async () => {
    await mutate()
  }, [mutate])

  const createTask = useCallback(async (draft: TaskDraft) => {
    if (!userId) throw new Error('Sign in to create tasks.')
    const created = await createTaskRequest(draft)
    await mutate((current) => current ? [created, ...current] : [created], { revalidate: false })
    return created
  }, [userId, mutate])

  const updateTask = useCallback(async (taskId: string, changes: TaskUpdate) => {
    if (!userId) throw new Error('Sign in to update tasks.')
    const updated = await updateTaskRequest(taskId, changes)
    await mutate((current) => (current ?? []).map((task) => task.id === taskId ? updated : task), { revalidate: false })
    return updated
  }, [userId, mutate])

  const deleteTask = useCallback(async (taskId: string) => {
    if (!userId) throw new Error('Sign in to delete tasks.')
    await deleteTaskRequest(taskId)
    await mutate((current) => (current ?? []).filter((task) => task.id !== taskId), { revalidate: false })
  }, [userId, mutate])

  return { tasks, isLoading, error: error?.message ?? null, loadTasks, createTask, updateTask, deleteTask }
}
