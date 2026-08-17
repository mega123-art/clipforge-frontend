import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, Zap, Calendar, AlertCircle, ArrowUp, ArrowLeft, Receipt, CheckCircle, XCircle, Clock } from 'lucide-react'
import api from '../api'
import useStore from '../store'
import { useSubscriptionModal } from '../hooks/useSubscriptionModal'
import { useRazorpay } from '../hooks/useRazorpay'
import { useCreditBreakdown } from '../hooks/useCreditBreakdown'
import {
  useCurrentSubscription,
  useSubscriptionTiers,
  usePaymentHistory,
  useInvalidateBilling,
} from '../hooks/queries'
import TierBadge from '../components/TierBadge'
import type { SubscriptionTier } from '../components/SubscriptionModal'

interface SubscriptionInfo {
  subscription_id: string
  tier_id: number
  tier_name: string
  status: 'active' | 'pending' | 'paused' | 'canceled'
  next_billing_date: string
  current_period_end: string
  subscription_credits_balance: number
  price_paise: number
  razorpay_subscription_id?: string
  razorpay_key_id?: string
}

interface CreditBreakdown {
  subscription_credits: number
  subscription_tier: string | null
  subscription_status: string | null
  topup_credits: number
  total: number
  next_billing_date: string | null
}

interface PaymentRecord {
  id: string
  razorpay_order_id: string
  razorpay_payment_id: string | null
  amount_paise: number
  credits_granted: number
  status: string
  payment_type: string
  verified_at: string | null
  created_at: string | null
}

