import { useQuery } from '@tanstack/react-query'
import api from '../api'
import useStore from '../store'

export interface CreditBreakdown {
  subscription_credits: number
  subscription_tier: string | null
  subscription_status: string | null
  topup_credits: number
  total: number
}

/**
 * Credit balance + subscription status.
 *
 * Shared by every nav component that shows credits or plan state. They all mount
 * together, so this must be one cached query rather than a fetch per component —
 * the previous per-component useEffect hit /api/subscriptions/breakdown roughly
 * six times per page load, each one a Postgres round trip.
 */
export function useCreditBreakdown() {
  const user = useStore((s) => s.user)
  return useQuery<CreditBreakdown>({
    queryKey: ['credit-breakdown', user?.id],
    queryFn: () => api.get<CreditBreakdown>('/api/subscriptions/breakdown').then((r) => r.data),
    enabled: !!user,
    staleTime: 60_000,
  })
}
