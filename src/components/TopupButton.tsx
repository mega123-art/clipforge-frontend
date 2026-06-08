import { Zap } from 'lucide-react'
import { useSubscriptionModal } from '../hooks/useSubscriptionModal'
import useStore from '../store'

interface TopupButtonProps {
  onSuccess?: () => void
}

export default function TopupButton({ onSuccess }: TopupButtonProps) {
  const user = useStore((s) => s.user)
  const { openTopup } = useSubscriptionModal((s) => ({
    openTopup: s.openTopup
  }))

  if (!user) return null

  const handleClick = () => {
    useSubscriptionModal.setState({ onPaymentSuccess: onSuccess })
    openTopup()
  }

  return (
    <button
      onClick={handleClick}
      title="Buy credits"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-forge-accent/45 bg-forge-accent/10 text-forge-accent hover:bg-forge-accent/20 transition-colors text-xs font-bold"
    >
      <Zap size={13} className="text-forge-accent" />
      <span>Topup</span>
    </button>
  )
}
