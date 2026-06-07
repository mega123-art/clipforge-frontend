import { useState } from 'react'
import api from '../api'

interface RazorpayCheckoutOptions {
  key: string
  order_id?: string
  subscription_id?: string
  amount?: number
}

interface PaymentResponse {
  razorpay_payment_id: string
  razorpay_order_id?: string
  razorpay_subscription_id?: string
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

      const checkoutConfig: any = {
        key: options.key,
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

            const payload: any = {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }
            if (paymentType === 'subscription') {
              payload.razorpay_subscription_id = response.razorpay_subscription_id || options.subscription_id
            } else {
              payload.razorpay_order_id = response.razorpay_order_id || options.order_id
            }

            await api.post(endpoint, payload)

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
      }

      if (options.subscription_id) {
        checkoutConfig.subscription_id = options.subscription_id
      } else {
        checkoutConfig.order_id = options.order_id
        checkoutConfig.amount = options.amount
      }

      const razorpay = new window.Razorpay(checkoutConfig)

      razorpay.open()
    })
  }

  return { openCheckout, loading, error, setError }
}
