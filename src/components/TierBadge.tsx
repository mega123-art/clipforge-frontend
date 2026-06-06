import { Crown, Zap, Sparkles, Rocket } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface TierBadgeProps {
  tier: string | null | undefined
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const TIER_CONFIG: Record<string, { icon: LucideIcon; color: string; bg: string; border: string }> = {
  'Starter': {
    icon: Zap,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  'Pro': {
    icon: Sparkles,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
  },
  'Professional': {
    icon: Rocket,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
  },
  'Enterprise': {
    icon: Crown,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
  },
}

export default function TierBadge({ tier, size = 'sm', showLabel = true }: TierBadgeProps) {
  if (!tier) return null

  const config = TIER_CONFIG[tier]
  if (!config) return null

  const Icon = config.icon

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  }

  return (
    <div className={`flex items-center gap-1.5 rounded-full border ${config.bg} ${config.border} font-bold ${sizeClasses[size]}`}>
      <Icon size={iconSizes[size]} className={config.color} />
      {showLabel && <span className={config.color}>{tier}</span>}
    </div>
  )
}
