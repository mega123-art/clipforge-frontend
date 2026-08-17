import { useState, useEffect, useRef } from 'react'
import { X, CheckCircle2 } from 'lucide-react'
import api from '../api'

interface QrPayModalProps {
  /** POST endpoint that mints the QR, e.g. '/api/payments/topup/qr' */
  createPath: string
  /** Body for the create call. Trial takes none; top-up sends the amount. */
  createBody?: Record<string, unknown>
  /** Rupees, for display only. */
  amount: number
  title?: string
  onPaid: () => void
  onClose: () => void
}

/**
 * Full-screen UPI QR. Exists because Razorpay's Standard Checkout hides its own
 * QR on mobile devices, leaving users without a UPI app installed unable to pay.
 */
export default function QrPayModal({
  createPath,
  createBody,
  amount,
  title = 'Scan to pay',
  onPaid,
  onClose,
}: QrPayModalProps) {
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paid, setPaid] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const doneRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let canceled = false

    api
      .post(createPath, createBody ?? {})
      .then((res) => {
        if (canceled) return
        const { qr_code_id, image_url } = res.data
        setQrImage(image_url)

        pollRef.current = setInterval(async () => {
          try {
            const statusRes = await api.get(`/api/payments/topup/qr/${qr_code_id}/status`)
            if (statusRes.data.status === 'success') {
              if (pollRef.current) clearInterval(pollRef.current)
              // Confirm on screen before handing off — closing instantly reads as a failure.
              setPaid(true)
              doneRef.current = setTimeout(() => onPaid(), 1800)
            }
          } catch {
            // transient failures shouldn't kill the flow; keep polling
          }
        }, 3000)
      })
      .catch((err) => {
        if (!canceled) setError(err.response?.data?.detail || 'Failed to generate QR code')
      })

    return () => {
      canceled = true
      if (pollRef.current) clearInterval(pollRef.current)
      if (doneRef.current) clearTimeout(doneRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createPath])

  if (paid) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-forge-bg rounded-xl p-10 w-full max-w-md flex flex-col items-center text-center">
          <CheckCircle2 size={64} className="text-emerald-400" />
          <h2 className="text-2xl font-bold mt-6">Payment successful</h2>
          <div className="text-3xl font-bold mt-2">₹{amount.toLocaleString('en-IN')}</div>
          <p className="text-sm text-forge-text-muted mt-3">Your account has been updated.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-forge-bg rounded-xl p-6 w-full max-w-md flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-6">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-forge-text-muted hover:text-forge-text">
            <X size={20} />
          </button>
        </div>

        {error ? (
          <div className="bg-forge-gold/10 border border-forge-gold/30 rounded-lg p-4 text-sm text-forge-gold w-full text-center">
            {error}
          </div>
        ) : qrImage ? (
          <>
            <img
              src={qrImage}
              alt="Scan to pay via UPI"
              // h-auto, not aspect-square: Razorpay's QR image isn't square (it carries
              // branding below the code), and a forced box stretches it via object-fit: fill.
              className="w-full max-w-[340px] h-auto object-contain rounded-xl bg-white p-4"
            />
            <div className="text-3xl font-bold mt-6">₹{amount.toLocaleString('en-IN')}</div>
            <p className="text-sm text-forge-text-muted mt-2 text-center">
              Scan with any UPI app. Your account updates automatically once paid.
            </p>
            <div className="flex items-center gap-2 mt-6 text-sm text-forge-text-muted">
              <span className="w-2 h-2 rounded-full bg-forge-accent animate-pulse" />
              Waiting for payment...
            </div>
          </>
        ) : (
          <div className="w-full max-w-[340px] aspect-square rounded-xl bg-forge-border/20 animate-pulse" />
        )}

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 rounded-lg border border-forge-border hover:bg-forge-border/20 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
