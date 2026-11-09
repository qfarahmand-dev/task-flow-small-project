import { useEffect, useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  ListChecks,
  Moon,
  Sun,
} from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'

type AuthView = 'signin' | 'signup' | 'forgot' | 'update-password'

type AuthScreenProps = {
  client: SupabaseClient
  darkMode: boolean
  onToggleTheme: () => void
  initialView?: AuthView
  onRecoveryComplete: () => void
}

function friendlyAuthError(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes('invalid login credentials') || normalized.includes('user not found')) {
    return 'Email or password is incorrect. Check your details or reset your password.'
  }
  if (normalized.includes('already registered') || normalized.includes('already been registered')) {
    return 'We could not create an account with those details. Try signing in or resetting your password.'
  }
  if (normalized.includes('email not confirmed')) {
    return 'Please confirm your email address before signing in.'
  }
  return message
}

export function AuthScreen({ client, darkMode, onToggleTheme, initialView = 'signin', onRecoveryComplete }: AuthScreenProps) {
  const [view, setView] = useState<AuthView>(initialView)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (initialView === 'update-password') setView('update-password')
  }, [initialView])

  const changeView = (next: AuthView) => {
    setView(next)
    setError('')
    setMessage('')
    setPassword('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    try {
      if (view === 'signup') {
        const { data, error: signUpError } = await client.auth.signUp({
          email: email.trim(),
          password,
        })
        if (signUpError) throw signUpError
        if (!data.session) {
          setMessage('Check your inbox for a confirmation link. Once your email is verified, you can sign in.')
        }
      } else if (view === 'forgot') {
        const { error: resetError } = await client.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        })
        if (resetError) throw resetError
        setMessage('If an account exists for that email, a password reset link is on its way.')
      } else if (view === 'update-password') {
        const { error: updateError } = await client.auth.updateUser({ password: newPassword })
        if (updateError) throw updateError
        setMessage('Your password has been updated. You can continue to your workspace.')
        onRecoveryComplete()
        setPassword('')
        setNewPassword('')
      } else {
        const { error: signInError } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (signInError) throw signInError
      }
    } catch (cause) {
      setError(friendlyAuthError(cause instanceof Error ? cause.message : 'Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const heading = view === 'signup'
    ? 'Create your account'
    : view === 'forgot'
      ? 'Reset your password'
      : view === 'update-password'
        ? 'Choose a new password'
        : 'Welcome back'

  const subheading = view === 'signup'
    ? 'Start bringing your work into focus.'
    : view === 'forgot'
      ? 'We will email you a link to get back in.'
      : view === 'update-password'
        ? 'Use a strong password you have not used before.'
        : 'Sign in to pick up right where you left off.'

  return (
    <main className={`auth-page ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      <div className="auth-topbar">
        <a className="brand-lockup" href="#home" aria-label="TaskFlow home">
          <span className="brand-mark"><ListChecks size={20} strokeWidth={2.4} /></span>
          <span>taskflow</span>
        </a>
        <button className="icon-button theme-toggle" type="button" onClick={onToggleTheme} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="auth-layout">
        <section className="auth-story" aria-label="About TaskFlow">
          <div className="story-badge"><span className="status-dot" /> Your calm, clear workspace</div>
          <h1>Make space for<br /><span>meaningful work.</span></h1>
          <p>Plan with purpose, find your focus, and make steady progress on what matters most.</p>
          <div className="story-preview" aria-hidden="true">
            <div className="preview-topline"><span className="preview-dot" /><span className="preview-dot" /><span className="preview-dot" /><span className="preview-label">TODAY&apos;S FOCUS</span></div>
            <div className="preview-item"><span className="preview-check checked"><Check size={13} /></span><span className="preview-task done">Review project brief</span><span className="preview-tag">DONE</span></div>
            <div className="preview-item"><span className="preview-check" /><span className="preview-task">Plan this week&apos;s priorities</span><span className="preview-priority">HIGH</span></div>
            <div className="preview-item"><span className="preview-check" /><span className="preview-task">Share updates with the team</span><span className="preview-date">TODAY</span></div>
            <div className="preview-progress"><span><i /></span><small>2 of 5 tasks complete</small></div>
          </div>
          <div className="story-footnote"><span className="avatar-stack"><i>A</i><i>M</i><i>J</i></span><span>A little more clarity, every day.</span></div>
        </section>

        <section className="auth-card" aria-labelledby="auth-heading">
          <div className="auth-card-accent" />
          <div className="auth-card-body">
            {view !== 'signin' && view !== 'signup' && (
              <button className="back-link" type="button" onClick={() => changeView('signin')}>
                <ArrowLeft size={16} /> Back to sign in
              </button>
            )}
            <p className="eyebrow">{view === 'signup' ? 'GET STARTED' : view === 'forgot' ? 'ACCOUNT RECOVERY' : view === 'update-password' ? 'SECURE YOUR ACCOUNT' : 'YOUR WORKSPACE'}</p>
            <h2 id="auth-heading">{heading}</h2>
            <p className="auth-subtitle">{subheading}</p>

            {error && <div className="form-message error-message" role="alert">{error}</div>}
            {message && <div className="form-message success-message" role="status">{message}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
              {view !== 'update-password' && (
                <label className="field-label" htmlFor="auth-email">
                  Email address
                  <span className="input-wrap"><input id="auth-email" type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></span>
                </label>
              )}

              {view === 'update-password' ? (
                <label className="field-label" htmlFor="new-password">
                  New password
                  <span className="input-wrap password-input"><input id="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} required /><button type="button" className="password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span>
                </label>
              ) : view !== 'forgot' && (
                <label className="field-label" htmlFor="auth-password">
                  Password
                  <span className="input-wrap password-input"><input id="auth-password" type={showPassword ? 'text' : 'password'} autoComplete={view === 'signup' ? 'new-password' : 'current-password'} placeholder={view === 'signup' ? 'At least 8 characters' : 'Enter your password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={view === 'signup' ? 8 : 1} required /><button type="button" className="password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span>
                </label>
              )}

              {view === 'signin' && <button type="button" className="forgot-link" onClick={() => changeView('forgot')}>Forgot password?</button>}

              <button className="primary-button auth-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Please wait…' : view === 'signup' ? 'Create account' : view === 'forgot' ? 'Send reset link' : view === 'update-password' ? 'Update password' : 'Sign in'}
                {!isSubmitting && <ArrowRight size={17} />}
              </button>
            </form>

            {(view === 'signin' || view === 'signup') && (
              <p className="auth-switch">
                {view === 'signup' ? 'Already have an account?' : 'New to TaskFlow?'}{' '}
                <button type="button" onClick={() => changeView(view === 'signup' ? 'signin' : 'signup')}>{view === 'signup' ? 'Sign in' : 'Create an account'}</button>
              </p>
            )}
            <div className="auth-secure"><span><Check size={13} /></span> Your tasks are private and secure</div>
          </div>
        </section>
      </div>
      <footer className="auth-footer"><span>© {new Date().getFullYear()} TaskFlow</span><span>Thoughtful work starts here.</span></footer>
    </main>
  )
}
