import { useEffect, useState, type FormEvent } from 'react'
import { CalendarDays, X } from 'lucide-react'
import type { Priority, Task, TaskDraft } from '../types/task'

type TaskDialogProps = {
  task?: Task | null
  onClose: () => void
  onSave: (draft: TaskDraft) => Promise<void>
}

export function TaskDialog({ task, onClose, onSave }: TaskDialogProps) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium')
  const [dueDate, setDueDate] = useState(task?.due_date ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isSaving, onClose])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedTitle = title.trim()
    if (!normalizedTitle) {
      setError('Give your task a title to continue.')
      return
    }

    setIsSaving(true)
    setError('')
    try {
      await onSave({
        title: normalizedTitle,
        description: description.trim(),
        priority,
        due_date: dueDate || null,
      })
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your task could not be saved. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !isSaving && onClose()}>
      <section className="task-dialog" role="dialog" aria-modal="true" aria-labelledby="task-dialog-title">
        <header className="dialog-header">
          <div><p className="eyebrow">TASK DETAILS</p><h2 id="task-dialog-title">{task ? 'Edit task' : 'Create a task'}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} disabled={isSaving} aria-label="Close task dialog"><X size={19} /></button>
        </header>
        <form className="task-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="task-title">Task name<span className="required-mark">*</span>
            <span className="input-wrap"><input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder="What needs to get done?" required autoFocus /></span>
          </label>
          <label className="field-label" htmlFor="task-description">Description <span className="optional-text">(optional)</span>
            <span className="input-wrap"><textarea id="task-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} rows={3} placeholder="Add a few details to keep the context close…" /></span>
          </label>
          <div className="task-form-grid">
            <label className="field-label" htmlFor="task-priority">Priority
              <span className="input-wrap select-wrap"><select id="task-priority" value={priority} onChange={(event) => setPriority(event.target.value as Priority)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></span>
            </label>
            <label className="field-label" htmlFor="task-due-date">Due date <span className="optional-text">(optional)</span>
              <span className="input-wrap date-wrap"><input id="task-due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /><CalendarDays size={17} aria-hidden="true" /></span>
            </label>
          </div>
          {error && <p className="form-message error-message" role="alert">{error}</p>}
          <div className="dialog-actions"><button className="secondary-button" type="button" onClick={onClose} disabled={isSaving}>Cancel</button><button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : task ? 'Save changes' : 'Create task'}</button></div>
        </form>
      </section>
    </div>
  )
}
