import { Sparkles, LucideIcon } from 'lucide-react'

interface MetaballLoaderProps {
  icon?: LucideIcon
}

export default function MetaballLoader({ icon: Icon = Sparkles }: MetaballLoaderProps) {
  return (
    <div className="metaball-stage">
      {/* SVG goo filter */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="goo-filter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 22 -9"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {/* Blobs */}
      <div className="metaball-canvas">
        <div className="blob blob-core" />
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="blob blob-4" />
        <div className="blob blob-5" />
        <div className="blob blob-6" />
        <div className="blob blob-7" />
        <div className="blob blob-8" />
      </div>

      {/* Outer spinning ring */}
      <div className="metaball-ring" aria-hidden="true" />

      {/* Icon overlay */}
      <div className="metaball-icon">
        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-2xl">
          <Icon size={26} className="text-white drop-shadow-lg" />
        </div>
      </div>
    </div>
  )
}
