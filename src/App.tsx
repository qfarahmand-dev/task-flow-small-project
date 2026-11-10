'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, ListChecks } from 'lucide-react'
import { AuthScreen } from './components/AuthScreen'
import { Dashboard } from './components/Dashboard'
import { clearTokens, getCurrentUser, restoreTokens, signOut, verifyEmail, type AuthUser } from './lib/api'

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [resetCredentials, setResetCredentials] = useState<{ uid: string; token: string } | null>(null)
  const [startupError, setStartupError] = useState('')
  const [authNotice, setAuthNotice] = useState('')
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const verifyUid = params.get('verify_uid')
    const verifyToken = params.get('verify_token')
    if (verifyUid && verifyToken) {
      clearTokens()
      const url = new URL(window.location.href)
      url.searchParams.delete('verify_uid')
      url.searchParams.delete('verify_token')
      window.history.replaceState({}, '', url)
      void verifyEmail(verifyUid, verifyToken)
        .then((result) => setAuthSuccess(result.detail))
        .catch((cause: unknown) => setAuthError(cause instanceof Error ? cause.message : 'Could not verify your email.'))
        .finally(() => setIsLoading(false))
      return
    }

    const uid = params.get('reset_uid')
    const token = params.get('reset_token')
    if (uid && token) {
      clearTokens()
      setResetCredentials({ uid, token })
      setIsLoading(false)
      return
    }

    let active = true
    if (!restoreTokens()) {
      setIsLoading(false)
      return
    }

    void getCurrentUser().then((currentUser) => {
      if (active) setUser(currentUser)
    }).catch((cause: unknown) => {
      if (active) {
        clearTokens()
        if (!(cause instanceof Error) || !('status' in cause && cause.status === 401)) {
          setStartupError(cause instanceof Error ? cause.message : 'Could not connect to the API.')
        }
      }
    }).finally(() => {
      if (active) setIsLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  const completePasswordRecovery = () => {
    setResetCredentials(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('reset_uid')
    url.searchParams.delete('reset_token')
    window.history.replaceState({}, '', url)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (cause) {
      setAuthNotice(cause instanceof Error
        ? `You were signed out on this device, but the server could not revoke the session: ${cause.message}`
        : 'You were signed out on this device, but the server could not revoke the session.')
    } finally {
      setUser(null)
    }
  }

  if (isLoading) {
    return <main className={`loading-page ${darkMode ? 'theme-dark' : 'theme-light'}`} aria-label="Loading TaskFlow"><span className="loading-mark"><ListChecks size={22} /></span><span className="loading-track"><i /></span></main>
  }

  if (startupError && !user) {
    return (
      <main className="config-page">
        <section className="config-card">
          <span className="brand-mark"><ListChecks size={20} /></span>
          <p className="eyebrow">TASKFLOW CONNECTION</p>
          <h1>Could not reach the workspace</h1>
          <p>Check that the Django API is running and that NEXT_PUBLIC_API_URL points to its /api address.</p>
          <div className="form-message error-message" role="alert"><AlertCircle size={16} /> {startupError}</div>
          <button className="primary-button" type="button" onClick={() => window.location.reload()}>Try again</button>
        </section>
      </main>
    )
  }

  if (!user) {
    return <AuthScreen
      darkMode={darkMode}
      onToggleTheme={() => setDarkMode((current) => !current)}
      initialView={resetCredentials ? 'update-password' : 'signin'}
      initialError={authError || authNotice}
      initialMessage={authSuccess}
      resetCredentials={resetCredentials}
      onAuthenticated={(authenticatedUser) => {
        setAuthNotice('')
        setUser(authenticatedUser)
      }}
      onRecoveryComplete={completePasswordRecovery}
    />
  }

  return <Dashboard user={user} darkMode={darkMode} onToggleTheme={() => setDarkMode((current) => !current)} onSignOut={handleSignOut} />
}
