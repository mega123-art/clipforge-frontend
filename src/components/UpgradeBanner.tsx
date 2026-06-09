import { useEffect, useState } from 'react'
import { Crown, X, TrendingUp, Zap, Star } from 'lucide-react'
import { useSubscriptionModal } from '../hooks/useSubscriptionModal'
import api from '../api'

type Tier = 'none' | 'Starter' | 'Pro' | 'Professional' | 'Enterprise'

interface BannerConfig {
  icon: React.ReactNode
  title: string
  body: string
  cta: string
  accent: string
  border: string
  bg: string
}

const CONFIGS: Record<Exclude<Tier, 'Enterprise'>, BannerConfig> = {
  none: {
    icon: <Crown size={18} className="text-forge-accent flex-shrink-0 mt-0.5" />,
    title: 'Unlock monthly credits',
    body: 'Subscribe to any plan for automatic monthly credits and never run out mid-project.',
    cta: 'View Plans →',
    accent: 'text-forge-accent',
    border: 'border-forge-accent/30',
    bg: 'bg-forge-accent/5',
  },
  Starter: {
    icon: <TrendingUp size={18} className="text-cyan-400 flex-shrink-0 mt-0.5" />,
    title: 'Upgrade from Starter',
    body: 'Pro gives you more clips per job, higher monthly credits, and faster queue priority.',
    cta: 'Upgrade to Pro →',
    accent: 'text-cyan-400',
    border: 'border-cyan-400/30',
    bg: 'bg-cyan-400/5',
  },
  Pro: {
    icon: <Zap size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />,
    title: 'You\'re on Pro',
    body: 'Professional unlocks even more monthly credits, higher clip limits, and 1080p as standard.',
    cta: 'Upgrade to Professional →',
    accent: 'text-amber-400',
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/5',
  },
  Professional: {
    icon: <Star size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />,
    title: 'One tier above you',
    body: 'Enterprise adds a 50% credit bonus, priority processing, and dedicated support.',
    cta: 'Upgrade to Enterprise →',
    accent: 'text-orange-400',
    border: 'border-orange-400/30',
    bg: 'bg-orange-400/5',
  },
}

export default function UpgradeBanner() {
  const [tier, setTier] = useState<Tier | null>(null)  // null = loading
  const [dismissed, setDismissed] = useState(false)
  const { openSubscription } = useSubscriptionModal()

  useEffect(() => {
    const check = async () => {
      try {
        const res = await api.get('/api/subscriptions/current')
        const name = res.data?.tier_name as string | undefined
        if (name === 'Starter' || name === 'Pro' || name === 'Professional' || name === 'Enterprise') {
          setTier(name)
        } else {
          setTier('none')
        }
      } catch {
        setTier('none')
      }
    }
    check()
  }, [])

  // still loading or already on Enterprise or dismissed
  if (tier === null || tier === 'Enterprise' || dismissed) return null

  const cfg = CONFIGS[tier]

  return (
    <div className={`fixed bottom-6 right-6 z-40 max-w-sm glass-card rounded-xl border ${cfg.border} ${cfg.bg} p-5 shadow-lg`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {cfg.icon}
          <div>
            <h3 className="font-bold text-sm text-forge-text mb-1">{cfg.title}</h3>
            <p className="text-xs text-forge-muted mb-3">{cfg.body}</p>
            <button
              onClick={openSubscription}
              className={`text-xs font-bold ${cfg.accent} hover:opacity-80 transition-opacity`}
            >
              {cfg.cta}
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-forge-muted hover:text-forge-text flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
