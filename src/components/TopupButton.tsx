import { Zap } from 'lucide-react'
import { useSubscriptionModal } from '../hooks/useSubscriptionModal'
import useStore from '../store'

export default function TopupButton() {
  const user = useStore((s) => s.user)
  const { openTopup } = useSubscriptionModal()

  if (!user) return null

  return (
    <button
      onClick={() => openTopup()}
      title="Buy credits"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-forge-accent/45 bg-forge-accent/10 text-forge-accent hover:bg-forge-accent/20 transition-colors text-xs font-bold"
    >
      <Zap size={13} className="text-forge-accent" />
      <span>Topup</span>
    </button>
  )
}
