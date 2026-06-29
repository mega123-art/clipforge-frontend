import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Film, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react'
import api from '../api'
import UserMenu from '../components/UserMenu'
import CreditsBadge from '../components/CreditsBadge'
import TopupButton from '../components/TopupButton'
import PlanButton from '../components/PlanButton'
import type { JobOut } from '../types/api'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtDuration(sec?: number | null) {
  if (!sec) return ''
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'done') return (
    <span className="flex items-center gap-1 text-xs text-emerald-400">
      <CheckCircle size={11} /> Done
    </span>
  )
  if (status === 'failed' || status === 'error') return (
    <span className="flex items-center gap-1 text-xs text-red-400">
      <XCircle size={11} /> Failed
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-xs text-yellow-400">
      <Loader2 size={11} className="animate-spin" /> {status}
    </span>
  )
}

export default function MyClips() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<JobOut[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    api.get<JobOut[]>('/api/jobs')
      .then(r => setJobs(r.data))
      .catch(() => setError('Failed to load jobs'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-forge-bg text-forge-text">
      {/* Navbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-3 border-b border-forge-border bg-forge-bg/80 backdrop-blur">
        <button
          onClick={() => navigate('/app')}
          className="flex items-center gap-1.5 text-sm text-forge-subtext hover:text-forge-text transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} />
          New video
        </button>
        <div className="flex items-center gap-3">
          <CreditsBadge />
          <div className="hidden sm:flex items-center gap-2">
            <PlanButton />
            <TopupButton />
          </div>
          <UserMenu />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-8">
        <h1 className="text-2xl font-bold mb-6">My Clips</h1>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-forge-accent" />
          </div>
        )}

        {error && (
          <p className="text-center text-red-400 py-20">{error}</p>
        )}

        {!loading && !error && jobs.length === 0 && (
          <div className="text-center py-20 text-forge-dim">
            <Film size={40} className="mx-auto mb-3 opacity-30" />
            <p>No videos processed yet.</p>
            <button
              onClick={() => navigate('/app')}
              className="mt-4 text-sm text-forge-accent hover:text-forge-accent transition-colors cursor-pointer"
            >
              Upload your first video →
            </button>
          </div>
        )}

        {!loading && !error && jobs.length > 0 && (
          <>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by video title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-forge-border/10 border border-forge-border focus:border-forge-accent focus:outline-none transition-colors text-sm text-forge-text placeholder:text-forge-dim"
              />
            </div>

            {(() => {
              const filteredJobs = jobs.filter(job => {
                const title = (job.video_title || job.source_filename || job.job_id || '').toLowerCase()
                return title.includes(searchQuery.toLowerCase())
              })

              if (filteredJobs.length === 0) {
                return (
                  <div className="text-center py-10 text-forge-dim text-sm">
                    No matching videos found.
                  </div>
                )
              }

              return (
                <div className="space-y-3">
                  {filteredJobs.map(job => {
                    const exportedCount = job.clips.filter(c => c.status === 'exported').length
                    const totalClips = job.clips.length
                    return (
                      <button
                        key={job.job_id}
                        onClick={() => navigate(`/review/${job.job_id}`)}
                        className="w-full flex items-center gap-4 px-4 py-4 glass-card rounded-xl border border-forge-border card-hover-glow text-left group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-lg bg-forge-accent/10 border border-forge-accent/20 flex items-center justify-center shrink-0 group-hover:bg-forge-accent/22 transition-colors">
                          <Film size={16} className="text-forge-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-forge-text truncate">
                            {job.video_title || job.source_filename || job.job_id}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1 text-xs text-forge-dim">
                              <Clock size={10} />
                              {fmtDate(job.created_at)}
                            </span>
                            {job.video_duration_seconds && (
                              <span className="text-xs text-forge-dim">{fmtDuration(job.video_duration_seconds)}</span>
                            )}
                            {totalClips > 0 && (
                              <span className="text-xs text-forge-dim">{totalClips} clip{totalClips !== 1 ? 's' : ''}</span>
                            )}
                            {exportedCount > 0 && (
                              <span className="text-xs text-emerald-400">{exportedCount} exported</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <StatusBadge status={job.status} />
                          <ArrowRight size={14} className="text-forge-dim group-hover:text-forge-accent transition-colors" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            })()}
          </>
        )}
      </div>
    </div>
  )
}
