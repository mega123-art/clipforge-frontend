/**
 * Direct browser→R2 multipart upload.
 *
 * Why: Railway $5 plan proxies upload bytes, double-hop = slow. Presign +
 * PUT direct to R2 means upload speed = your ISP only, no backend buffer.
 *
 * Flow:
 *   1. POST /api/jobs/presign-upload → {job_id, key, upload_id, parts:[{part_number,url}]}
 *   2. PUT each part's slice → R2 (in parallel, up to CONCURRENCY)
 *   3. Collect ETag header from each PUT response
 *   4. POST /api/jobs/from-r2 → backend completes upload + dispatches pipeline
 *
 * R2 bucket MUST have CORS:
 *   AllowedOrigins: [your frontend origin]
 *   AllowedMethods: [PUT]
 *   AllowedHeaders: ["*"]
 *   ExposeHeaders: ["ETag"]   ← critical, JS can't read ETag otherwise
 */
import api from '../api'

const CONCURRENCY = 6  // parallel part uploads — sweet spot for residential ISP

export interface PresignResp {
  job_id: string
  key: string
  upload_id: string
  part_size: number
  part_count: number
  parts: { part_number: number; url: string }[]
}

export interface UploadOptions {
  file: File
  onProgress?: (pct: number) => void
  signal?: AbortSignal
}

export interface CreateJobOptions {
  max_clips: number
  clip_types: string[]
  min_clip_duration: number
  max_clip_duration: number
  target_aspect_ratio: string
  custom_prompt?: string
}

interface PartResult {
  part_number: number
  etag: string
}

const PART_RETRY_ATTEMPTS = 4 // initial + 3 retries
const PART_RETRY_BASE_MS = 1000

async function uploadPartOnce(
  url: string,
  partNumber: number,
  blob: Blob,
  signal?: AbortSignal,
): Promise<PartResult> {
  const resp = await fetch(url, { method: 'PUT', body: blob, signal })
  if (!resp.ok) {
    throw new Error(`Part ${partNumber} upload failed: ${resp.status} ${resp.statusText}`)
  }
  const etag = resp.headers.get('ETag') || resp.headers.get('etag')
  if (!etag) {
    throw new Error(
      `Part ${partNumber}: ETag header missing. Check R2 CORS exposes ETag.`,
    )
  }
  return { part_number: partNumber, etag: etag.replace(/"/g, '') }
}

async function uploadPart(
  url: string,
  partNumber: number,
  blob: Blob,
  signal?: AbortSignal,
): Promise<PartResult> {
  let lastErr: Error | null = null
  for (let attempt = 1; attempt <= PART_RETRY_ATTEMPTS; attempt++) {
    try {
      return await uploadPartOnce(url, partNumber, blob, signal)
    } catch (e) {
      if (signal?.aborted) throw e
      lastErr = e as Error
      // Don't retry on CORS / config errors — they won't recover.
      if (lastErr.message.includes('ETag header missing')) throw lastErr
      if (attempt === PART_RETRY_ATTEMPTS) break
      // Exponential backoff: 1s → 2s → 4s.
      await new Promise((r) => setTimeout(r, PART_RETRY_BASE_MS * 2 ** (attempt - 1)))
    }
  }
  throw lastErr || new Error(`Part ${partNumber} failed after retries`)
}

/**
 * Upload file to R2 + create job. Returns {job_id} on success.
 */
export async function uploadAndCreateJob(
  upload: UploadOptions,
  job: CreateJobOptions,
): Promise<{ job_id: string }> {
  const { file, onProgress, signal } = upload

  // 1. Presign
  const { data: presign } = await api.post<PresignResp>('/api/jobs/presign-upload', {
    filename: file.name,
    content_type: file.type || 'video/mp4',
    size_bytes: file.size,
  })

  // 2. Upload parts in parallel batches
  const total = presign.parts.length
  const completed: PartResult[] = []
  const bytesPerPart = new Array(total).fill(0)
  const totalBytes = file.size

  const reportProgress = () => {
    if (!onProgress) return
    const done = bytesPerPart.reduce((a, b) => a + b, 0)
    onProgress(Math.min(99, Math.round((done / totalBytes) * 100)))
  }

  // Worker pool — pull next part from queue.
  const queue = [...presign.parts]
  const errors: Error[] = []

  const worker = async () => {
    while (queue.length > 0) {
      const part = queue.shift()
      if (!part) return
      const start = (part.part_number - 1) * presign.part_size
      const end = Math.min(start + presign.part_size, file.size)
      const slice = file.slice(start, end)
      try {
        const res = await uploadPart(part.url, part.part_number, slice, signal)
        completed.push(res)
        bytesPerPart[part.part_number - 1] = slice.size
        reportProgress()
      } catch (e) {
        errors.push(e as Error)
        // Drain queue to abort other workers cleanly.
        queue.length = 0
        throw e
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, total) }, () => worker())
  try {
    await Promise.all(workers)
  } catch (e) {
    // Best-effort abort on backend
    api.post('/api/jobs/abort-upload', {
      key: presign.key,
      upload_id: presign.upload_id,
    }).catch(() => {})
    throw errors[0] || e
  }

  // 3. Complete + dispatch
  const { data: created } = await api.post<{ job_id: string }>('/api/jobs/from-r2', {
    job_id: presign.job_id,
    key: presign.key,
    upload_id: presign.upload_id,
    parts: completed.map((p) => ({ part_number: p.part_number, etag: p.etag })),
    filename: file.name,
    ...job,
  })

  onProgress?.(100)
  return { job_id: created.job_id }
}
