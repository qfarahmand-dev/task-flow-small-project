import { useMemo, useState, type CSSProperties } from 'react'
import {
  AlertCircle,
  ArrowDownWideNarrow,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCheck,
  CircleHelp,
  Clock3,
  Command,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Moon,
  Plus,
  Search,
  Sun,
  Target,
  TriangleAlert,
} from 'lucide-react'
import type { AuthUser } from '../lib/api'
import { useTasks } from '../hooks/useTasks'
import type { Task, TaskDraft } from '../types/task'
import { TaskDialog } from './TaskDialog'
import { TaskRow } from './TaskRow'

type Filter = 'all' | 'pending' | 'completed'
type SidebarView = 'overview' | 'today' | 'completed'

type DashboardProps = {
  user: AuthUser
  darkMode: boolean
  onToggleTheme: () => void
  onSignOut: () => Promise<unknown>
}

function getToday() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function StatCard({ title, value, note, tone, icon: Icon }: {
  title: string
  value: number
  note: string
  tone: 'blue' | 'green' | 'amber' | 'rose'
  icon: typeof ListChecks
}) {
  return (
    <article className="stat-card">
      <div className="stat-heading"><span>{title}</span><span className={`stat-icon ${tone}`}><Icon size={16} /></span></div>
      <strong className="stat-value">{value}</strong>
      <p className="stat-footnote">{note}</p>
    </article>
  )
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(date)
}

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value))
}

