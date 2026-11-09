'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AlertCircle, ListChecks } from 'lucide-react'
import { AuthScreen } from './components/AuthScreen'
import { Dashboard } from './components/Dashboard'
import { supabase } from './lib/supabase'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRecovery, setIsRecovery] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    let active = true
    const recoveryInUrl = window.location.hash.includes('type=recovery')
    if (recoveryInUrl) setIsRecovery(true)

    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session)
        setIsLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true)
      if (event === 'SIGNED_OUT') setIsRecovery(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  if (!supabase) {
    return (
      <main className="config-page">
        <section className="config-card">
          <span className="brand-mark"><ListChecks size={20} /></span>
          <p className="eyebrow">TASKFLOW SETUP</p>
          <h1>Connect your workspace</h1>
          <p>TaskFlow needs the Supabase environment variables before you can sign in.</p>
          <div className="config-code"><code>VITE_SUPABASE_URL</code><code>VITE_SUPABASE_PUBLISHABLE_KEY</code></div>
          <div className="form-message error-message"><AlertCircle size={16} /> No data is stored locally or loaded from sample records.</div>
        </section>
      </main>
    )
  }

  const client = supabase

  if (isLoading) {
    return <main className={`loading-page ${darkMode ? 'theme-dark' : 'theme-light'}`} aria-label="Loading TaskFlow"><span className="loading-mark"><ListChecks size={22} /></span><span className="loading-track"><i /></span></main>
  }

  if (!session || isRecovery) {
    return <AuthScreen client={client} darkMode={darkMode} onToggleTheme={() => setDarkMode((current) => !current)} initialView={isRecovery ? 'update-password' : 'signin'} onRecoveryComplete={() => setIsRecovery(false)} />
  }

  return <Dashboard client={client} user={session.user} darkMode={darkMode} onToggleTheme={() => setDarkMode((current) => !current)} onSignOut={() => client.auth.signOut()} />
}
