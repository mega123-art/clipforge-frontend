import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Crown, X, TrendingUp, Zap, Star } from 'lucide-react'
import { useSubscriptionModal } from '../hooks/useSubscriptionModal'
import useStore from '../store'
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

// Marketing/auth pages: never show the upsell popup there.
const HIDDEN_PATHS = ['/', '/signin', '/signup', '/verify-email', '/down']

const DISMISS_KEY = 'upgrade-banner-dismissed-at'
const DISMISS_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000  // dismissed = quiet for 3 days
const SHOW_DELAY_MS = 15000  // let the user actually use the app first

const isSnoozed = () => {
  const at = Number(localStorage.getItem(DISMISS_KEY) || 0)
  return at > 0 && Date.now() - at < DISMISS_COOLDOWN_MS
}

export default function UpgradeBanner() {
  const [tier, setTier] = useState<Tier | null>(null)  // null = loading
  const [dismissed, setDismissed] = useState(isSnoozed)
  const [settled, setSettled] = useState(false)  // don't pop over first paint
  const { openSubscription } = useSubscriptionModal()
  const token = useStore((s) => s.token)
  const { pathname } = useLocation()

  useEffect(() => {
    const t = window.setTimeout(() => setSettled(true), SHOW_DELAY_MS)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!token) return
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
  }, [token])

  // logged out, marketing/auth page, still loading, Enterprise, dismissed, or too early
  if (!token || HIDDEN_PATHS.includes(pathname) || tier === null || tier === 'Enterprise' || dismissed || !settled) return null

  const cfg = CONFIGS[tier]

  return (
    <div className={`fixed bottom-4 inset-x-4 sm:inset-x-auto sm:bottom-6 sm:right-6 z-40 sm:max-w-sm glass-card rounded-xl border ${cfg.border} ${cfg.bg} p-5 shadow-lg`}>
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
          onClick={() => { localStorage.setItem(DISMISS_KEY, String(Date.now())); setDismissed(true) }}
          className="text-forge-muted hover:text-forge-text flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