export default function BillingPage() {
  const refreshUser = useStore((s) => s.refreshUser)
  const navigate = useNavigate()
  const { openSubscription, openTopup } = useSubscriptionModal()
  const [selectedUpgradeTierId, setSelectedUpgradeTierId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const { openCheckout, error: razorpayError, setError: setRazorpayError } = useRazorpay()

  // Four cached queries, each shared with the components that also need them
  // (nav credits badge, upgrade banner, subscription modal). They fire in
  // parallel and any of them already warm renders from cache immediately.
  const subscriptionQuery = useCurrentSubscription()
  const breakdownQuery = useCreditBreakdown()
  const tiersQuery = useSubscriptionTiers()
  const paymentsQuery = usePaymentHistory()
  const invalidateBilling = useInvalidateBilling()

  const subscription = (subscriptionQuery.data ?? null) as SubscriptionInfo | null
  const breakdown = (breakdownQuery.data ?? null) as CreditBreakdown | null
  const tiers = (tiersQuery.data ?? []) as SubscriptionTier[]
  const payments = (paymentsQuery.data ?? []) as PaymentRecord[]
  const loading =
    subscriptionQuery.isPending ||
    breakdownQuery.isPending ||
    tiersQuery.isPending ||
    paymentsQuery.isPending

  /** After any billing action: drop the cached billing state and resync the user. */
  const fetchData = async () => {
    invalidateBilling()
    await refreshUser()
  }

  const handleCancelSubscription = async () => {
    const isPending = subscription?.status === 'pending'
    const confirmMsg = isPending
      ? 'Cancel pending subscription?'
      : 'Cancel subscription? You can re-subscribe anytime.'

    if (!window.confirm(confirmMsg)) return

    setActionLoading(true)
    try {
      await api.post('/api/subscriptions/cancel')
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to cancel subscription')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePayNow = async () => {
    if (!subscription || !subscription.razorpay_subscription_id || !subscription.razorpay_key_id) return

    setActionLoading(true)
    setError(null)
    setRazorpayError(null)
    try {
      const success = await openCheckout(
        {
          key: subscription.razorpay_key_id,
          subscription_id: subscription.razorpay_subscription_id,
        },
        'subscription',
      )

      if (success) {
        fetchData()
      } else {
        setError(razorpayError || 'Payment verification failed')
      }
    } catch (err: any) {
      setError('Failed to complete payment')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePauseSubscription = async () => {
    if (!window.confirm('Pause subscription? You can resume later.')) return

    setActionLoading(true)
    try {
      await api.post('/api/subscriptions/pause')
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to pause subscription')
    } finally {
      setActionLoading(false)
    }
  }

  const handleResumeSubscription = async () => {
    setActionLoading(true)
    try {
      await api.post('/api/subscriptions/resume')
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to resume subscription')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpgradeSubscription = async () => {
    if (!selectedUpgradeTierId) return

    setActionLoading(true)
    setError(null)

    try {
      // Create subscription in backend
      const res = await api.post('/api/subscriptions/create', { tier_id: selectedUpgradeTierId })
      const { razorpay_subscription_id, razorpay_key_id } = res.data

      if (!razorpay_subscription_id) {
        setError('Failed to create subscription')
        return
      }

      // Open Razorpay checkout
      const success = await openCheckout(
        {
          key: razorpay_key_id,
          subscription_id: razorpay_subscription_id,
        },
        'subscription',
      )

      if (success) {
        setSelectedUpgradeTierId(null)
        await fetchData()
      } else {
        setError(razorpayError || 'Payment verification failed')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upgrade subscription')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-forge-bg p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-forge-border/30 rounded w-1/4" />
            <div className="grid gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-40 bg-forge-border/30 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-forge-bg p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-forge-muted hover:text-forge-text transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
        <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-forge-text-muted mb-8">Manage your subscription and credits</p>

        {(error || razorpayError) && (
          <div className="bg-forge-gold/10 border border-forge-gold/30 rounded-lg p-4 mb-8 flex items-start gap-3">
            <AlertCircle size={20} className="text-forge-gold flex-shrink-0 mt-0.5" />
            <div className="text-sm text-forge-gold">{error || razorpayError}</div>
          </div>
        )}

        {/* Current Credits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-forge-border/10 rounded-xl p-6">
            <div className="text-sm text-forge-text-muted mb-2">Total Credits</div>
            <div className="text-3xl font-bold text-forge-accent">{breakdown?.total ?? 0}</div>
          </div>

          <div className="bg-forge-border/10 rounded-xl p-6">
            <div className="text-sm text-forge-text-muted mb-2">Subscription Credits</div>
            <div className="text-3xl font-bold">{breakdown?.subscription_credits ?? 0}</div>
            <div className="text-xs text-forge-text-muted mt-1">{breakdown?.subscription_tier ?? 'None'}</div>
          </div>

          <div className="bg-forge-border/10 rounded-xl p-6">
            <div className="text-sm text-forge-text-muted mb-2">Top-up Credits</div>
            <div className="text-3xl font-bold">{breakdown?.topup_credits ?? 0}</div>
          </div>
        </div>

        {/* Subscription Status */}
        {/* Upgrade Section */}
        {subscription && tiers.length > 0 && (
          <div className="bg-forge-border/10 rounded-xl p-8 mb-8">
            <div className="flex items-start gap-4 mb-6">
              <ArrowUp size={24} className="text-amber-400 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold mb-1">Upgrade Plan</h3>
                <p className="text-sm text-forge-text-muted">Get more credits and features</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {tiers
                .filter((t) => t.price_paise > subscription.price_paise) // Only show higher tiers
                .map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedUpgradeTierId(tier.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedUpgradeTierId === tier.id
                        ? 'border-forge-accent bg-forge-accent/10'
                        : 'border-forge-border hover:border-forge-accent/50'
                    }`}
                  >
                    <div className="font-bold text-sm mb-1">{tier.display_name}</div>
                    <div className="text-forge-text-muted text-xs">₹{(tier.price_paise / 100).toLocaleString('en-IN')}/mo</div>
                    <div className="text-forge-accent font-bold text-sm mt-2">{tier.total_credits} cr</div>
                  </button>
                ))}
            </div>

            <button
              onClick={handleUpgradeSubscription}
              disabled={!selectedUpgradeTierId || actionLoading}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 disabled:opacity-50 transition-colors font-medium text-amber-300"
            >
              {actionLoading ? 'Upgrading...' : 'Upgrade Now'}
            </button>
          </div>
        )}

        {subscription ? (
          <div className="bg-forge-border/10 rounded-xl p-8 mb-8">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-forge-accent/20 rounded-lg p-3">
                  <Crown size={24} className="text-forge-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold">{subscription.tier_name}</h2>
                    <TierBadge tier={subscription.tier_name} size="sm" showLabel={false} />
                  </div>
                  <div className="text-sm text-forge-text-muted capitalize">
                    Status: {subscription.status}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-forge-accent">
                  ₹{(subscription.price_paise / 100).toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-forge-text-muted">/month</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div>
                <div className="text-sm text-forge-text-muted mb-1">Next Billing</div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-forge-text-muted" />
                  <span className="font-medium">
                    {new Date(subscription.next_billing_date).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-forge-text-muted mb-1">Period Ends</div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-forge-text-muted" />
                  <span className="font-medium">
                    {new Date(subscription.current_period_end).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {subscription.status === 'pending' && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-300">
                    Subscription pending. Waiting for payment confirmation...
                  </div>
                </div>
                {subscription.razorpay_subscription_id && (
                  <button
                    onClick={handlePayNow}
                    disabled={actionLoading}
                    className="px-4 py-1.5 rounded-lg bg-amber-500 text-forge-bg hover:bg-amber-600 disabled:opacity-50 transition-colors font-semibold text-sm"
                  >
                    {actionLoading ? 'Processing...' : 'Pay Now'}
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-3">
              {(subscription.status === 'active' || subscription.status === 'pending') && (
                <>
                  {subscription.status === 'active' && (
                    <button
                      onClick={handlePauseSubscription}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-lg border border-forge-border hover:bg-forge-border/20 disabled:opacity-50 transition-colors font-medium"
                    >
                      Pause
                    </button>
                  )}
                  <button
                    onClick={handleCancelSubscription}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </>
              )}

              {subscription.status === 'paused' && (
                <button
                  onClick={handleResumeSubscription}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-forge-accent hover:bg-forge-accent/90 disabled:opacity-50 transition-colors font-medium text-forge-bg"
                >
                  Resume
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-forge-border/10 rounded-xl p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Crown size={28} className="text-forge-accent" />
              <div>
                <h2 className="text-xl font-bold">No Active Subscription</h2>
                <p className="text-sm text-forge-text-muted">Start a subscription to get monthly credits + bonus</p>
              </div>
            </div>
            <button
              onClick={openSubscription}
              className="px-6 py-2 rounded-lg bg-forge-accent hover:bg-forge-accent/90 transition-colors font-medium text-forge-bg"
            >
              View Plans
            </button>
          </div>
        )}

        {/* Top-up Option */}
        <div className="bg-forge-border/10 rounded-xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Zap size={28} className="text-amber-400" />
            <div>
              <h3 className="text-xl font-bold">Buy Extra Credits</h3>
              <p className="text-sm text-forge-text-muted">Top-up your account anytime with one-time purchases</p>
            </div>
          </div>
          <button
            onClick={openTopup}
            className="px-6 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 transition-colors font-medium text-amber-300"
          >
            Buy Credits
          </button>
        </div>

        {/* Payment History */}
        <div className="bg-forge-border/10 rounded-xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <Receipt size={28} className="text-forge-accent" />
            <div>
              <h3 className="text-xl font-bold">Payment History</h3>
              <p className="text-sm text-forge-muted">All your top-up and subscription payments</p>
            </div>
          </div>

          {payments.length === 0 ? (
            <p className="text-sm text-forge-muted py-4">No payments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-forge-border/40">
                    <th className="text-left text-forge-muted font-semibold pb-3 pr-4">Date</th>
                    <th className="text-left text-forge-muted font-semibold pb-3 pr-4">Type</th>
                    <th className="text-right text-forge-muted font-semibold pb-3 pr-4">Amount</th>
                    <th className="text-right text-forge-muted font-semibold pb-3 pr-4">Credits</th>
                    <th className="text-right text-forge-muted font-semibold pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forge-border/20">
                  {payments.map((p) => (
                    <tr key={p.id} className="group">
                      <td className="py-3.5 pr-4 text-forge-subtext font-mono text-xs">
                        {p.created_at
                          ? new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                          p.payment_type === 'topup'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-forge-accent/10 border-forge-accent/30 text-forge-accent'
                        }`}>
                          {p.payment_type === 'topup' ? <Zap size={10} /> : <Crown size={10} />}
                          {p.payment_type === 'topup' ? 'Top-up' : 'Subscription'}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-right font-semibold tabular-nums">
                        ₹{(p.amount_paise / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 pr-4 text-right text-forge-accent font-bold tabular-nums">
                        +{p.credits_granted}
                      </td>
                      <td className="py-3.5 text-right">
                        {p.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                            <CheckCircle size={13} /> Paid
                          </span>
                        ) : p.status === 'failed' ? (
                          <span className="inline-flex items-center gap-1 text-forge-gold text-xs font-semibold">
                            <XCircle size={13} /> Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-forge-muted text-xs font-semibold">
                            <Clock size={13} /> Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
