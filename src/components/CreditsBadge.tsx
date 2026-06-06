import { useEffect, useState } from 'react'
import { Coins, Crown } from 'lucide-react'
import useStore from '../store'
import api from '../api'

interface CreditBreakdown {
  subscription_credits: number
  subscription_tier: string | null
  subscription_status: string | null
  topup_credits: number
  total: number
  next_billing_date: string | null
}

export default function CreditsBadge() {
  const user = useStore((s) => s.user)
  const [breakdown, setBreakdown] = useState<CreditBreakdown | null>(null)

  useEffect(() => {
    if (!user) return
    api.get('/api/subscriptions/breakdown').catch(() => {})
      .then((res) => setBreakdown(res?.data))
  }, [user])

  if (!user) return null

  const total = breakdown?.total ?? user.credits ?? 0
  const low = total <= 2
  const tier = breakdown?.subscription_tier
  const hasSub = breakdown?.subscription_status === 'active'

  return (
    <div
      title={low ? 'Low balance — buy credits' : `${total} credits available${tier ? ` (${tier})` : ''}`}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold cursor-default transition-colors ${
        hasSub
          ? 'border-forge-accent/45 bg-forge-accent/10 text-forge-accent'
          : low
            ? 'border-amber-500/45 bg-amber-500/10 text-amber-400'
            : 'border-forge-accent/30 bg-forge-accent/10 text-forge-accent'
      }`}
    >
      {hasSub ? (
        <Crown size={13} className="text-forge-accent" />
      ) : (
        <Coins size={13} className={low ? 'text-amber-400' : 'text-forge-accent'} />
      )}
      <span className="tabular-nums">{total}</span>
    </div>
  )
}
