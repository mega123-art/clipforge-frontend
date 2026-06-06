import { useState, useEffect } from 'react'
import { X, Crown, Check } from 'lucide-react'
import api from '../api'
import { useRazorpay } from '../hooks/useRazorpay'
import TierBadge from './TierBadge'

export interface SubscriptionTier {
  id: number
  tier_name: string
  display_name: string
  price_paise: number
  base_credits: number
  bonus_percent: number
  total_credits: number
  billing_period: string
  is_active: boolean
}

interface SubscriptionModalProps {
  onClose: () => void
  onSubscribed?: () => void
}

export default function SubscriptionModal({ onClose, onSubscribed }: SubscriptionModalProps) {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([])
  const [selectedTierId, setSelectedTierId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { openCheckout, loading: paying, error: razorpayError, setError: setRazorpayError } = useRazorpay()

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const res = await api.get('/api/subscriptions/tiers')
        setTiers(res.data)
        if (res.data.length > 0) {
          setSelectedTierId(res.data[0].id)
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load tiers')
      } finally {
        setLoading(false)
      }
    }
    fetchTiers()
  }, [])

  const handleSubscribe = async () => {
    if (!selectedTierId) return

    setError(null)

    try {
      const res = await api.post('/api/subscriptions/create', { tier_id: selectedTierId })

      // Subscription created locally. Razorpay will charge via webhook.
      // Check your email for payment confirmation.
      onSubscribed?.()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Subscription failed')
    }
  }

  const selectedTier = tiers.find((t) => t.id === selectedTierId)
  const pricePerMonth = selectedTier ? (selectedTier.price_paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '₹0'

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-forge-bg rounded-xl p-8 max-w-2xl w-full mx-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-forge-border/30 rounded w-3/4" />
            <div className="h-4 bg-forge-border/30 rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-forge-bg rounded-xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Crown className="text-forge-accent" size={24} />
            <h2 className="text-2xl font-bold">Choose Your Plan</h2>
          </div>
          <button onClick={onClose} className="text-forge-text-muted hover:text-forge-text">
            <X size={20} />
          </button>
        </div>

        <p className="text-forge-text-muted mb-8">Select a subscription tier to get monthly credits + bonus</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {tiers.map((tier) => (
            <button
              key={tier.id}
              onClick={() => setSelectedTierId(tier.id)}
              className={`relative rounded-lg border-2 transition-all p-6 text-left ${
                selectedTierId === tier.id
                  ? 'border-forge-accent bg-forge-accent/5'
                  : 'border-forge-border hover:border-forge-accent/50'
              }`}
            >
              {selectedTierId === tier.id && (
                <div className="absolute top-3 right-3">
                  <Check size={18} className="text-forge-accent" />
                </div>
              )}
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">{tier.display_name}</h3>
                <TierBadge tier={tier.display_name} size="sm" showLabel={false} />
              </div>
              <div className="mb-4">
                <div className="text-2xl font-bold text-forge-accent">
                  ₹{(tier.price_paise / 100).toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-forge-text-muted">/month</div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-forge-accent">{tier.total_credits}</div>
                  <span className="text-forge-text-muted">credits/month</span>
                </div>
                <div className="text-xs text-forge-text-muted">
                  {tier.base_credits} base + {tier.bonus_percent}% bonus
                </div>
              </div>
            </button>
          ))}
        </div>

        {selectedTier && (
          <div className="bg-forge-border/20 rounded-lg p-6 mb-8">
            <h4 className="font-bold mb-4">Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-forge-text-muted">Plan</span>
                <span className="font-semibold">{selectedTier.display_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-forge-text-muted">Monthly Price</span>
                <span className="font-semibold">{pricePerMonth}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-forge-border">
                <span className="text-forge-text-muted">Credits per Month</span>
                <span className="font-semibold text-forge-accent">{selectedTier.total_credits}</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-8 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-forge-border hover:bg-forge-border/20 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubscribe}
            disabled={!selectedTierId || paying}
            className="flex-1 px-4 py-2 rounded-lg bg-forge-accent hover:bg-forge-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-forge-bg"
          >
            {paying ? 'Processing...' : 'Subscribe Now'}
          </button>
        </div>
      </div>
    </div>
  )
}
