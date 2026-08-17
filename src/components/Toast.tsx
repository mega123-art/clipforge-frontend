import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

interface ToastContextValue {
  push: (kind: ToastKind, message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

// Lets non-component code (axios interceptor) raise a toast without a hook.
// Set once ToastProvider mounts; calls before that (rare) are dropped.
let globalPush: ((kind: ToastKind, message: string) => void) | null = null

export const toast = {
  success: (message: string) => globalPush?.('success', message),
  error: (message: string) => globalPush?.('error', message),
  info: (message: string) => globalPush?.('info', message),
}

const ICONS: Record<ToastKind, typeof Info> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
}

// Amber for errors, not red — a failed export isn't an emergency.
const ACCENTS: Record<ToastKind, string> = {
  success: 'text-forge-cyan',
  error: 'text-forge-gold',
  info: 'text-forge-accent',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++
      setItems((prev) => [...prev, { id, kind, message }])
      window.setTimeout(() => dismiss(id), 5000)
    },
    [dismiss]
  )

  useEffect(() => {
    globalPush = push
    return () => {
      globalPush = null
    }
  }, [push])

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm">
        <AnimatePresence>
          {items.map((t) => {
            const Icon = ICONS[t.kind]
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                transition={{ duration: 0.2 }}
                role="status"
                className="flex items-start gap-2.5 rounded-xl bg-forge-card border border-forge-border shadow-card px-4 py-3 text-sm text-forge-text"
              >
                <Icon size={18} className={`shrink-0 mt-0.5 ${ACCENTS[t.kind]}`} />
                <p className="flex-1 leading-snug">{t.message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="shrink-0 text-forge-subtext hover:text-forge-text transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return {
    success: (message: string) => ctx.push('success', message),
    error: (message: string) => ctx.push('error', message),
    info: (message: string) => ctx.push('info', message),
  }
}
