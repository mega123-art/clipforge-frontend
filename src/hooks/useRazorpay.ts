import { useState } from 'react'
import api from '../api'

interface RazorpayCheckoutOptions {
  key: string
  order_id: string
  amount: number
}

interface PaymentResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

type PaymentType = 'topup' | 'subscription'

export function useRazorpay() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openCheckout = async (
    options: RazorpayCheckoutOptions,
    paymentType: PaymentType,
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!window.Razorpay) {
        setError('Razorpay script not loaded')
        resolve(false)
        return
      }

      const razorpay = new window.Razorpay({
        key: options.key,
        order_id: options.order_id,
        amount: options.amount,
        currency: 'INR',
        handler: async (response: PaymentResponse) => {
          try {
            setLoading(true)
            setError(null)

            // Verify payment with backend
            const endpoint =
              paymentType === 'subscription'
                ? '/api/subscriptions/verify'
                : '/api/payments/topup/verify'

            await api.post(endpoint, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })

            resolve(true)
          } catch (err: any) {
            setError(err.response?.data?.detail || 'Payment verification failed')
            resolve(false)
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          email: localStorage.getItem('auth_user')
            ? JSON.parse(localStorage.getItem('auth_user') || '{}').email
            : '',
        },
        theme: {
          color: '#3b82f6',
        },
      })

      razorpay.open()
    })
  }

  return { openCheckout, loading, error, setError }
}
