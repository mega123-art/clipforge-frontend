import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'

interface ProgressStepperProps {
  currentStage: string
  stages: string[]
  stageLabels: Record<string, string>
}

export default function ProgressStepper({ currentStage, stages, stageLabels }: ProgressStepperProps) {
  const currentIndex = stages.indexOf(currentStage)
  const isReady = currentStage === 'ready'
  const lastIdx = stages.length - 1

  // Progress fill: 0 at start, 1 when ready. Active step = halfway through its segment.
  const progressPct = isReady
    ? 100
    : currentIndex < 0
      ? 0
      : (currentIndex / lastIdx) * 100 + (1 / lastIdx) * 50

  return (
    <div className="relative px-1 py-2">
      {/* ── Track + animated gradient fill ─────────────────── */}
      <div className="absolute left-5 right-5 top-6 h-[3px] rounded-full bg-forge-border/70 overflow-visible">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #34d399 0%, #8b5cf6 60%, #22d3ee 100%)',
            boxShadow: '0 0 12px rgba(139, 92, 246, 0.55), 0 0 24px rgba(34, 211, 238, 0.25)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 18, mass: 0.9 }}
        />

        {/* Travelling pulse dot on leading edge of fill */}
        {!isReady && currentIndex >= 0 && (
          <motion.div
            className="absolute -top-1 w-3 h-3 rounded-full bg-white shadow-glow-violet-sm"
            initial={{ left: '0%', opacity: 0 }}
            animate={{
              left: `${progressPct}%`,
              opacity: 1,
              scale: [1, 1.4, 1],
              boxShadow: [
                '0 0 8px rgba(139,92,246,0.8)',
                '0 0 22px rgba(139,92,246,1)',
                '0 0 8px rgba(139,92,246,0.8)',
              ],
            }}
            transition={{
              left: { type: 'spring', stiffness: 60, damping: 18 },
              scale: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
              boxShadow: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{ transform: 'translateX(-50%)' }}
          />
        )}
      </div>

      {/* ── Steps ──────────────────────────────────────────── */}
      <div className="relative flex justify-between">
        {stages.map((stage, i) => {
          const done = isReady || i < currentIndex
          const active = !isReady && i === currentIndex

          return (
            <div key={stage} className="flex flex-col items-center" style={{ width: 'fit-content' }}>
              {/* Circle */}
              <motion.div
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold z-10"
                animate={{
                  backgroundColor: done
                    ? 'rgb(16, 185, 129)'      // emerald-500
                    : active
                      ? 'rgb(139, 92, 246)'    // violet-500
                      : 'rgb(var(--c-card-hover))',
                  color: done || active ? '#ffffff' : 'rgb(var(--c-dim))',
                  scale: active ? 1.08 : 1,
                }}
                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              >
                {/* Aurora ring around active step */}
                {active && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        boxShadow:
                          '0 0 0 3px rgba(139,92,246,0.30), 0 0 24px rgba(139,92,246,0.55)',
                      }}
                      animate={{
                        boxShadow: [
                          '0 0 0 3px rgba(139,92,246,0.30), 0 0 18px rgba(139,92,246,0.45)',
                          '0 0 0 5px rgba(139,92,246,0.10), 0 0 36px rgba(139,92,246,0.70)',
                          '0 0 0 3px rgba(139,92,246,0.30), 0 0 18px rgba(139,92,246,0.45)',
                        ],
                      }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                      className="absolute -inset-2 rounded-full border border-violet-400/40"
                      animate={{ scale: [1, 1.5, 1.8], opacity: [0.6, 0.2, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                    />
                  </>
                )}

                <AnimatePresence mode="wait">
                  {done ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 16 }}
                    >
                      <Check size={15} strokeWidth={3} />
                    </motion.div>
                  ) : (
                    <motion.span
                      key="num"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                    >
                      {i + 1}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Label */}
              <motion.span
                className="mt-2.5 text-[11px] font-semibold whitespace-nowrap"
                animate={{
                  color: done
                    ? 'rgb(52, 211, 153)'    // emerald-400
                    : active
                      ? 'rgb(167, 139, 250)' // violet-400
                      : 'rgb(var(--c-dim))',
                }}
                transition={{ duration: 0.3 }}
              >
                {stageLabels[stage] || stage}
              </motion.span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
