import { useState } from 'react'
import { X, Plus, Trash2, Ban } from 'lucide-react'

export interface SkipRange {
  id: string
  startMin: number
  startSec: number
  endMin: number
  endSec: number
}

interface SkipTimestampsModalProps {
  initialRanges: SkipRange[]
  onConfirm: (ranges: SkipRange[]) => void
  onClose: () => void
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

const toSeconds = (min: number, sec: number) => min * 60 + sec

const newRow = (): SkipRange => ({
  id: Math.random().toString(36).slice(2),
  startMin: 0, startSec: 0, endMin: 0, endSec: 30,
})

export default function SkipTimestampsModal({ initialRanges, onConfirm, onClose }: SkipTimestampsModalProps) {
  const [rows, setRows] = useState<SkipRange[]>(
    initialRanges.length > 0 ? initialRanges : [newRow()]
  )

  const updateRow = (id: string, patch: Partial<SkipRange>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const removeRow = (id: string) => {
    setRows((rs) => rs.filter((r) => r.id !== id))
  }

  const addRow = () => setRows((rs) => [...rs, newRow()])

  const isInvalid = (r: SkipRange) => toSeconds(r.endMin, r.endSec) <= toSeconds(r.startMin, r.startSec)

  const handleConfirm = () => {
    const valid = rows.filter((r) => !isInvalid(r))
    onConfirm(valid)
  }

  const numInput = (
    value: number,
    onChange: (v: number) => void,
    max: number,
    label: string,
  ) => (
    <input
      type="number"
      min={0}
      max={max}
      value={value}
      onChange={(e) => onChange(clamp(parseInt(e.target.value, 10) || 0, 0, max))}
      aria-label={label}
      className="w-14 bg-forge-surface border border-forge-border rounded-lg px-2 py-1.5 text-sm text-forge-text text-center focus:outline-none focus:border-forge-accent/60 focus:ring-1 focus:ring-forge-accent/20"
    />
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-forge-card border border-forge-border rounded-2xl w-full max-w-lg p-6 space-y-5">

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-forge-text flex items-center gap-2">
            <Ban size={17} className="text-forge-accent" />
            Skip timestamps
          </h2>
          <button onClick={onClose} className="text-forge-muted hover:text-forge-text transition-colors">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-forge-muted">
          Ranges here are never used for clips — sponsor reads, intros, dead air, whatever you want the AI to ignore.
        </p>

        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {rows.map((r) => {
            const invalid = isInvalid(r)
            return (
              <div
                key={r.id}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${
                  invalid ? 'border-red-500/40 bg-red-500/5' : 'border-forge-border bg-forge-surface/50'
                }`}
              >
                <div className="flex items-center gap-1">
                  {numInput(r.startMin, (v) => updateRow(r.id, { startMin: v }), 999, 'Start minutes')}
                  <span className="text-forge-muted">:</span>
                  {numInput(r.startSec, (v) => updateRow(r.id, { startSec: v }), 59, 'Start seconds')}
                </div>
                <span className="text-forge-dim text-xs shrink-0">to</span>
                <div className="flex items-center gap-1">
                  {numInput(r.endMin, (v) => updateRow(r.id, { endMin: v }), 999, 'End minutes')}
                  <span className="text-forge-muted">:</span>
                  {numInput(r.endSec, (v) => updateRow(r.id, { endSec: v }), 59, 'End seconds')}
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(r.id)}
                  className="ml-auto text-forge-muted hover:text-red-400 transition-colors p-1"
                  aria-label="Remove range"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={addRow}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-forge-border text-sm text-forge-muted hover:text-forge-text hover:border-forge-border-bright transition-colors"
        >
          <Plus size={14} />
          Add another range
        </button>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-forge-border rounded-xl text-sm text-forge-muted hover:text-forge-text hover:border-forge-border-bright transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 bg-forge-accent hover:bg-forge-accent/85 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
