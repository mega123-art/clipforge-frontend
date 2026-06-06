import { useEffect, useState } from 'react'
import { Crown, X } from 'lucide-react'
import { useSubscriptionModal } from '../hooks/useSubscriptionModal'
import api from '../api'

interface SubscriptionInfo {
  status: string
}

export default function UpgradeBanner() {
  const [hasSubscription, setHasSubscription] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const { openSubscription } = useSubscriptionModal()

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        await api.get('/api/subscriptions/current')
        setHasSubscription(true)
      } catch {
        // No active subscription
        setHasSubscription(false)
      }
    }
    checkSubscription()
  }, [])

  if (dismissed || hasSubscription) return null

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-sm glass-card rounded-xl border border-forge-accent/30 bg-forge-accent/5 p-5 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Crown size={20} className="text-forge-accent flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm text-forge-text mb-1">Upgrade to Pro</h3>
            <p className="text-xs text-forge-text-muted mb-3">
              Get monthly credits, automatic renewals, and 50% bonus on Enterprise plan
            </p>
            <button
              onClick={openSubscription}
              className="text-xs font-bold text-forge-accent hover:text-forge-accent/80 transition-colors"
            >
              View Plans →
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-forge-text-muted hover:text-forge-text flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
