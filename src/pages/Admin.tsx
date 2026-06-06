import { useState, FormEvent, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Coins, Users, FileText, Search, Plus, ShieldCheck,
  ArrowLeft, AlertCircle, CheckCircle2, ServerCog, Lock,
  Clapperboard, Download, Activity, XCircle,
  LucideIcon,
} from 'lucide-react'
import VibeClipLogo from '../components/VibeClipLogo'
import type { AxiosError } from 'axios'
import api from '../api'
import useStore from '../store'
import ThemeToggle from '../components/ThemeToggle'
import type {
  AuthOut,
  AdminStats,
  AdminLog,
  CreditTxn,
  User,
  GrantCreditsResponse,
} from '../types/api'

interface AdminPasswordGateProps {
  onUnlock: (data: AuthOut) => void
}

function AdminPasswordGate({ onUnlock }: AdminPasswordGateProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post<AuthOut>('/api/admin/unlock', { password })
      onUnlock(data)
    } catch (err) {
      const ax = err as AxiosError<{ detail?: string }>
      setError(ax.response?.data?.detail || 'Invalid password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 page-enter">
      <div className="fixed top-5 right-5 z-20"><ThemeToggle /></div>
      <div className="fixed top-1/4 -left-32 w-[400px] h-[400px] rounded-full bg-amber-600/8 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-amber-600/20 border border-amber-500/35 flex items-center justify-center">
            <ShieldCheck size={20} className="text-amber-400" />
          </div>
          <span className="text-2xl font-black gradient-text">Admin Panel</span>
        </div>

        <div className="glass-card rounded-2xl p-8 border border-forge-border">
          <p className="text-sm text-forge-muted mb-6">Enter the admin password to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 bg-forge-surface rounded-xl px-4 py-3 border border-forge-border focus-within:border-amber-500/50 transition-colors">
              <Lock size={15} className="text-forge-dim shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password"
                required
                autoFocus
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
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</>
              ) : (
                <><ShieldCheck size={15} />Enter Admin Panel</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

interface StatTileProps {
  icon: LucideIcon
  label: string
  value: string | number
  hint?: string
  accent?: string
}

function StatTile({ icon: Icon, label, value, hint, accent }: StatTileProps) {
  return (
    <div className="glass-card rounded-2xl p-5 border border-forge-border">
      <div className="flex items-center gap-2.5 mb-2">
        <Icon size={14} className={accent || 'text-forge-accent'} />
        <span className="text-xs font-bold uppercase tracking-wider text-forge-muted">{label}</span>
      </div>
      <div className="text-3xl font-black text-forge-text tabular-nums">{value}</div>
      {hint && <div className="text-xs text-forge-dim mt-1">{hint}</div>}
    </div>
  )
}

interface GrantPayload {
  email: string
  amount: number
  note?: string
}

export default function Admin() {
  const { user, setAuth } = useStore()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [grantEmail, setGrantEmail] = useState('')
  const [grantAmount, setGrantAmount] = useState<number | string>(10)
  const [grantNote, setGrantNote] = useState('')
  const [flash, setFlash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Hooks must always run in the same order — call them before any early returns,
  // but disable when not yet an admin so we don't hit the API.
  const isAdmin = !!user?.is_admin

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get<AdminStats>('/api/admin/stats').then((r) => r.data),
    enabled: isAdmin,
  })

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['admin-users', search],
    queryFn: () =>
      api
        .get<User[]>('/api/admin/users', { params: { q: search || undefined } })
        .then((r) => r.data),
    enabled: isAdmin,
  })

  const { data: logs = [] } = useQuery<AdminLog[]>({
    queryKey: ['admin-logs'],
    queryFn: () => api.get<AdminLog[]>('/api/admin/logs').then((r) => r.data),
    enabled: isAdmin,
  })

  const { data: txns = [] } = useQuery<CreditTxn[]>({
    queryKey: ['admin-txns'],
    queryFn: () => api.get<CreditTxn[]>('/api/admin/credits/transactions').then((r) => r.data),
    enabled: isAdmin,
  })

  const grantMutation = useMutation<GrantCreditsResponse, AxiosError<{ detail?: string }>, GrantPayload>({
    mutationFn: (body) =>
      api.post<GrantCreditsResponse>('/api/admin/credits/grant', body).then((r) => r.data),
    onSuccess: (data) => {
      setFlash(`Granted ${data.granted} credits to ${data.user_email}. New balance: ${data.new_balance}`)
      setError(null)
      setGrantEmail('')
      setGrantNote('')
      setGrantAmount(10)
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['admin-logs'] })
      qc.invalidateQueries({ queryKey: ['admin-txns'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      setTimeout(() => setFlash(null), 4000)
    },
    onError: (err) => {
      setError(err.response?.data?.detail || 'Grant failed')
      setFlash(null)
    },
  })

  if (!isAdmin) {
    return (
      <AdminPasswordGate
        onUnlock={(data) => {
          setAuth({ access_token: data.access_token, user: data.user })
        }}
      />
    )
  }

  const handleGrant = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    grantMutation.mutate({ email: grantEmail, amount: Number(grantAmount), note: grantNote || undefined })
  }

  const fmtDate = (d: string): string => new Date(d).toLocaleString()

  const downloadCsv = useCallback(async (endpoint: string, filename: string) => {
    const resp = await api.get(endpoint, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([resp.data], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  return (
    <div className="min-h-screen flex flex-col page-enter">
      {/* Header */}
      <header className="sticky top-0 z-10 glass border-b border-forge-border px-6 py-3 flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-forge-muted hover:text-forge-text transition-colors group cursor-pointer"
        >
          <ArrowLeft size={15} />
          <VibeClipLogo size={28} className="rounded-lg" />
          <span className="font-black text-sm gradient-text">VibeClip</span>
        </button>
        <div className="w-px h-4 bg-forge-border" />
        <div className="flex items-center gap-2 flex-1">
          <ShieldCheck size={15} className="text-amber-400" />
          <h1 className="text-sm font-bold text-forge-text">Admin Panel</h1>
          {stats?.dev_mode && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/35 text-amber-400">
              DEV MODE — credits bypassed
            </span>
          )}
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 px-6 py-6 max-w-6xl mx-auto w-full space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatTile icon={Users} label="Total users" value={stats?.total_users ?? '—'} />
          <StatTile icon={FileText} label="Total jobs" value={stats?.total_jobs ?? '—'} />
          <StatTile
            icon={Activity}
            label="Active jobs"
            value={stats?.active_jobs ?? '—'}
            hint="Currently processing"
            accent="text-emerald-400"
          />
          <StatTile
            icon={XCircle}
            label="Failed jobs"
            value={stats?.failed_jobs ?? '—'}
            accent="text-rose-400"
          />
          <StatTile
            icon={Clapperboard}
            label="Clips generated"
            value={stats?.total_clips ?? '—'}
            hint="All time"
            accent="text-violet-400"
          />
          <StatTile
            icon={Download}
            label="Clips exported"
            value={stats?.total_exports ?? '—'}
            hint="Status: ready"
            accent="text-sky-400"
          />
          <StatTile
            icon={Coins}
            label="Credits outstanding"
            value={stats?.total_credits_outstanding ?? '—'}
            hint="Unspent across all users"
            accent="text-amber-400"
          />
          <StatTile
            icon={Coins}
            label="Credits spent"
            value={stats?.total_credits_spent ?? '—'}
            hint="All time consumed"
            accent="text-orange-400"
          />
        </div>

        {/* Export CSV */}
        <div className="glass-card rounded-2xl p-5 border border-forge-border">
          <div className="flex items-center gap-2 mb-4">
            <Download size={15} className="text-forge-accent" />
            <h2 className="text-sm font-black text-forge-text">Export data</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Users', endpoint: '/api/admin/export/users.csv', file: 'users.csv' },
              { label: 'Jobs', endpoint: '/api/admin/export/jobs.csv', file: 'jobs.csv' },
              { label: 'Transactions', endpoint: '/api/admin/export/transactions.csv', file: 'transactions.csv' },
            ].map(({ label, endpoint, file }) => (
              <button
                key={file}
                onClick={() => downloadCsv(endpoint, file)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-forge-surface border border-forge-border hover:border-forge-accent/40 text-sm font-semibold text-forge-text transition-colors cursor-pointer"
              >
                <Download size={13} className="text-forge-accent" />
                {label} CSV
              </button>
            ))}
          </div>
        </div>

        {/* Grant credits */}
        <div className="glass-card rounded-2xl p-6 border border-forge-border">
          <div className="flex items-center gap-2 mb-4">
            <Coins size={16} className="text-forge-accent" />
            <h2 className="text-base font-black text-forge-text">Grant credits</h2>
          </div>

          <form onSubmit={handleGrant} className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <input
              type="email"
              required
              value={grantEmail}
              onChange={(e) => setGrantEmail(e.target.value)}
              placeholder="user@example.com"
              className="md:col-span-5 bg-forge-surface border border-forge-border rounded-xl px-4 py-2.5 text-sm text-forge-text placeholder-forge-dim outline-none focus:border-forge-accent/50 transition-colors"
            />
            <input
              type="number"
              required
              min={1}
              max={100000}
              value={grantAmount}
              onChange={(e) => setGrantAmount(e.target.value)}
              placeholder="10"
              className="md:col-span-2 bg-forge-surface border border-forge-border rounded-xl px-4 py-2.5 text-sm text-forge-text placeholder-forge-dim outline-none focus:border-forge-accent/50 transition-colors tabular-nums"
            />
            <input
              type="text"
              value={grantNote}
              onChange={(e) => setGrantNote(e.target.value)}
              placeholder="Note (optional)"
              maxLength={200}
              className="md:col-span-3 bg-forge-surface border border-forge-border rounded-xl px-4 py-2.5 text-sm text-forge-text placeholder-forge-dim outline-none focus:border-forge-accent/50 transition-colors"
            />
            <button
              type="submit"
              disabled={grantMutation.isPending}
              className="btn-primary md:col-span-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Plus size={14} />
              {grantMutation.isPending ? 'Granting...' : 'Grant'}
            </button>
          </form>

          {flash && (
            <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              <span>{flash}</span>
            </div>
          )}
          {error && (
            <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Users */}
        <div className="glass-card rounded-2xl border border-forge-border overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-forge-border">
            <Users size={16} className="text-forge-accent" />
            <h2 className="text-base font-black text-forge-text">Users</h2>
            <div className="flex-1" />
            <div className="flex items-center gap-2 bg-forge-surface border border-forge-border rounded-lg px-3 py-1.5 w-64">
              <Search size={13} className="text-forge-dim" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search email or name..."
                className="flex-1 bg-transparent outline-none text-xs text-forge-text placeholder-forge-dim"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-forge-surface text-forge-muted uppercase tracking-wider">
                <tr>
                  <th className="text-left px-6 py-3 font-bold">User</th>
                  <th className="text-left px-4 py-3 font-bold">Provider</th>
                  <th className="text-right px-4 py-3 font-bold">Credits</th>
                  <th className="text-right px-4 py-3 font-bold">Jobs</th>
                  <th className="text-left px-4 py-3 font-bold">Joined</th>
                  <th className="text-left px-4 py-3 font-bold">Last login</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-forge-border hover:bg-forge-card-hover transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2.5">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-7 h-7 rounded-full" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-forge-accent to-teal-600 flex items-center justify-center text-white text-[10px] font-bold">
                            {(u.name || u.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-forge-text">{u.name || u.email.split('@')[0]}</div>
                          <div className="text-forge-muted">{u.email}</div>
                        </div>
                        {u.is_admin && (
                          <ShieldCheck size={12} className="text-amber-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-forge-muted">{u.auth_provider}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-forge-accent">{u.credits}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-forge-muted">{u.job_count}</td>
                    <td className="px-4 py-3 text-forge-muted">{u.created_at ? fmtDate(u.created_at) : '—'}</td>
                    <td className="px-4 py-3 text-forge-muted">{u.last_login_at ? fmtDate(u.last_login_at) : '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setGrantEmail(u.email); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                        className="text-forge-accent hover:text-forge-accent font-semibold cursor-pointer"
                      >
                        Grant →
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-forge-muted py-8">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Logs side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Admin actions */}
          <div className="glass-card rounded-2xl border border-forge-border overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-forge-border">
              <ServerCog size={15} className="text-amber-400" />
              <h2 className="text-sm font-black text-forge-text">Admin actions</h2>
              <span className="ml-auto text-xs text-forge-dim">last {logs.length}</span>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {logs.length === 0 && (
                <p className="text-center text-forge-muted text-xs py-6">No admin actions yet.</p>
              )}
              {logs.map((l) => (
                <div key={l.id} className="px-5 py-3 border-t border-forge-border/60 first:border-t-0 hover:bg-forge-card-hover transition-colors">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-amber-400">{l.action}</span>
                    {l.target_email && (
                      <>
                        <span className="text-forge-dim">→</span>
                        <span className="text-forge-text font-medium">{l.target_email}</span>
                      </>
                    )}
                  </div>
                  <div className="text-[11px] text-forge-muted mt-1">
                    by {l.actor_email} · {fmtDate(l.created_at)}
                  </div>
                  {l.payload && (
                    <pre className="text-[10px] text-forge-dim mt-1 font-mono overflow-x-auto">{l.payload}</pre>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Credit transactions */}
          <div className="glass-card rounded-2xl border border-forge-border overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-forge-border">
              <Coins size={15} className="text-forge-accent" />
              <h2 className="text-sm font-black text-forge-text">Recent credit activity</h2>
              <span className="ml-auto text-xs text-forge-dim">last {txns.length}</span>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {txns.length === 0 && (
                <p className="text-center text-forge-muted text-xs py-6">No credit activity yet.</p>
              )}
              {txns.map((t) => {
                const positive = t.amount > 0
                return (
                  <div key={t.id} className="px-5 py-3 border-t border-forge-border/60 first:border-t-0 hover:bg-forge-card-hover transition-colors">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div>
                        <span className={`font-bold ${positive ? 'text-emerald-400' : 'text-rose-400'} tabular-nums`}>
                          {positive ? '+' : ''}{t.amount}
                        </span>
                        <span className="ml-2 text-forge-text">{t.user_email}</span>
                        <span className="ml-2 px-1.5 py-0.5 rounded-md bg-forge-surface text-[10px] uppercase tracking-wider text-forge-muted">
                          {t.kind}
                        </span>
                      </div>
                      <span className="text-forge-dim tabular-nums">bal {t.balance_after}</span>
                    </div>
                    {t.note && <div className="text-[11px] text-forge-muted mt-1 italic">{t.note}</div>}
                    <div className="text-[10px] text-forge-dim mt-0.5">{fmtDate(t.created_at)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
