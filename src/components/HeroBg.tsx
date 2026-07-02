import { memo } from 'react'
import { motion } from 'framer-motion'

// Animated hero backdrop — conic aurora sweeps + drifting blobs + textures.
// Shared by the app hero (Home) and the marketing hero (Landing).
const HeroBg = memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">

    {/* Slow-rotating conic aurora sweep */}
    <motion.div
      className="absolute inset-0 origin-center"
      style={{
        background: [
          'conic-gradient(from 0deg at 25% 55%,',
          '  transparent 0deg,',
          '  rgba(6,182,212,0.09) 45deg,',
          '  rgba(20,184,166,0.07) 90deg,',
          '  transparent 140deg,',
          '  rgba(34,211,238,0.06) 210deg,',
          '  rgba(6,182,212,0.08) 255deg,',
          '  transparent 310deg,',
          '  rgba(16,185,129,0.05) 340deg,',
          '  transparent 360deg',
          ')',
        ].join(''),
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
    />

    {/* Second counter-rotating sweep — offset colors */}
    <motion.div
      className="absolute inset-0 origin-[70%_40%]"
      style={{
        background: [
          'conic-gradient(from 180deg at 70% 40%,',
          '  transparent 0deg,',
          '  rgba(20,184,166,0.06) 50deg,',
          '  transparent 110deg,',
          '  rgba(6,182,212,0.07) 190deg,',
          '  rgba(34,211,238,0.05) 230deg,',
          '  transparent 290deg,',
          '  rgba(16,185,129,0.04) 340deg,',
          '  transparent 360deg',
          ')',
        ].join(''),
      }}
      animate={{ rotate: -360 }}
      transition={{ duration: 38, repeat: Infinity, ease: 'linear' }}
    />

    {/* Blob 1 — top-left cyan */}
    <motion.div
      className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.16) 0%, transparent 68%)', filter: 'blur(55px)' }}
      animate={{ x: [0, 35, -15, 25, 0], y: [0, -25, 35, -15, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
    />

    {/* Blob 2 — bottom-right teal */}
    <motion.div
      className="absolute bottom-[-15%] right-[-5%] w-[50%] h-[55%] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.13) 0%, transparent 65%)', filter: 'blur(50px)' }}
      animate={{ x: [0, -30, 20, -10, 0], y: [0, 20, -30, 15, 0] }}
      transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
    />

    {/* Blob 3 — mid emerald accent */}
    <motion.div
      className="absolute top-[35%] left-[45%] w-[35%] h-[35%] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 65%)', filter: 'blur(45px)' }}
      animate={{ x: [0, -20, 30, -10, 20, 0], y: [0, 25, -15, 30, -10, 0], scale: [1, 1.15, 0.9, 1.08, 1] }}
      transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
    />

    {/* Blob 4 — small hot accent top-right */}
    <motion.div
      className="absolute top-[5%] right-[15%] w-[28%] h-[28%] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.11) 0%, transparent 65%)', filter: 'blur(35px)' }}
      animate={{ x: [0, 20, -25, 10, 0], y: [0, 30, -10, 25, 0] }}
      transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
    />

    {/* Dot grid */}
    <div
      className="absolute inset-0 opacity-[0.028]"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.85) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }}
    />

    {/* Diagonal line texture — ultra subtle */}
    <div
      className="absolute inset-0 opacity-[0.018]"
      style={{
        backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 40px)',
      }}
    />
  </div>
))

export default HeroBg
