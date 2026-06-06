export interface RazorpayCheckoutOptions {
  key: string
  order_id: string
  amount: number
  currency?: string
  handler?: (response: RazorpayPaymentResponse) => void
  prefill?: {
    email?: string
    contact?: string
    name?: string
  }
  theme?: {
    color?: string
  }
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export interface RazorpayInstance {
  open(): void
  close(): void
}

declare global {
  interface Window {
    Razorpay: {
      new (options: RazorpayCheckoutOptions): RazorpayInstance
    }
  }
}
