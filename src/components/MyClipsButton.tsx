import { useLocation, useNavigate } from 'react-router-dom'
import { Clapperboard } from 'lucide-react'
import useStore from '../store'

export default function MyClipsButton() {
  const { user } = useStore()
  const navigate = useNavigate()
  const location = useLocation()

  if (!user) return null

  const active = location.pathname.startsWith('/clips')

  return (
    <button
      type="button"
      onClick={() => navigate('/clips')}
      title="My Clips"
      className={`flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-full border text-xs font-bold transition-colors cursor-pointer ${
        active
          ? 'border-forge-accent/50 bg-forge-accent/10 text-forge-accent'
          : 'border-forge-border text-forge-subtext hover:border-forge-border-bright hover:text-forge-text'
      }`}
    >
      <Clapperboard size={14} className="shrink-0" />
      <span className="hidden sm:inline">My Clips</span>
    </button>
  )
}
