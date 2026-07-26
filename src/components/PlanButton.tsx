import { Crown } from 'lucide-react'
import { useSubscriptionModal } from '../hooks/useSubscriptionModal'
import useStore from '../store'
import { useCreditBreakdown } from '../hooks/useCreditBreakdown'

// Unsubscribed: the single solid-accent CTA in the nav. Subscribed: quiet ghost pill.
export default function PlanButton() {
  const user = useStore((s) => s.user)
  const { openSubscription } = useSubscriptionModal()
  const { data: subInfo } = useCreditBreakdown()

  if (!user) return null

  const isActive = subInfo?.subscription_status === 'active'

  if (isActive) {
    return (
      <button
        onClick={() => openSubscription()}
        title="Manage subscription"
        className="flex items-center h-9 gap-1.5 px-3.5 rounded-full border border-forge-border bg-forge-surface/60 text-xs font-semibold text-forge-subtext hover:text-forge-text hover:border-forge-border-bright transition-colors cursor-pointer"
      >
        <Crown size={13} className="text-forge-accent" />
        <span>{subInfo?.subscription_tier || 'Plan'}</span>
      </button>
    )
  }

  return (
    <button
      onClick={() => openSubscription()}
      title="Get premium plan"
      className="flex items-center h-9 gap-1.5 px-4 rounded-full bg-forge-accent text-white text-xs font-bold shadow-[0_0_16px_rgba(6,182,212,0.35)] hover:shadow-[0_0_24px_rgba(6,182,212,0.5)] hover:brightness-110 transition-all cursor-pointer"
    >
      <Crown size={13} />
      <span>Upgrade</span>
    </button>
  )
}
