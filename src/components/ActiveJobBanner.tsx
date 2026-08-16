import { useQuery } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api'
import useStore from '../store'
import { qk } from '../lib/queryKeys'
import type { JobSummary, JobListOut } from '../types/api'

const ACTIVE = new Set(['pending', 'downloading', 'transcribing', 'diarizing', 'analyzing', 'clipping'])

const STAGE_LABEL: Record<string, string> = {
  pending: 'Queued',
  downloading: 'Downloading',
  transcribing: 'Transcribing',
  diarizing: 'Identifying speakers',
  analyzing: 'Finding viral moments',
  clipping: 'Rendering clips',
}

export default function ActiveJobBanner() {
  const token = useStore((s) => s.token)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const { data } = useQuery<JobSummary[]>({
    queryKey: qk.jobs.active,
    queryFn: () =>
      api
        .get<JobListOut>('/api/jobs', { params: { page: 1, page_size: 20 } })
        .then((r) => (Array.isArray(r.data) ? (r.data as JobSummary[]) : (r.data?.items ?? []))),
    refetchInterval: 15000,
    enabled: !!token,
  })

  const active = data?.find((j) => ACTIVE.has(j.status))
  if (!active || pathname === `/processing/${active.job_id}`) return null

  const label = STAGE_LABEL[active.status] ?? active.status

  return (
    <div
      style={{ zIndex: 9999 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-xl border border-cyan-500/40 bg-forge-bg/95 px-4 py-3 shadow-lg shadow-cyan-900/30 backdrop-blur"
    >
      <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
      <span className="text-sm text-forge-text/80">
        <span className="font-semibold text-cyan-400">{label}…</span>
        {active.video_title ? ` · ${active.video_title.slice(0, 40)}` : ''}
      </span>
      <button
        onClick={() => navigate(`/processing/${active.job_id}`)}
        className="rounded-lg bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30"
      >
        Resume
      </button>
    </div>
  )
}
