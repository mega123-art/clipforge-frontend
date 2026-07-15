import { useState, FormEvent, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Coins, Users, FileText, Search, Plus, ShieldCheck,
  ArrowLeft, AlertCircle, CheckCircle2, ServerCog, Lock,
  Clapperboard, Download, Activity, XCircle, Trash2, Shield,
  LucideIcon, Power, RadioTower, Image as ImageIcon, Upload,
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
  CleanupOut,
  PreserveClipsOut,
  AppSettings,
  TemplateItem,
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
      <div className="hidden md:fixed md:top-1/4 md:-left-32 md:w-[400px] md:h-[400px] rounded-full bg-amber-600/8 blur-3xl pointer-events-none" />

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
  const [cleanupResult, setCleanupResult] = useState<CleanupOut | null>(null)
  const [cleanupError, setCleanupError] = useState<string | null>(null)
  const [preserveEmail, setPreserveEmail] = useState('')
  const [preserveResult, setPreserveResult] = useState<PreserveClipsOut | null>(null)
  const [preserveError, setPreserveError] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [templateError, setTemplateError] = useState<string | null>(null)

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

  const { data: appSettings } = useQuery<AppSettings>({
    queryKey: ['admin-settings'],
    queryFn: () => api.get<AppSettings>('/api/admin/settings').then((r) => r.data),
    enabled: isAdmin,
  })

  const { data: templates = [] } = useQuery<TemplateItem[]>({
    queryKey: ['admin-templates'],
    queryFn: () => api.get<TemplateItem[]>('/api/admin/templates').then((r) => r.data),
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

  const cleanupMutation = useMutation<CleanupOut, AxiosError<{ detail?: string }>, boolean>({
    mutationFn: (sync) =>
      api.post<CleanupOut>('/api/admin/cleanup-expired', null, { params: { sync } }).then((r) => r.data),
    onSuccess: (data) => {
      setCleanupResult(data)
      setCleanupError(null)
      qc.invalidateQueries({ queryKey: ['admin-logs'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: (err) => {
      setCleanupError(err.response?.data?.detail || 'Cleanup request failed')
      setCleanupResult(null)
    },
  })

  const preserveMutation = useMutation<PreserveClipsOut, AxiosError<{ detail?: string }>, string>({
    mutationFn: (email) =>
      api.post<PreserveClipsOut>('/api/admin/preserve-clips', { user_email: email }).then((r) => r.data),
    onSuccess: (data) => {
      setPreserveResult(data)
      setPreserveError(null)
      setPreserveEmail('')
      qc.invalidateQueries({ queryKey: ['admin-logs'] })
    },
    onError: (err) => {
      setPreserveError(err.response?.data?.detail || 'Preserve request failed')
      setPreserveResult(null)
    },
  })

  const uploadTemplateMutation = useMutation<TemplateItem, AxiosError<{ detail?: string }>, { name: string; file: File }>({
    mutationFn: ({ name, file }) => {
      const form = new FormData()
      form.append('name', name)
      form.append('file', file)
      return api.post<TemplateItem>('/api/admin/templates', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data)
    },
    onSuccess: () => {
      setTemplateError(null)
      setTemplateName('')
      setTemplateFile(null)
      qc.invalidateQueries({ queryKey: ['admin-templates'] })
      qc.invalidateQueries({ queryKey: ['admin-logs'] })
    },
    onError: (err) => {
      setTemplateError(err.response?.data?.detail || 'Upload failed')
    },
  })

  const deleteTemplateMutation = useMutation<{ deleted: string }, AxiosError<{ detail?: string }>, string>({
    mutationFn: (id) => api.delete(`/api/admin/templates/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-templates'] })
      qc.invalidateQueries({ queryKey: ['admin-logs'] })
    },
  })

  const settingsMutation = useMutation<AppSettings, AxiosError<{ detail?: string }>, boolean>({
    mutationFn: (maintenanceMode) =>
      api.patch<AppSettings>('/api/admin/settings', { maintenance_mode: maintenanceMode }).then((r) => r.data),
    onSuccess: (data) => {
      setFlash(data.maintenance_mode ? 'Maintenance mode is now ON.' : 'Maintenance mode is now OFF.')
      setError(null)
      qc.invalidateQueries({ queryKey: ['admin-settings'] })
      qc.invalidateQueries({ queryKey: ['app-status'] })
      qc.invalidateQueries({ queryKey: ['admin-logs'] })
      setTimeout(() => setFlash(null), 4000)
    },
    onError: (err) => {
      setError(err.response?.data?.detail || 'Could not update maintenance mode')
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
          onClick={() => navigate('/app')}
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

        {/* Maintenance mode */}
        <div className={`glass-card rounded-2xl p-6 border ${appSettings?.maintenance_mode ? 'border-amber-500/45' : 'border-forge-border'}`}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${appSettings?.maintenance_mode ? 'border-amber-500/35 bg-amber-500/12' : 'border-emerald-500/30 bg-emerald-500/10'}`}>
                {appSettings?.maintenance_mode ? (
                  <Power size={20} className="text-amber-300" />
                ) : (
                  <RadioTower size={20} className="text-emerald-300" />
                )}
              </div>
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-black text-forge-text">Site availability</h2>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${appSettings?.maintenance_mode ? 'border-amber-500/35 bg-amber-500/10 text-amber-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'}`}>
                    {appSettings?.maintenance_mode ? 'Down page active' : 'Live'}
                  </span>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-forge-muted">
                  Toggle maintenance mode for normal users. Admin, sign in, sign up, and the downtime page stay reachable so you can turn the app back on.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={settingsMutation.isPending || !appSettings}
              onClick={() => settingsMutation.mutate(!appSettings?.maintenance_mode)}
              className={`flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                appSettings?.maintenance_mode
                  ? 'bg-emerald-500/12 border border-emerald-500/35 text-emerald-300 hover:border-emerald-400/70'
                  : 'bg-amber-500/12 border border-amber-500/35 text-amber-300 hover:border-amber-400/70'
              }`}
            >
              <Power size={15} />
              {settingsMutation.isPending
                ? 'Updating...'
                : appSettings?.maintenance_mode
                  ? 'Bring site back'
                  : 'Show down page'}
            </button>
          </div>
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 border-b border-forge-border">
            <div className="flex items-center gap-3">
              <Users size={16} className="text-forge-accent" />
              <h2 className="text-base font-black text-forge-text">Users</h2>
            </div>
            <div className="hidden sm:block flex-1" />
            <div className="flex items-center gap-2 bg-forge-surface border border-forge-border rounded-lg px-3 py-1.5 w-full sm:w-64">
              <Search size={13} className="text-forge-dim" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search email or name..."
                className="flex-1 min-w-0 bg-transparent outline-none text-xs text-forge-text placeholder-forge-dim"
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

        {/* Storage cleanup */}
        <div className="glass-card rounded-2xl p-6 border border-forge-border">
          <div className="flex items-center gap-2 mb-1">
            <Trash2 size={16} className="text-rose-400" />
            <h2 className="text-base font-black text-forge-text">Storage cleanup</h2>
          </div>
          <p className="text-xs text-forge-muted mb-4">
            Delete expired free clips (&gt;3 days old) + purge R2 source videos for fully-expired jobs.
            Paid users' clips are never touched.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { setCleanupResult(null); setCleanupError(null); cleanupMutation.mutate(true) }}
              disabled={cleanupMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:border-rose-500/60 text-sm font-bold text-rose-400 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Trash2 size={13} />
              {cleanupMutation.isPending ? 'Running…' : 'Run now (sync)'}
            </button>
            <button
              onClick={() => { setCleanupResult(null); setCleanupError(null); cleanupMutation.mutate(false) }}
              disabled={cleanupMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forge-surface border border-forge-border hover:border-forge-accent/40 text-sm font-semibold text-forge-text transition-colors disabled:opacity-50 cursor-pointer"
            >
              <ServerCog size={13} className="text-forge-accent" />
              Queue to worker (async)
            </button>
          </div>

          {cleanupResult && (
            <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              {cleanupResult.mode === 'async' ? (
                <span>Queued to worker — task ID: <span className="font-mono text-xs">{cleanupResult.task_id}</span>. Check worker logs for results.</span>
              ) : (
                <span>
                  Done — <strong>{cleanupResult.result?.deleted_count ?? 0}</strong> clip{cleanupResult.result?.deleted_count !== 1 ? 's' : ''} deleted,{' '}
                  <strong>{cleanupResult.result?.purged_jobs ?? 0}</strong> job{cleanupResult.result?.purged_jobs !== 1 ? 's' : ''} purged from R2.
                </span>
              )}
            </div>
          )}
          {cleanupError && (
            <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{cleanupError}</span>
            </div>
          )}
        </div>

        {/* Preserve clips */}
        <div className="glass-card rounded-2xl p-6 border border-forge-border">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} className="text-emerald-400" />
            <h2 className="text-base font-black text-forge-text">Preserve clips</h2>
          </div>
          <p className="text-xs text-forge-muted mb-4">
            Convert a user's free clips to paid, exempting them from the 3-day expiry sweep.
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); setPreserveResult(null); setPreserveError(null); preserveMutation.mutate(preserveEmail) }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="email"
              required
              value={preserveEmail}
              onChange={(e) => setPreserveEmail(e.target.value)}
              placeholder="user@example.com"
              className="flex-1 bg-forge-surface border border-forge-border rounded-xl px-4 py-2.5 text-sm text-forge-text placeholder-forge-dim outline-none focus:border-emerald-500/50 transition-colors"
            />
            <button
              type="submit"
              disabled={preserveMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/60 text-sm font-bold text-emerald-400 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
            >
              <Shield size={13} />
              {preserveMutation.isPending ? 'Preserving…' : 'Preserve clips'}
            </button>
          </form>

          {preserveResult && (
            <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              <span>
                <strong>{preserveResult.clips_converted}</strong> clip{preserveResult.clips_converted !== 1 ? 's' : ''} for{' '}
                <strong>{preserveResult.user_email}</strong> marked paid — exempt from expiry.
              </span>
            </div>
          )}
          {preserveError && (
            <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{preserveError}</span>
            </div>
          )}
        </div>

        {/* Templates */}
        <div className="glass-card rounded-2xl p-6 border border-forge-border">
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon size={16} className="text-forge-accent" />
            <h2 className="text-base font-black text-forge-text">Templates (green-screen images)</h2>
          </div>
          <p className="text-xs text-forge-muted mb-4">
            Upload PNG/JPEG/WEBP images (max 20MB) used as green-screen templates.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!templateFile) { setTemplateError('Choose an image file'); return }
              setTemplateError(null)
              uploadTemplateMutation.mutate({ name: templateName, file: templateFile })
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              required
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name"
              className="flex-1 bg-forge-surface border border-forge-border rounded-xl px-4 py-2.5 text-sm text-forge-text placeholder-forge-dim outline-none focus:border-forge-accent/50 transition-colors"
            />
            <input
              type="file"
              required
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
              className="flex-1 bg-forge-surface border border-forge-border rounded-xl px-4 py-2.5 text-sm text-forge-text file:mr-3 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-forge-accent/20 file:text-forge-accent file:text-xs file:font-bold outline-none focus:border-forge-accent/50 transition-colors"
            />
            <button
              type="submit"
              disabled={uploadTemplateMutation.isPending}
              className="btn-primary rounded-xl px-5 py-2.5 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shrink-0"
            >
              <Upload size={14} />
              {uploadTemplateMutation.isPending ? 'Uploading...' : 'Upload'}
            </button>
          </form>

          {templateError && (
            <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{templateError}</span>
            </div>
          )}

          {templates.length > 0 && (
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {templates.map((t) => (
                <div key={t.id} className="relative group rounded-xl overflow-hidden border border-forge-border bg-forge-surface">
                  <img src={t.image_url} alt={t.name} className="w-full aspect-video object-cover" />
                  <div className="p-2">
                    <div className="text-xs font-bold text-forge-text truncate">{t.name}</div>
                    <div className="text-[10px] text-forge-dim">{fmtDate(t.created_at)}</div>
                  </div>
                  <button
                    onClick={() => deleteTemplateMutation.mutate(t.id)}
                    disabled={deleteTemplateMutation.isPending}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-50"
                    title="Delete template"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {templates.length === 0 && (
            <p className="mt-4 text-center text-forge-muted text-xs py-4">No templates uploaded yet.</p>
          )}
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
