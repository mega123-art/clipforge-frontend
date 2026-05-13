import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { Scissors, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import api from '../api'
import useStore from '../store'
import ThemeToggle from '../components/ThemeToggle'

export default function SignIn() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth, token } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const redirectAfter = location.state?.from?.pathname || '/'

  useEffect(() => {
    if (token) { navigate(redirectAfter, { replace: true }); return }
    if (import.meta.env.VITE_APP_ENV === 'development') {
      api.post('/api/auth/dev-login').then(({ data }) => {
        setAuth(data)
        navigate(redirectAfter, { replace: true })
      }).catch(() => {})
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/api/auth/signin', { email, password })
      setAuth(data)
      navigate(redirectAfter, { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credential) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/api/auth/google', { id_token: credential.credential })
      setAuth(data)
      navigate(redirectAfter, { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Google sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 page-enter">
      <div className="fixed top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      <div className="fixed top-1/4 -left-32 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-3xl animate-float pointer-events-none" />
      <div className="fixed bottom-1/4 -right-32 w-[350px] h-[350px] rounded-full bg-indigo-600/8 blur-3xl animate-float-slow pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-violet-600/20 border border-violet-500/35 flex items-center justify-center shadow-glow-violet-sm">
            <Scissors size={20} className="text-violet-400" />
          </div>
          <span className="text-3xl font-black gradient-text">ClipForge</span>
        </div>

        <div className="glass-card rounded-2xl p-8 border border-forge-border">
          <h1 className="text-2xl font-black text-forge-text mb-1">Welcome back</h1>
          <p className="text-sm text-forge-muted mb-6">Sign in to continue creating viral clips.</p>

          {/* Google */}
          <div className="flex justify-center mb-5">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign in failed')}
              theme={document.documentElement.classList.contains('light') ? 'outline' : 'filled_black'}
              size="large"
              shape="pill"
              text="signin_with"
              width="320"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 text-forge-dim text-xs mb-5">
            <div className="flex-1 h-px bg-forge-border" />
            <span className="font-semibold">or with email</span>
            <div className="flex-1 h-px bg-forge-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="flex items-center gap-3 bg-forge-surface rounded-xl px-4 py-3 border border-forge-border focus-within:border-violet-500/50 transition-colors">
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

            <div className="flex items-center gap-3 bg-forge-surface rounded-xl px-4 py-3 border border-forge-border focus-within:border-violet-500/50 transition-colors">
              <Lock size={15} className="text-forge-dim shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="flex-1 bg-transparent outline-none text-forge-text placeholder-forge-dim text-sm"
              />
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
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-forge-muted mt-6">
            New here?{' '}
            <Link to="/signup" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
