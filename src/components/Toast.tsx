import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'

interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastItem {
  id: number
  kind: ToastKind
  message: string
  action?: ToastAction
}

interface ToastContextValue {
  push: (kind: ToastKind, message: string, action?: ToastAction) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

// Lets non-component code (axios interceptor) raise a toast without a hook.
// Set once ToastProvider mounts; calls before that (rare) are dropped.
let globalPush: ((kind: ToastKind, message: string, action?: ToastAction) => void) | null = null

export const toast = {
  success: (message: string, action?: ToastAction) => globalPush?.('success', message, action),
  error: (message: string, action?: ToastAction) => globalPush?.('error', message, action),
  info: (message: string, action?: ToastAction) => globalPush?.('info', message, action),
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
    (kind: ToastKind, message: string, action?: ToastAction) => {
      const id = nextId.current++
      setItems((prev) => [...prev, { id, kind, message, action }])
      // Actionable toasts (e.g. "Top up") stay until the user deals with them.
      if (!action) window.setTimeout(() => dismiss(id), 5000)
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
                <div className="flex-1 min-w-0">
                  <p className="leading-snug">{t.message}</p>
                  {t.action && (
                    <button
                      type="button"
                      onClick={() => {
                        t.action?.onClick()
                        dismiss(t.id)
                      }}
                      className="mt-1.5 text-xs font-semibold text-forge-accent hover:text-forge-accent-light transition-colors cursor-pointer"
                    >
                      {t.action.label}
                    </button>
                  )}
                </div>
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
    success: (message: string, action?: ToastAction) => ctx.push('success', message, action),
    error: (message: string, action?: ToastAction) => ctx.push('error', message, action),
    info: (message: string, action?: ToastAction) => ctx.push('info', message, action),
  }
}
