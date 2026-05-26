import { useRef, useState, ChangeEvent, DragEvent } from 'react'
import { Upload, X, FileVideo, CloudUpload } from 'lucide-react'

interface URLInputProps {
  onFileSelect: (file: File | null) => void
  uploadedFile: File | null
}

const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024

export default function URLInput({ onFileSelect, uploadedFile }: URLInputProps) {
  const [dragOver, setDragOver] = useState(false)
  const [sizeError, setSizeError] = useState<string | null>(null)
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

  return (
    <div className="p-4">
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
      {sizeError && (
        <p className="text-xs text-red-400 px-1 mt-2">{sizeError}</p>
      )}
    </div>
  )
}
