import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User as UserIcon, ChevronDown, Coins, ShieldCheck } from 'lucide-react'
import useStore from '../store'

export default function UserMenu() {
  const { user, logout } = useStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!user) return null

  const initial = (user.name || user.email || '?').trim().charAt(0).toUpperCase()

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-forge-border hover:border-forge-border-bright bg-forge-surface hover:bg-forge-card-hover transition-all cursor-pointer"
      >
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            {initial}
          </div>
        )}
        <span className="text-xs font-semibold text-forge-text max-w-[120px] truncate">
          {user.name || user.email.split('@')[0]}
        </span>
        <ChevronDown size={12} className="text-forge-muted" />
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-56 glass-card rounded-xl border border-forge-border shadow-card-hover overflow-hidden z-30 animate-fade-in">
          <div className="px-3.5 py-3 border-b border-forge-border">
            <p className="text-xs text-forge-dim">Signed in as</p>
            <p className="text-sm font-bold text-forge-text truncate">{user.email}</p>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs">
              <Coins size={11} className="text-violet-400" />
              <span className="font-bold text-violet-300 tabular-nums">{user.credits ?? 0}</span>
              <span className="text-forge-dim">credits</span>
            </div>
          </div>
          <button
            onClick={() => { setOpen(false); navigate('/') }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-forge-subtext hover:bg-forge-card-hover hover:text-forge-text transition-colors cursor-pointer"
          >
            <UserIcon size={14} />
            My Clips
          </button>
          {user.is_admin && (
            <button
              onClick={() => { setOpen(false); navigate('/admin') }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer border-t border-forge-border"
            >
              <ShieldCheck size={14} />
              Admin Panel
            </button>
          )}
          <button
            onClick={() => { logout(); navigate('/signin') }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer border-t border-forge-border"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
