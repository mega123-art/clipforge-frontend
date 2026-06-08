import { useState, useEffect } from 'react'
import { X, Zap } from 'lucide-react'
import api from '../api'
import { useRazorpay } from '../hooks/useRazorpay'

interface TopupModalProps {
  onClose: () => void
  onTopup?: () => void
}

export default function TopupModal({ onClose, onTopup }: TopupModalProps) {
  const [amount, setAmount] = useState(0)
  const [customAmount, setCustomAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [creditPrice, setCreditPrice] = useState(99.99)
  const [presets, setPresets] = useState<number[]>([100, 500, 1000, 2000, 5000])
  const { openCheckout, loading: paying, error: razorpayError, setError: setRazorpayError } = useRazorpay()

  // Fetch topup config from backend
  useEffect(() => {
    api.get('/api/payments/topup/config')
      .then((res) => {
        if (res?.data?.presets) setPresets(res.data.presets)
        if (res?.data?.credit_price_inr) setCreditPrice(res.data.credit_price_inr)
      })
      .catch(() => {})
  }, [])

  const displayAmount = customAmount ? parseInt(customAmount) : amount
  const credits = displayAmount > 0 ? Math.floor((displayAmount * 100) / (creditPrice * 100)) : 0

  const handleCustomChange = (e: string) => {
    setCustomAmount(e)
    setAmount(0)
  }

  const handlePresetClick = (preset: number) => {
    setAmount(preset)
    setCustomAmount('')
  }

  const handleTopup = async () => {
    if (displayAmount <= 0) return

    setError(null)
    setRazorpayError(null)

    try {
      const amountPaise = Math.round(displayAmount * 100)
      const res = await api.post('/api/payments/topup', { amount_paise: amountPaise })
      const { order_id, key_id, amount } = res.data

      // Open Razorpay checkout
      const success = await openCheckout(
        {
          key: key_id,
          order_id,
          amount,
        },
        'topup',
      )

      if (success) {
        onTopup?.()
        onClose()
      } else {
        setError(razorpayError || 'Payment verification failed')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Top-up failed')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-forge-bg rounded-xl p-8 max-w-lg w-full mx-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Zap className="text-amber-400" size={24} />
            <h2 className="text-2xl font-bold">Buy Credits</h2>
          </div>
          <button onClick={onClose} className="text-forge-text-muted hover:text-forge-text">
            <X size={20} />
          </button>
        </div>

        <p className="text-forge-text-muted mb-6">Top-up your account with one-time credit purchase</p>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-3">Amount (₹)</label>
          <input
            type="number"
            value={customAmount || amount}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="Enter custom amount"
            className="w-full px-4 py-2 rounded-lg bg-forge-border/10 border border-forge-border hover:border-forge-accent/50 focus:border-forge-accent focus:outline-none transition-colors"
            min="100"
            max="99999"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-3">Quick presets</label>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${
                  amount === preset && !customAmount
                    ? 'border-forge-accent bg-forge-accent/10 text-forge-accent'
                    : 'border-forge-border hover:border-forge-accent/50'
                }`}
              >
                ₹{preset.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
        </div>

        {displayAmount > 0 && (
          <div className="bg-forge-border/20 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-forge-text-muted">You'll get approximately</div>
                <div className="text-2xl font-bold text-forge-accent">{credits} credits</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">₹{displayAmount.toLocaleString('en-IN')}</div>
                <div className="text-xs text-forge-text-muted">at ₹{creditPrice.toFixed(2)}/credit</div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-sm text-red-400">
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
            onClick={handleTopup}
            disabled={displayAmount <= 0 || paying}
            className="flex-1 px-4 py-2 rounded-lg bg-forge-accent hover:bg-forge-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-forge-bg"
          >
            {paying ? 'Processing...' : `Pay ₹${displayAmount.toLocaleString('en-IN')}`}
          </button>
        </div>

        <p className="text-xs text-forge-text-muted text-center mt-4">
          Credits expire based on your subscription status
        </p>
      </div>
    </div>
  )
}
