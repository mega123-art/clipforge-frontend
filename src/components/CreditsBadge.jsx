import { Coins } from 'lucide-react'
import useStore from '../store'

export default function CreditsBadge() {
  const user = useStore((s) => s.user)
  if (!user) return null

  const credits = user.credits ?? 0
  const low = credits <= 2

  return (
    <div
      title={low ? 'Low balance — ask an admin for more credits' : `${credits} credits available`}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold cursor-default transition-colors ${
        low
          ? 'border-amber-500/45 bg-amber-500/10 text-amber-400'
          : 'border-violet-500/35 bg-violet-500/10 text-violet-300'
      }`}
    >
      <Coins size={13} className={low ? 'text-amber-400' : 'text-violet-400'} />
      <span className="tabular-nums">{credits}</span>
    </div>
  )
}
