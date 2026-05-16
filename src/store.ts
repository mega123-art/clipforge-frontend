import { create } from 'zustand'
import type { ClipOut, JobOut, User, AuthOut } from './types/api'

type Theme = 'light' | 'dark'

interface RecentJob {
  id: string
  title?: string | null
  status: string
  created_at: string
}

const getSavedTheme = (): Theme =>
  (localStorage.getItem('theme') as Theme) || 'dark'

const applyTheme = (theme: Theme) => {
  const html = document.documentElement
  if (theme === 'light') {
    html.classList.add('light')
  } else {
    html.classList.remove('light')
  }
  localStorage.setItem('theme', theme)
}

applyTheme(getSavedTheme())

const getSavedUser = (): User | null => {
  try {
    const raw = localStorage.getItem('auth_user')
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

interface StoreState {
  currentJob: JobOut | null
  clips: ClipOut[]
  selectedClipId: string | null
  theme: Theme

  user: User | null
  token: string | null

  setCurrentJob: (job: JobOut | null) => void
  setClips: (clips: ClipOut[]) => void
  setSelectedClipId: (id: string | null) => void

  toggleTheme: () => void

  setAuth: (payload: AuthOut) => void
  logout: () => void
  refreshUser: () => Promise<void>

  updateClip: (clipId: string, updates: Partial<ClipOut>) => void

  getRecentJobs: () => RecentJob[]
  addRecentJob: (job: { job_id: string; video_title?: string | null; status?: string }) => void
}

const useStore = create<StoreState>((set, get) => ({
  // ── App state ──
  currentJob: null,
  clips: [],
  selectedClipId: null,
  theme: getSavedTheme(),

  // ── Auth state ──
  user: getSavedUser(),
  token: localStorage.getItem('auth_token') || null,

  setCurrentJob: (job) => set({ currentJob: job }),
  setClips: (clips) => set({ clips }),
  setSelectedClipId: (id) => set({ selectedClipId: id }),

  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    set({ theme: next })
  },

  // ── Auth actions ──
  setAuth: ({ access_token, user }) => {
    localStorage.setItem('auth_token', access_token)
    localStorage.setItem('auth_user', JSON.stringify(user))
    set({ token: access_token, user })
  },

  logout: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    set({ token: null, user: null, currentJob: null, clips: [], selectedClipId: null })
  },

  refreshUser: async () => {
    const token = get().token
    if (!token) return
    try {
      // Lazy import to avoid circular dep with api.ts
      const api = (await import('./api')).default
      const { data } = await api.get<User>('/api/auth/me')
      localStorage.setItem('auth_user', JSON.stringify(data))
      set({ user: data })
    } catch {
      // 401 handled by api interceptor
    }
  },

  updateClip: (clipId, updates) =>
    set((state) => ({
      clips: state.clips.map((c) => (c.id === clipId ? { ...c, ...updates } : c)),
    })),

  getRecentJobs: () => {
    try {
      const all = JSON.parse(localStorage.getItem('recentJobs') || '[]') as RecentJob[]
      return all.filter((j) => j.status === 'ready')
    } catch {
      return []
    }
  },

  addRecentJob: (job) => {
    const recent = get().getRecentJobs()
    const updated: RecentJob[] = [
      {
        id: job.job_id,
        title: job.video_title ?? null,
        status: job.status ?? 'ready',
        created_at: new Date().toISOString(),
      },
      ...recent.filter((j) => j.id !== job.job_id),
    ].slice(0, 10)
    localStorage.setItem('recentJobs', JSON.stringify(updated))
  },
}))

export default useStore
