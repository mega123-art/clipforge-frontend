import { create } from 'zustand'

const getSavedTheme = () => localStorage.getItem('theme') || 'dark'

const applyTheme = (theme) => {
  const html = document.documentElement
  if (theme === 'light') {
    html.classList.add('light')
  } else {
    html.classList.remove('light')
  }
  localStorage.setItem('theme', theme)
}

applyTheme(getSavedTheme())

const getSavedUser = () => {
  try {
    const raw = localStorage.getItem('auth_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const useStore = create((set, get) => ({
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
    const next = get().theme === 'dark' ? 'light' : 'dark'
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
      // Lazy import to avoid circular dep with api.js
      const api = (await import('./api')).default
      const { data } = await api.get('/api/auth/me')
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
      const all = JSON.parse(localStorage.getItem('recentJobs') || '[]')
      return all.filter((j) => j.status === 'ready')
    } catch {
      return []
    }
  },

  addRecentJob: (job) => {
    const recent = get().getRecentJobs()
    const updated = [
      { id: job.job_id, title: job.video_title, status: job.status, created_at: new Date().toISOString() },
      ...recent.filter((j) => j.id !== job.job_id),
    ].slice(0, 10)
    localStorage.setItem('recentJobs', JSON.stringify(updated))
  },
}))

export default useStore
