import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Scissors, Mail, CheckCircle2, XCircle, Loader2, ArrowRight, LogOut, RefreshCw } from 'lucide-react'
import type { AxiosError } from 'axios'
import api from '../api'
import useStore from '../store'
import ThemeToggle from '../components/ThemeToggle'
import type { User } from '../types/api'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { user, logout } = useStore()
  
  // Verification states (when token is present)
  const [verifying, setVerifying] = useState(!!token)
  const [success, setSuccess] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  // Resend states
  const [resending, setResending] = useState(false)
  const [resendStatus, setResendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [cooldown, setCooldown] = useState(0)

  // Trigger verification if token is present
  useEffect(() => {
    if (!token) return

    const verifyToken = async () => {
      try {
        const { data } = await api.post<User>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
        // Update user state in Zustand store
        useStore.setState({ user: data })
        setSuccess(true)
        setVerifying(false)
        
        // Redirect to dashboard after 2.5 seconds
        setTimeout(() => {
          navigate('/', { replace: true })
        }, 2500)
      } catch (err) {
        const ax = err as AxiosError<{ detail?: string }>
        setVerifyError(ax.response?.data?.detail || 'Verification failed. The link may have expired or is invalid.')
        setVerifying(false)
      }
    }

    verifyToken()
  }, [token, navigate])

  // Redirect to sign in if no query token and not logged in
  // Redirect to home if user is already verified
  useEffect(() => {
    if (!token) {
      if (!useStore.getState().token) {
        navigate('/signin', { replace: true })
      } else if (user?.is_email_verified) {
        navigate('/', { replace: true })
      }
    }
  }, [token, user, navigate])

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleResend = async () => {
    if (cooldown > 0 || resending) return
    setResending(true)
    setResendStatus(null)
    try {
      await api.post('/api/auth/resend-verification')
      setResendStatus({
        type: 'success',
        message: 'Verification link resent successfully! Check your inbox (and spam folder).'
      })
      setCooldown(60) // 60s cooldown
    } catch (err) {
      const ax = err as AxiosError<{ detail?: string }>
      setResendStatus({
        type: 'error',
        message: ax.response?.data?.detail || 'Failed to resend verification link. Please try again.'
      })
    } finally {
      setResending(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/signin', { replace: true })
  }

  // Render verifying state
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 page-enter">
        <div className="fixed top-5 right-5 z-20">
          <ThemeToggle />
        </div>
        <div className="fixed top-1/4 -left-32 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
        <div className="fixed bottom-1/4 -right-32 w-[350px] h-[350px] rounded-full bg-indigo-600/8 blur-3xl pointer-events-none" />
        
        <div className="w-full max-w-md relative text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-violet-600/20 border border-violet-500/35 flex items-center justify-center shadow-glow-violet-sm">
              <Scissors size={20} className="text-violet-400" />
            </div>
            <span className="text-3xl font-black gradient-text">ClipForge</span>
          </div>

          <div className="glass-card rounded-2xl p-8 border border-forge-border flex flex-col items-center justify-center">
            <Loader2 size={40} className="text-violet-400 animate-spin mb-4" />
            <h1 className="text-xl font-black text-forge-text mb-2">Verifying your email</h1>
            <p className="text-sm text-forge-muted">Please hold on while we confirm your email address...</p>
          </div>
        </div>
      </div>
    )
  }

  // Render verification result if verified via token
  if (token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 page-enter">
        <div className="fixed top-5 right-5 z-20">
          <ThemeToggle />
        </div>
        <div className="fixed top-1/4 -left-32 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
        <div className="fixed bottom-1/4 -right-32 w-[350px] h-[350px] rounded-full bg-indigo-600/8 blur-3xl pointer-events-none" />
        
        <div className="w-full max-w-md relative text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-violet-600/20 border border-violet-500/35 flex items-center justify-center shadow-glow-violet-sm">
              <Scissors size={20} className="text-violet-400" />
            </div>
            <span className="text-3xl font-black gradient-text">ClipForge</span>
          </div>

          <div className="glass-card rounded-2xl p-8 border border-forge-border flex flex-col items-center justify-center">
            {success ? (
              <>
                <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/25 flex items-center justify-center mb-5 animate-pulse-soft">
                  <CheckCircle2 size={32} className="text-green-400" />
                </div>
                <h1 className="text-2xl font-black text-forge-text mb-2">Verification Successful</h1>
                <p className="text-sm text-forge-muted mb-6">Thank you! Your email has been verified. You can now start creating viral clips.</p>
                <div className="flex items-center gap-2 text-xs text-violet-400 font-semibold bg-violet-500/5 px-4 py-2.5 rounded-full border border-violet-500/15">
                  <Loader2 size={12} className="animate-spin" />
                  Redirecting to dashboard...
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center mb-5">
                  <XCircle size={32} className="text-red-400" />
                </div>
                <h1 className="text-2xl font-black text-forge-text mb-2">Verification Failed</h1>
                <p className="text-sm text-forge-muted mb-6 px-2">{verifyError}</p>
                <div className="w-full space-y-2">
                  {user ? (
                    <button
                      onClick={() => {
                        setVerifyError(null);
                        setVerifying(false);
                        // Clean URL query token parameter
                        navigate('/verify-email', { replace: true });
                      }}
                      className="btn-primary w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Resend Link
                      <RefreshCw size={15} />
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/signin', { replace: true })}
                      className="btn-primary w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Go to Sign In
                      <ArrowRight size={15} />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render pending verification instructions screen (when user is logged in but unverified)
  return (
    <div className="min-h-screen flex items-center justify-center px-4 page-enter">
      <div className="fixed top-5 right-5 z-20">
        <ThemeToggle />
      </div>
      <div className="fixed top-1/4 -left-32 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 -right-32 w-[350px] h-[350px] rounded-full bg-indigo-600/8 blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md relative">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-violet-600/20 border border-violet-500/35 flex items-center justify-center shadow-glow-violet-sm">
            <Scissors size={20} className="text-violet-400" />
          </div>
          <span className="text-3xl font-black gradient-text">ClipForge</span>
        </div>

        <div className="glass-card rounded-2xl p-8 border border-forge-border text-center">
          <div className="w-16 h-16 rounded-full bg-violet-600/10 border border-violet-500/25 flex items-center justify-center mx-auto mb-5 animate-pulse-soft">
            <Mail size={28} className="text-violet-400" />
          </div>

          <h1 className="text-2xl font-black text-forge-text mb-2">Verify your email</h1>
          <p className="text-sm text-forge-muted mb-4 px-2">
            We've sent a verification link to your email address:
            <br />
            <strong className="text-forge-text font-bold break-all">{user?.email}</strong>
          </p>
          <p className="text-xs text-forge-dim mb-6 px-4">
            Click the link in the email to activate your account. Be sure to check your spam/junk folder if you don't see it within a minute.
          </p>

          {resendStatus && (
            <div className={`flex items-start gap-2 text-left px-3 py-2.5 rounded-xl mb-4 text-xs ${
              resendStatus.type === 'success' 
                ? 'bg-green-500/10 border border-green-500/22 text-green-400' 
                : 'bg-red-500/10 border border-red-500/22 text-red-400'
            }`}>
              {resendStatus.type === 'success' ? <CheckCircle2 size={14} className="shrink-0 mt-0.5" /> : <XCircle size={14} className="shrink-0 mt-0.5" />}
              <span>{resendStatus.message}</span>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="btn-primary w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {resending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Sending Link...
                </>
              ) : cooldown > 0 ? (
                `Resend Link (${cooldown}s)`
              ) : (
                <>
                  Resend Verification Email
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-forge-border bg-forge-surface hover:bg-forge-card-hover transition-colors text-xs font-semibold text-forge-muted hover:text-forge-text cursor-pointer"
            >
              <LogOut size={14} />
              Sign out of {user?.email.split('@')[0]}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
