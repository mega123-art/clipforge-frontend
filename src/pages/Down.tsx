import { motion } from 'framer-motion'
import { Clock3, RefreshCw, Wrench } from 'lucide-react'
import VibeClipLogo from '../components/VibeClipLogo'

const CHECKS = [
  'Restoring clip analysis',
  'Checking payment rails',
  'Bringing workers back online',
]

export default function Down() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-forge-bg px-5 py-8 text-forge-text">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="scanlines-overlay opacity-40" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="mb-10 flex items-center justify-center"
        >
          <VibeClipLogo size="lg" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.08 }}
          className="glass-card relative w-full max-w-3xl rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14"
        >
          <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-400/10 shadow-[0_0_50px_rgba(6,182,212,0.18)]">
            <Wrench className="h-9 w-9 text-cyan-200" />
          </div>

          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-amber-200">
            <span className="pulse-dot bg-amber-300" />
            Maintenance mode
          </p>

          <h1 className="mx-auto max-w-2xl text-4xl font-black leading-tight tracking-tight text-white sm:text-6xl">
            We are down rn.
            <span className="gradient-text block">We will be back soon.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-forge-subtext sm:text-lg">
            VibeClip is taking a quick systems break while we fix the pipeline.
            Your patience helps us bring the editor back cleaner and faster.
          </p>

          <div className="mt-9 grid gap-3 sm:grid-cols-3">
            {CHECKS.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 + index * 0.08, duration: 0.35 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-200">
                  {index === 0 ? <RefreshCw className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                </div>
                <p className="text-sm font-semibold text-white">{item}</p>
              </motion.div>
            ))}
          </div>

          <div className="mx-auto mt-10 h-2 max-w-md overflow-hidden rounded-full bg-white/10">
            <div className="cyan-shimmer-bar h-full w-2/3 rounded-full" />
          </div>

          <p className="mt-5 text-sm text-forge-muted">
            Please check back in a little while.
          </p>
        </motion.div>
      </section>
    </main>
  )
}
