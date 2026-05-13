import { useRef, useState } from 'react'
import { Link2, Upload, X, FileVideo, CloudUpload } from 'lucide-react'

export default function URLInput({ value, onChange, onFileSelect, uploadedFile }) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) onFileSelect(file)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) onFileSelect(file)
  }

  const clearFile = () => {
    onFileSelect(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-3 p-4">
      {/* URL input */}
      <div className="flex items-center gap-3 bg-forge-surface/70 rounded-xl px-4 py-3.5 transition-all border border-forge-border focus-within:border-violet-500/50 focus-within:bg-forge-surface">
        <Link2 size={15} className="text-forge-dim shrink-0" />
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste YouTube, Spotify, or any video URL..."
          className="flex-1 bg-transparent outline-none text-forge-text placeholder-forge-dim text-sm"
        />
        {value && (
          <button type="button" onClick={() => onChange('')} className="cursor-pointer">
            <X size={14} className="text-forge-muted hover:text-forge-text transition-colors" />
          </button>
        )}
      </div>

      {/* Or separator */}
      <div className="flex items-center gap-3 text-forge-dim text-xs">
        <div className="flex-1 h-px bg-forge-border" />
        <span className="font-medium">or upload</span>
        <div className="flex-1 h-px bg-forge-border" />
      </div>

      {/* Drop zone */}
      {uploadedFile ? (
        <div className="flex items-center gap-3 px-4 py-3.5 bg-violet-500/10 border border-violet-500/40 rounded-xl">
          <FileVideo size={16} className="text-violet-400 shrink-0" />
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
              ? 'border-violet-500/65 bg-violet-500/12 shadow-glow-violet-sm'
              : 'border-forge-border hover:border-forge-border-bright hover:bg-forge-surface/40'
          }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
            dragOver
              ? 'bg-violet-500/25 border border-violet-500/50 shadow-glow-violet-sm'
              : 'bg-forge-surface border border-forge-border'
          }`}>
            {dragOver
              ? <CloudUpload size={22} className="text-violet-400 animate-bounce" />
              : <Upload size={20} className="text-forge-muted" />
            }
          </div>
          <div className="text-center">
            <p className="text-sm text-forge-subtext">
              {dragOver ? 'Drop to upload' : (
                <>Drop file or <span className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">browse</span></>
              )}
            </p>
            <p className="text-xs text-forge-dim mt-0.5">MP4, MOV, MP3, M4A · up to 2GB</p>
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
    </div>
  )
}
