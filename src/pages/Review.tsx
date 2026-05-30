import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient, Query } from '@tanstack/react-query'
import api from '../api'
import { Scissors, CheckCheck, Download, Plus, SplitSquareHorizontal } from 'lucide-react'
import VibeClipLogo from '../components/VibeClipLogo'
import ThemeToggle from '../components/ThemeToggle'
import UserMenu from '../components/UserMenu'
import CreditsBadge from '../components/CreditsBadge'
import ClipCard from '../components/ClipCard'
import ClipCardSkeleton from '../components/ClipCardSkeleton'
import Timeline from '../components/Timeline'
import ExportModal from '../components/ExportModal'
import MoreClipsModal from '../components/MoreClipsModal'
import ManualClipper from '../components/ManualClipper'
import useStore from '../store'
import type { ClipOut, JobOut, MoreClipsOptions } from '../types/api'

export default function Review() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { setCurrentJob, setClips, selectedClipId, setSelectedClipId } = useStore()
  const [exportQueue, setExportQueue] = useState<string[]>([])
  const [exportIndex, setExportIndex] = useState(0)
  const [showMoreClipsModal, setShowMoreClipsModal] = useState(false)
  const [showManualClipper, setShowManualClipper] = useState(false)

  const startExport = (ids: string[]) => {
    setExportIndex(0)
    setExportQueue(ids)
  }
  const closeExport = () => {
    setExportQueue([])
    setExportIndex(0)
  }

  const { data: job, isLoading, error } = useQuery<JobOut>({
    queryKey: ['job', jobId],
    queryFn: () => api.get<JobOut>(`/api/jobs/${jobId}`).then((r) => r.data),
    refetchInterval: (query: Query<JobOut>) => {
      const data = query.state.data
      if (!data) return false
      const hasRendering = (data.clips || []).some((c) => c.status === 'rendering')
      const failureCount = query.state.failureCount || 0
      if (!hasRendering) return false
      if (failureCount > 0) return Math.min(3000 * 2 ** failureCount, 30000)
      return 3000
    },
  })

  useEffect(() => {
    if (job) {
      setCurrentJob(job)
      setClips(job.clips || [])
    }
  }, [job, setCurrentJob, setClips])

  const approveAllMutation = useMutation({
    mutationFn: (clips: ClipOut[]) =>
      Promise.all(
        clips.map((c) => api.patch(`/api/clips/${c.id}`, { user_approved: true }))
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job', jobId] }),
  })

  const moreClipsMutation = useMutation({
    mutationFn: (options: MoreClipsOptions) => api.post(`/api/jobs/${jobId}/more-clips`, options),
    onSuccess: () => {
      setShowMoreClipsModal(false)
      queryClient.removeQueries({ queryKey: ['job', jobId] })
      navigate(`/processing/${jobId}`, { state: { moreClips: true } })
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-10 glass border-b border-forge-border px-6 py-3 flex items-center gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-forge-muted hover:text-forge-text transition-colors cursor-pointer">
            <VibeClipLogo size={28} className="rounded-lg" />
            <span className="font-bold text-sm gradient-text">VibeClip</span>
          </button>
          <div className="h-4 w-px bg-forge-border" />
          <div className="h-4 w-48 bg-forge-border rounded animate-pulse" />
        </header>
        <main className="flex-1 px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <ClipCardSkeleton key={i} />)}
          </div>
        </main>
      </div>
    )
  }

  if (error || !job) {
    const ax = error as { response?: { status?: number; data?: { detail?: string } }; message?: string } | null
    const httpStatus = ax?.response?.status
    const detail = ax?.response?.data?.detail
    let msg = 'Failed to load job.'
    if (httpStatus === 401) msg = 'Session expired. Please sign in again.'
    else if (httpStatus === 403) msg = "You don't have access to this job."
    else if (httpStatus === 404) msg = 'Job not found. It may have been deleted.'
    else if (httpStatus && httpStatus >= 500) msg = `Server error (${httpStatus}). Try again in a moment.`
    else if (detail) msg = detail
    else if (ax?.message) msg = ax.message
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-red-400">{msg}</p>
          {httpStatus ? <p className="text-zinc-500 text-xs mt-1">HTTP {httpStatus}</p> : null}
          <button onClick={() => navigate('/')} className="mt-3 text-forge-accent hover:underline text-sm cursor-pointer">
            Go home
          </button>
        </div>
      </div>
    )
  }

  const clips: ClipOut[] = job.clips || []
  const approvedClips = clips.filter((c) => c.user_approved)

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 glass border-b border-forge-border px-6 py-3 flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-forge-muted hover:text-forge-text transition-colors group cursor-pointer"
        >
          <VibeClipLogo size={28} className="rounded-lg" />
          <span className="font-black text-sm gradient-text">VibeClip</span>
        </button>

        <div className="w-px h-4 bg-forge-border" />

        <div className="flex-1 min-w-0 flex items-baseline gap-2">
          <h1 className="text-sm text-forge-muted truncate">{job.video_title || jobId}</h1>
          {(() => {
            const meta: string[] = []
            if (job.detected_language) meta.push(job.detected_language.toUpperCase())
            if (job.video_duration_seconds) {
              const s = Math.floor(job.video_duration_seconds)
              const h = Math.floor(s / 3600)
              const m = Math.floor((s % 3600) / 60)
              const sec = s % 60
              meta.push(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${sec}s` : `${sec}s`)
            }
            return meta.length ? (
              <span className="hidden md:inline text-xs text-forge-dim shrink-0">· {meta.join(' · ')}</span>
            ) : null
          })()}
        </div>

        {approvedClips.length > 0 && (
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-forge-dim px-2.5 py-1 rounded-full bg-forge-surface border border-forge-border">
            <span className="font-bold text-forge-accent">{approvedClips.length}</span> approved
          </span>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => approveAllMutation.mutate(clips)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-forge-border rounded-lg text-forge-muted hover:text-forge-text hover:border-forge-border-bright transition-all cursor-pointer"
          >
            <CheckCheck size={12} />
            Approve all
          </button>

          {job.video_duration_seconds && (
            <button
              onClick={() => setShowManualClipper((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-lg transition-all cursor-pointer ${
                showManualClipper
                  ? 'border-forge-accent/60 text-forge-accent bg-forge-accent/10'
                  : 'border-forge-border text-forge-muted hover:text-forge-text hover:border-forge-border-bright'
              }`}
            >
              <SplitSquareHorizontal size={12} />
              Manual clip
            </button>
          )}

          <button
            onClick={() => setShowMoreClipsModal(true)}
            disabled={job.status === 'analyzing'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-forge-border rounded-lg text-forge-muted hover:text-forge-text hover:border-forge-border-bright transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Plus size={12} />
            More clips
          </button>

          {approvedClips.length > 0 && (
            <button
              onClick={() => startExport(approvedClips.map((c) => c.id))}
              className="btn-primary flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer"
            >
              <Download size={12} />
              Export {approvedClips.length}
            </button>
          )}

          <CreditsBadge />
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

      {/* ── Timeline ───────────────────────────────────────── */}
      {job.video_duration_seconds && clips.length > 0 && (
        <div className="px-6 py-4 border-b border-forge-border">
          <Timeline
            duration={job.video_duration_seconds}
            clips={clips}
            selectedClipId={selectedClipId}
            onClipClick={setSelectedClipId}
          />
        </div>
      )}

      {/* ── Manual clipper ─────────────────────────────────── */}
      {showManualClipper && job.video_duration_seconds && jobId && (
        <div className="px-6 py-4 border-b border-forge-border">
          <ManualClipper
            duration={job.video_duration_seconds}
            jobId={jobId}
            onCreated={() => {
              setShowManualClipper(false)
              queryClient.invalidateQueries({ queryKey: ['job', jobId] })
            }}
          />
        </div>
      )}

      {/* ── Clip grid ──────────────────────────────────────── */}
      <main className="flex-1 px-6 py-6">
        {clips.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-forge-surface border border-forge-border flex items-center justify-center">
              <Scissors size={22} className="text-forge-muted" />
            </div>
            <p className="text-forge-muted text-sm">No clips found for this job.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {clips.map((clip) =>
              clip.status === 'rendering' ? (
                <ClipCardSkeleton key={clip.id} rank={clip.rank} />
              ) : (
                <ClipCard
                  key={clip.id}
                  clip={clip}
                  isSelected={selectedClipId === clip.id}
                  onSelect={() => setSelectedClipId(clip.id)}
                  onExport={() => startExport([clip.id])}
                  onUpdate={() => queryClient.invalidateQueries({ queryKey: ['job', jobId] })}
                />
              )
            )}
          </div>
        )}
      </main>

      {showMoreClipsModal && (
        <MoreClipsModal
          loading={moreClipsMutation.isPending}
          onConfirm={(opts) => moreClipsMutation.mutate(opts)}
          onClose={() => setShowMoreClipsModal(false)}
        />
      )}

      {exportQueue.length > 0 && (
        <ExportModal
          clipIds={exportQueue}
          index={exportIndex}
          onIndexChange={setExportIndex}
          onClose={closeExport}
        />
      )}
    </div>
  )
}
