import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Coins, ShieldCheck, CreditCard, Gift, Copy, Check } from 'lucide-react'
import useStore from '../store'
import { useReferral } from '../hooks/queries'

export default function UserMenu() {
  const { user, logout } = useStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  // Only fetched once the menu is opened; shared with Home's referral card.
  const { data: referral } = useReferral({ enabled: open })
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!user) return null

  const initial = (user.name || user.email || '?').trim().charAt(0).toUpperCase()
  const referralCode = referral?.referral_code || user.referral_code || ''
  const referralLink = referralCode ? `${window.location.origin}/signup?ref=${encodeURIComponent(referralCode)}` : ''

  const copyReferralLink = async () => {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title={user.name || user.email}
        className={`flex items-center justify-center w-9 h-9 rounded-full border transition-colors cursor-pointer ${
          open ? 'border-forge-accent/60' : 'border-forge-border hover:border-forge-border-bright'
        }`}
      >
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-forge-accent to-teal-600 flex items-center justify-center text-white text-xs font-bold">
            {initial}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-64 glass-card rounded-xl border border-forge-border shadow-card-hover overflow-hidden z-30 animate-fade-in">
          <div className="px-3.5 py-3 border-b border-forge-border">
            <p className="text-xs text-forge-dim">Signed in as</p>
            <p className="text-sm font-bold text-forge-text truncate">{user.email}</p>
            <div className="flex items-center justify-between mt-2 text-xs">
              <div className="flex items-center gap-1.5">
                <Coins size={11} className="text-forge-accent" />
                <span className="font-bold text-forge-accent tabular-nums">{user.credits ?? 0}</span>
                <span className="text-forge-dim">credits</span>
              </div>
              {user.subscription_tier_name && (
                <span className="text-[10px] font-bold text-forge-accent bg-forge-accent/10 border border-forge-accent/25 px-1.5 py-0.5 rounded">
                  {user.subscription_tier_name}
                </span>
              )}
            </div>
          </div>
          <div className="px-3.5 py-3 border-b border-forge-border bg-forge-accent/5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-forge-text">
                <Gift size={13} className="text-forge-accent" />
                Refer and earn
              </div>
              <span className="text-[10px] font-bold text-forge-accent bg-forge-accent/10 border border-forge-accent/25 px-1.5 py-0.5 rounded">
                +2 credits
              </span>
            </div>
            <p className="text-[11px] leading-4 text-forge-muted mb-2">
              Friends get 3 credits. You get 2 credits after they sign up.
            </p>
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1 rounded-lg border border-forge-border bg-forge-surface px-2.5 py-1.5">
                <p className="truncate font-mono text-[11px] font-bold tracking-wide text-forge-text">
                  {referralCode || 'Loading...'}
                </p>
              </div>
              <button
                type="button"
                onClick={copyReferralLink}
                disabled={!referralLink}
                className="shrink-0 rounded-lg border border-forge-border bg-forge-surface p-2 text-forge-muted hover:text-forge-text hover:bg-forge-card-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Copy referral link"
              >
                {copied ? <Check size={13} className="text-forge-accent" /> : <Copy size={13} />}
              </button>
            </div>
            {referral && (
              <p className="mt-2 text-[10px] text-forge-dim">
                {referral.successful_referrals} referral{referral.successful_referrals === 1 ? '' : 's'} · {referral.credits_earned} credits earned
              </p>
            )}
          </div>
          <button
            onClick={() => { setOpen(false); navigate('/billing') }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-forge-subtext hover:bg-forge-card-hover hover:text-forge-text transition-colors cursor-pointer"
          >
            <CreditCard size={14} />
            Billing
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
