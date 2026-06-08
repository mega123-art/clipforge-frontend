import { useRef, useState, ChangeEvent, DragEvent } from 'react'
import { Upload, X, FileVideo, CloudUpload, Link, Youtube } from 'lucide-react'

interface URLInputProps {
  onFileSelect: (file: File | null) => void
  uploadedFile: File | null
  onYoutubeUrl?: (url: string) => void
  youtubeUrl?: string
}

const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024

function isYoutubeUrl(s: string) {
  return /(?:youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts\/)/.test(s)
}

export default function URLInput({ onFileSelect, uploadedFile, onYoutubeUrl, youtubeUrl }: URLInputProps) {
  const [tab, setTab] = useState<'file' | 'url'>('url')
  const [dragOver, setDragOver] = useState(false)
  const [sizeError, setSizeError] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState(youtubeUrl ?? '')
  const [urlError, setUrlError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const tryAccept = (file: File | undefined | null) => {
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      const gb = (file.size / (1024 * 1024 * 1024)).toFixed(2)
      setSizeError(`File is ${gb} GB. Max is 2 GB.`)
      return
    }
    setSizeError(null)
    onFileSelect(file)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    tryAccept(e.dataTransfer.files[0])
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    tryAccept(e.target.files?.[0])
  }

  const clearFile = () => {
    onFileSelect(null)
    setSizeError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleUrlChange = (val: string) => {
    setUrlInput(val)
    setUrlError(null)
    if (val.trim() && !isYoutubeUrl(val.trim())) {
      setUrlError('Enter a valid YouTube URL')
      onYoutubeUrl?.('')
    } else {
      onYoutubeUrl?.(val.trim())
    }
  }

  return (
    <div className="p-4">
      {/* Tabs */}
      <div className="flex gap-1 p-0.5 bg-forge-surface rounded-xl border border-forge-border mb-4">
        <button
          type="button"
          onClick={() => { setTab('url'); onFileSelect(null) }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            tab === 'url'
              ? 'bg-forge-card border border-forge-border-bright text-forge-text shadow-sm'
              : 'text-forge-muted hover:text-forge-text'
          }`}
        >
          <Youtube size={13} />
          YouTube URL
        </button>
        <button
          type="button"
          onClick={() => { setTab('file'); onYoutubeUrl?.('') }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            tab === 'file'
              ? 'bg-forge-card border border-forge-border-bright text-forge-text shadow-sm'
              : 'text-forge-muted hover:text-forge-text'
          }`}
        >
          <Upload size={13} />
          Upload File
        </button>
      </div>

      {tab === 'url' && (
        <div>
          <div className="flex items-center gap-2 px-3.5 py-3 bg-forge-surface border border-forge-border rounded-xl focus-within:border-forge-accent/60 focus-within:ring-1 focus-within:ring-forge-accent/20 transition-all">
            <Link size={15} className="text-forge-muted shrink-0" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="flex-1 bg-transparent text-sm text-forge-text placeholder:text-forge-dim outline-none"
            />
            {urlInput && (
              <button type="button" onClick={() => { setUrlInput(''); onYoutubeUrl?.('') }}>
                <X size={13} className="text-forge-muted hover:text-forge-text transition-colors" />
              </button>
            )}
          </div>
          {urlError && <p className="text-xs text-red-400 px-1 mt-2">{urlError}</p>}
        </div>
      )}

      {tab === 'file' && (
        <>
          {uploadedFile ? (
            <div className="flex items-center gap-3 px-4 py-3.5 bg-forge-accent/10 border border-forge-accent/40 rounded-xl">
              <FileVideo size={16} className="text-forge-accent shrink-0" />
              <span className="text-sm text-forge-subtext flex-1 truncate">{uploadedFile.name}</span>
              <button type="button" onClick={clearFile} className="cursor-pointer">
                <X size={14} className="text-forge-muted hover:text-forge-text transition-colors" />
              </button>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => inputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 px-4 py-8 border border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                dragOver
                  ? 'border-forge-accent/65 bg-forge-accent/8 shadow-glow-violet-sm'
                  : 'border-forge-border hover:border-forge-border-bright hover:bg-forge-surface/40'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                dragOver
                  ? 'bg-forge-accent/20 border border-forge-accent/50 shadow-glow-violet-sm'
                  : 'bg-forge-surface border border-forge-border'
              }`}>
                {dragOver
                  ? <CloudUpload size={22} className="text-forge-accent animate-bounce" />
                  : <Upload size={20} className="text-forge-muted" />
                }
              </div>
              <div className="text-center">
                <p className="text-sm text-forge-subtext">
                  {dragOver ? 'Drop to upload' : (
                    <>Drop file or <span className="text-forge-accent font-semibold">browse</span></>
                  )}
                </p>
                <p className="text-xs text-forge-dim mt-0.5">MP4, MOV, MP3, M4A · up to 2 GB</p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="video/*,audio/*,.mp4,.mov,.mp3,.m4a,.wav"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}
          {sizeError && <p className="text-xs text-red-400 px-1 mt-2">{sizeError}</p>}
        </>
      )}
    </div>
  )
}
