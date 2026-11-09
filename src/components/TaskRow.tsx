import { useState } from 'react'
import { CalendarDays, Check, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { Task } from '../types/task'

type TaskRowProps = {
  task: Task
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

function dueLabel(date: string | null) {
  if (!date) return null
  const parsed = new Date(`${date}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const formatted = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(parsed)
  if (parsed.getTime() === today.getTime()) return { text: 'Today', overdue: false }
  if (parsed.getTime() === tomorrow.getTime()) return { text: 'Tomorrow', overdue: false }
  return { text: formatted, overdue: parsed < today }
}

export function TaskRow({ task, onToggle, onEdit, onDelete }: TaskRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const due = dueLabel(task.due_date)

  return (
    <article className={`task-row ${task.is_completed ? 'task-row-complete' : ''}`}>
      <button className={`task-check ${task.is_completed ? 'is-checked' : ''}`} type="button" role="checkbox" aria-checked={task.is_completed} aria-label={`${task.is_completed ? 'Mark as pending' : 'Mark as completed'}: ${task.title}`} onClick={() => onToggle(task)}>
        {task.is_completed && <Check size={14} strokeWidth={2.8} />}
      </button>
      <div className="task-row-content">
        <div className="task-row-main"><h3>{task.title}</h3>{task.description && <p>{task.description}</p>}</div>
        <div className="task-row-meta">
          <span className={`priority-badge priority-${task.priority}`}><i />{task.priority}</span>
          {due && <span className={`due-label ${due.overdue && !task.is_completed ? 'due-overdue' : ''}`}><CalendarDays size={14} />{due.text}</span>}
        </div>
      </div>
      <div className="task-actions">
        <button className="icon-button task-edit" type="button" onClick={() => onEdit(task)} aria-label={`Edit ${task.title}`}><Pencil size={16} /></button>
        <div className="task-menu-wrap">
          <button className="icon-button" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={`More options for ${task.title}`} aria-expanded={menuOpen}><MoreHorizontal size={19} /></button>
          {menuOpen && <div className="task-menu"><button type="button" onClick={() => { setMenuOpen(false); onEdit(task) }}><Pencil size={14} /> Edit task</button><button className="danger-action" type="button" onClick={() => { setMenuOpen(false); onDelete(task) }}><Trash2 size={14} /> Delete task</button></div>}
        </div>
      </div>
    </article>
  )
}