export function Dashboard({ user, darkMode, onToggleTheme, onSignOut }: DashboardProps) {
  const { tasks, isLoading, error, loadTasks, createTask, updateTask, deleteTask } = useTasks(user.id)
  const [filter, setFilter] = useState<Filter>('all')
  const [sidebarView, setSidebarView] = useState<SidebarView>('overview')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [actionError, setActionError] = useState('')
  const [isSigningOut, setIsSigningOut] = useState(false)

  const completedCount = tasks.filter((task) => task.is_completed).length
  const pendingCount = tasks.length - completedCount
  const highPriorityCount = tasks.filter((task) => task.priority === 'high' && !task.is_completed).length
  const completionRate = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0

  const visibleTasks = useMemo(() => {
    const term = search.trim().toLowerCase()
    return tasks.filter((task) => {
      const matchesStatus = filter === 'all' || (filter === 'completed' ? task.is_completed : !task.is_completed)
      const matchesToday = sidebarView !== 'today' || task.due_date === getToday()
      const matchesSearch = !term || `${task.title} ${task.description}`.toLowerCase().includes(term)
      return matchesStatus && matchesToday && matchesSearch
    })
  }, [tasks, filter, sidebarView, search])

  const recentTasks = tasks.slice(0, 4)
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = user.email?.split('@')[0]?.split(/[._-]/)[0]
  const pageTitle = sidebarView === 'today' ? 'Today' : sidebarView === 'completed' ? 'Completed tasks' : 'Your overview'
  const pageSubtitle = sidebarView === 'today' ? 'A focused look at what is due today.' : 'A little progress each day adds up.'

  const openNewTask = () => {
    setEditingTask(null)
    setActionError('')
    setDialogOpen(true)
  }

  const openEditTask = (task: Task) => {
    setEditingTask(task)
    setActionError('')
    setDialogOpen(true)
  }

  const saveTask = async (draft: TaskDraft) => {
    setActionError('')
    if (editingTask) await updateTask(editingTask.id, draft)
    else await createTask(draft)
  }

  const toggleTask = async (task: Task) => {
    setActionError('')
    try {
      await updateTask(task.id, { is_completed: !task.is_completed })
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'The task could not be updated.')
    }
  }

  const removeTask = async (task: Task) => {
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return
    setActionError('')
    try {
      await deleteTask(task.id)
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'The task could not be deleted.')
    }
  }

  const selectSidebarView = (view: SidebarView) => {
    setSidebarView(view)
    if (view === 'completed') setFilter('completed')
    else setFilter('all')
    setSearch('')
  }

  const selectFilter = (nextFilter: Filter) => {
    setFilter(nextFilter)
    setSidebarView('overview')
  }

  const signOut = async () => {
    setIsSigningOut(true)
    try {
      await onSignOut()
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Could not sign out cleanly.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <main className={`app-shell ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-brand"><a className="brand-lockup" href="#overview" aria-label="TaskFlow overview"><span className="brand-mark"><ListChecks size={19} strokeWidth={2.4} /></span><span>taskflow</span></a></div>
          <p className="sidebar-section-label">WORKSPACE</p>
          <nav className="sidebar-nav" aria-label="Main navigation">
            <button className={`nav-item ${sidebarView === 'overview' ? 'active' : ''}`} type="button" onClick={() => selectSidebarView('overview')}><LayoutDashboard size={17} /> Overview</button>
            <button className={`nav-item ${sidebarView === 'today' ? 'active' : ''}`} type="button" onClick={() => selectSidebarView('today')}><CalendarDays size={17} /> Today <span className="nav-count">{tasks.filter((task) => task.due_date === getToday() && !task.is_completed).length}</span></button>
            <button className={`nav-item ${sidebarView === 'completed' ? 'active' : ''}`} type="button" onClick={() => selectSidebarView('completed')}><CheckCheck size={17} /> Completed <span className="nav-count">{completedCount}</span></button>
          </nav>
          <div className="sidebar-spacer" />
          <div className="sidebar-note"><span className="sidebar-note-icon"><Target size={16} /></span><strong>Keep your focus</strong><p>One small step at a time is still progress.</p></div>
          <div className="sidebar-footer">
            <span className="user-avatar" aria-hidden="true">{user.email?.charAt(0).toUpperCase() ?? 'T'}</span>
            <span className="user-meta"><strong>{user.email?.split('@')[0] ?? 'Your account'}</strong><small>{user.email}</small></span>
            <button className="icon-button" type="button" onClick={() => void signOut()} disabled={isSigningOut} aria-label="Sign out"><LogOut size={16} /></button>
          </div>
        </aside>

        <section className="dashboard-main">
          <header className="topbar">
            <span className="topbar-date">{formatDate(new Date())}</span>
            <button className="icon-button topbar-icon" type="button" onClick={onToggleTheme} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>{darkMode ? <Sun size={17} /> : <Moon size={17} />}</button>
            <button className="icon-button topbar-icon" type="button" aria-label="TaskFlow help" title="Your tasks are protected by Supabase Row Level Security"><CircleHelp size={17} /></button>
          </header>

          <div className="dashboard-content">
            <div className="dashboard-heading">
              <div><p className="eyebrow">{pageTitle.toUpperCase()}</p><h1>{greeting}{firstName ? `, ${firstName}` : ''}.</h1><p>{pageSubtitle}</p></div>
              <div className="heading-actions"><button className="primary-button" type="button" onClick={openNewTask}><Plus size={16} /> New task</button></div>
            </div>

            {(error || actionError) && <div className="error-banner" role="alert"><AlertCircle size={16} /><span>{actionError || error}</span>{error && !actionError && <button type="button" onClick={() => void loadTasks()}>Retry</button>}</div>}

            <section className="stat-grid" aria-label="Task statistics">
              <StatCard title="Total tasks" value={tasks.length} note="In your personal workspace" tone="blue" icon={ListChecks} />
              <StatCard title="Completed" value={completedCount} note={tasks.length ? `${completionRate}% of your tasks` : 'Ready when you are'} tone="green" icon={CheckCheck} />
              <StatCard title="Pending" value={pendingCount} note="Still on your list" tone="amber" icon={Clock3} />
              <StatCard title="High priority" value={highPriorityCount} note="Open, high-impact tasks" tone="rose" icon={TriangleAlert} />
            </section>

            <div className="dashboard-columns">
              <section className="panel task-panel" aria-labelledby="tasks-heading">
                <div className="panel-header"><div><h2 id="tasks-heading">{sidebarView === 'today' ? 'Due today' : sidebarView === 'completed' ? 'Completed tasks' : 'Your tasks'}</h2><p>{visibleTasks.length} {visibleTasks.length === 1 ? 'task' : 'tasks'} in this view</p></div><button className="icon-button" type="button" onClick={() => selectFilter('all')} aria-label="Show all tasks" title="Show all tasks"><ArrowDownWideNarrow size={17} /></button></div>
                <div className="task-toolbar">
                  <div className="filter-list" role="group" aria-label="Filter tasks">
                    {(['all', 'pending', 'completed'] as const).map((item) => <button className={`filter-tab ${filter === item ? 'selected' : ''}`} type="button" key={item} aria-pressed={filter === item} onClick={() => selectFilter(item)}>{item === 'all' ? 'All' : item === 'pending' ? 'Pending' : 'Completed'}</button>)}
                  </div>
                  <label className="search-box"><Search size={15} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks…" aria-label="Search tasks" /></label>
                </div>
                <div className="task-list">
                  {isLoading ? (
                    [0, 1, 2, 3].map((item) => <div className="task-skeleton" key={item} aria-hidden="true"><span className="skeleton-dot" /><span className="skeleton-lines"><i /><i /></span></div>)
                  ) : visibleTasks.length ? (
                    visibleTasks.map((task) => <TaskRow key={task.id} task={task} onToggle={(item) => void toggleTask(item)} onEdit={openEditTask} onDelete={(item) => void removeTask(item)} />)
                  ) : (
                    <div className="empty-state"><span className="empty-state-icon">{search ? <Search size={19} /> : <Check size={19} />}</span><strong>{search ? 'No matching tasks' : tasks.length ? 'Nothing on this list' : 'A fresh start'}</strong><p>{search ? 'Try another search term or clear your search.' : tasks.length ? 'There are no tasks in this view. Try a different filter or add a task.' : 'Add your first task and make room for what matters.'}</p>{!search && <button className="primary-button" type="button" onClick={openNewTask}><Plus size={14} /> Create a task</button>}</div>
                  )}
                </div>
              </section>

              <aside className="side-column" aria-label="Task insights">
                <section className="panel progress-panel" aria-labelledby="progress-heading">
                  <div className="panel-header"><div><h2 id="progress-heading">Your progress</h2><p>Small wins add up</p></div><span className="stat-icon"><Target size={16} /></span></div>
                  <div className="progress-content"><div className="progress-ring" style={{ '--progress': `${completionRate * 3.6}deg` } as CSSProperties} role="img" aria-label={`${completionRate}% of tasks completed`}><div className="progress-ring-inner">{completionRate}%</div></div><div className="progress-copy"><strong>{completedCount} of {tasks.length} done</strong><p>{tasks.length ? 'You are moving at your own pace.' : 'Your progress will show here as you add tasks.'}</p></div></div>
                  <div className="progress-track" aria-hidden="true"><i style={{ width: `${completionRate}%` }} /></div>
                </section>

                <section className="panel" aria-labelledby="recent-heading">
                  <div className="panel-header"><div><h2 id="recent-heading">Recent tasks</h2><p>Your latest updates</p></div><button className="icon-button" type="button" onClick={() => selectSidebarView('overview')} aria-label="View all tasks"><ArrowRight size={16} /></button></div>
                  <div className="recent-list">
                    {recentTasks.length ? recentTasks.map((task) => <div className="recent-item" key={task.id}><span className="recent-mark">{task.is_completed ? <Check size={13} /> : <ListChecks size={13} />}</span><span className="recent-copy"><strong>{task.title}</strong><small>Added {formatCreatedAt(task.created_at)}</small></span><i className={`recent-status ${task.is_completed ? 'done' : ''}`} aria-label={task.is_completed ? 'Completed' : 'Pending'} /></div>) : <div className="empty-state"><span className="empty-state-icon"><Command size={18} /></span><strong>No activity yet</strong><p>Your newest tasks will appear here.</p></div>}
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </section>
      </div>

      {dialogOpen && <TaskDialog task={editingTask} onClose={() => setDialogOpen(false)} onSave={saveTask} />}
    </main>
  )
}
