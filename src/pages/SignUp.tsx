import { useState, useEffect, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { Mail, Lock, User as UserIcon, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react'
import VibeClipLogo from '../components/VibeClipLogo'
import type { AxiosError } from 'axios'
import api from '../api'
import useStore from '../store'
import ThemeToggle from '../components/ThemeToggle'
import type { AuthOut } from '../types/api'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export default function SignUp() {
  const navigate = useNavigate()
  const { setAuth, token } = useStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (token) { navigate('/', { replace: true }); return }
    if (import.meta.env.VITE_APP_ENV === 'development') {
      api.post<AuthOut>('/api/auth/dev-login').then(({ data }) => {
        setAuth(data)
        navigate('/', { replace: true })
      }).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post<AuthOut>('/api/auth/signup', { email, password, name: name || undefined })
      setAuth(data)
      navigate('/', { replace: true })
    } catch (err) {
      const ax = err as AxiosError<{ detail?: string }>
      setError(ax.response?.data?.detail || 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (!tokenResponse.access_token) {
        setError('Google sign up failed — no token received. Please try again.')
        return
      }
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.post<AuthOut>('/api/auth/google', { access_token: tokenResponse.access_token })
        setAuth(data)
        navigate('/', { replace: true })
      } catch (err) {
        const ax = err as AxiosError<{ detail?: string }>
        setError(ax.response?.data?.detail || 'Google sign up failed')
      } finally {
        setLoading(false)
      }
    },
    onError: (err) => {
      if (err.error === 'popup_closed_by_user') return
      if (err.error === 'popup_blocked_by_browser') {
        setError('Google sign-in popup was blocked. Please allow popups for this site and try again.')
      } else {
        setError(err.error_description || err.error || 'Google sign up failed')
      }
    },
  })

  return (
    <div className="min-h-screen flex items-center justify-center px-4 page-enter">
      <div className="fixed top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      <div className="fixed top-1/4 -left-32 w-[400px] h-[400px] rounded-full bg-cyan-500/8 blur-3xl animate-float pointer-events-none" />
      <div className="fixed bottom-1/4 -right-32 w-[350px] h-[350px] rounded-full bg-teal-600/6 blur-3xl animate-float-slow pointer-events-none" />

      <div className="w-full max-w-md relative">
        <div className="flex items-center justify-center gap-3 mb-8">
          <VibeClipLogo size={44} className="rounded-2xl" />
          <span className="text-3xl font-black gradient-text">VibeClip</span>
        </div>

        <div className="glass-card rounded-2xl p-8 border border-forge-border">
          <h1 className="text-2xl font-black text-forge-text mb-1">Create account</h1>
          <p className="text-sm text-forge-muted mb-6">Start turning videos into viral clips.</p>

          <button
            type="button"
            onClick={() => googleLogin()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-full border border-forge-border bg-forge-surface hover:bg-forge-card-hover transition-colors text-sm font-semibold text-forge-text disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer mb-5"
          >
            <GoogleIcon />
            Sign up with Google
          </button>

          <div className="flex items-center gap-3 text-forge-dim text-xs mb-5">
            <div className="flex-1 h-px bg-forge-border" />
            <span className="font-semibold">or with email</span>
            <div className="flex-1 h-px bg-forge-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="flex items-center gap-3 bg-forge-surface rounded-xl px-4 py-3 border border-forge-border focus-within:border-forge-accent/50 transition-colors">
              <UserIcon size={15} className="text-forge-dim shrink-0" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="flex-1 bg-transparent outline-none text-forge-text placeholder-forge-dim text-sm"
              />
            </div>

            <div className="flex items-center gap-3 bg-forge-surface rounded-xl px-4 py-3 border border-forge-border focus-within:border-forge-accent/50 transition-colors">
              <Mail size={15} className="text-forge-dim shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="flex-1 bg-transparent outline-none text-forge-text placeholder-forge-dim text-sm"
              />
            </div>

            <div className="flex items-center gap-3 bg-forge-surface rounded-xl px-4 py-3 border border-forge-border focus-within:border-forge-accent/50 transition-colors">
              <Lock size={15} className="text-forge-dim shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                className="flex-1 bg-transparent outline-none text-forge-text placeholder-forge-dim text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="text-forge-dim hover:text-forge-text transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/22 text-red-400 text-xs">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-forge-muted mt-6">
            Already have an account?{' '}
            <Link to="/signin" className="text-forge-accent hover:text-forge-accent font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
