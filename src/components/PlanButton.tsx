import { Crown } from 'lucide-react'
import { useSubscriptionModal } from '../hooks/useSubscriptionModal'
import useStore from '../store'
import { useEffect, useState } from 'react'
import api from '../api'

interface SubscriptionInfo {
  subscription_status: string | null
  subscription_tier: string | null
}

export default function PlanButton() {
  const user = useStore((s) => s.user)
  const { openSubscription } = useSubscriptionModal()
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null)

  useEffect(() => {
    if (!user) return
    api.get('/api/subscriptions/breakdown').catch(() => {})
      .then((res) => {
        if (res?.data) {
          setSubInfo({
            subscription_status: res.data.subscription_status,
            subscription_tier: res.data.subscription_tier,
          })
        }
      })
  }, [user])

  if (!user) return null

  const isActive = subInfo?.subscription_status === 'active'

  return (
    <button
      onClick={() => openSubscription()}
      title={isActive ? 'Manage subscription' : 'Get premium plan'}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors text-xs font-bold ${
        isActive
          ? 'border-forge-accent/45 bg-forge-accent/10 text-forge-accent hover:bg-forge-accent/20'
          : 'border-amber-500/45 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
      }`}
    >
      <Crown size={13} className={isActive ? 'text-forge-accent' : 'text-amber-400'} />
      <span>{isActive ? 'Plan' : 'Upgrade'}</span>
    </button>
  )
}
