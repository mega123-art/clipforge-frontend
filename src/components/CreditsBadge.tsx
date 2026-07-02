import { useEffect, useState } from 'react'
import { Coins, Plus } from 'lucide-react'
import { useSubscriptionModal } from '../hooks/useSubscriptionModal'
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

interface CreditsBadgeProps {
  /** Called after a successful top-up payment (e.g. to refetch a job). */
  onTopupSuccess?: () => void
}

// Credits pill doubles as the top-up entry point — one control instead of two.
export default function CreditsBadge({ onTopupSuccess }: CreditsBadgeProps) {
  const user = useStore((s) => s.user)
  const [breakdown, setBreakdown] = useState<CreditBreakdown | null>(null)
  const { openTopup } = useSubscriptionModal((s) => ({ openTopup: s.openTopup }))

  useEffect(() => {
    if (!user) return
    api.get('/api/subscriptions/breakdown')
      .then((res) => setBreakdown(res.data))
      .catch(() => {})
  }, [user])

  if (!user) return null

  const total = breakdown?.total ?? user.credits ?? 0
  const low = total <= 2

  const handleClick = () => {
    useSubscriptionModal.setState({ onPaymentSuccess: onTopupSuccess })
    openTopup()
  }

  return (
    <button
      onClick={handleClick}
      title={low ? 'Low balance — buy credits' : `${total} credits · buy more`}
      className="group flex items-center h-9 gap-1.5 pl-3 pr-2 rounded-full border border-forge-border bg-forge-surface/60 text-xs font-semibold text-forge-subtext hover:text-forge-text hover:border-forge-border-bright transition-colors cursor-pointer"
    >
      <Coins size={13} className={low ? 'text-amber-400' : 'text-forge-muted group-hover:text-forge-accent transition-colors'} />
      <span className={`tabular-nums ${low ? 'text-amber-400' : ''}`}>{total}</span>
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-forge-card border border-forge-border text-forge-muted group-hover:text-forge-accent group-hover:border-forge-accent/40 transition-colors">
        <Plus size={11} />
      </span>
    </button>
  )
}
