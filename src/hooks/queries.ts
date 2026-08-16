import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import api from '../api'
import useStore from '../store'
import { qk } from '../lib/queryKeys'
import type { JobListOut, ReferralInfo } from '../types/api'
import type { SubscriptionTier } from '../components/SubscriptionModal'

/**
 * Shared server-state hooks.
 *
 * Anything fetched by more than one component belongs here so it resolves to a
 * single cache entry — mounting five components that all need tiers issues one
 * request, not five. staleTime is set per-resource by how fast it actually
 * changes: catalogue data is near-static, money and job state are not.
 */

// ── Jobs ────────────────────────────────────────────────────────────────────

export function useJobsList(params: { page: number; pageSize: number; q: string }) {
  // Gated on the token, not the hydrated user: on a hard refresh of /clips the
  // profile fetch is still in flight, and waiting on it would leave the list
  // spinning (or stuck, if that fetch fails).
  const token = useStore((s) => s.token)
  return useQuery({
    queryKey: qk.jobs.list(params),
    queryFn: () =>
      api
        .get<JobListOut>('/api/jobs', {
          params: {
            page: params.page,
            page_size: params.pageSize,
            ...(params.q ? { q: params.q } : {}),
          },
        })
        .then((r) => r.data),
    enabled: !!token,
    // Page 2 keeps showing page 1's rows until it arrives — no flash of empty list.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

// ── Auth / referral ─────────────────────────────────────────────────────────

export function useReferral(options?: { enabled?: boolean }) {
  const user = useStore((s) => s.user)
  return useQuery<ReferralInfo>({
    queryKey: qk.auth.referral(user?.id),
    queryFn: () => api.get<ReferralInfo>('/api/auth/referral').then((r) => r.data),
    enabled: (options?.enabled ?? true) && !!user,
    // Referral code never changes; counts move only when someone signs up.
    staleTime: 5 * 60_000,
  })
}

// ── Billing ─────────────────────────────────────────────────────────────────

export interface SubscriptionInfo {
  tier_name?: string | null
  display_name?: string | null
  status?: string | null
  current_period_end?: string | null
  [key: string]: unknown
}

export function useSubscriptionTiers() {
  return useQuery<SubscriptionTier[]>({
    queryKey: qk.billing.tiers,
    queryFn: () => api.get<SubscriptionTier[]>('/api/subscriptions/tiers').then((r) => r.data),
    // Price catalogue — changes on deploys, not during a session.
    staleTime: 30 * 60_000,
  })
}

export function useTrialEligibility() {
  const user = useStore((s) => s.user)
  return useQuery<{ eligible: boolean; days?: number } | null>({
    queryKey: qk.billing.trialEligibility(user?.id),
    queryFn: () =>
      api
        .get<{ eligible: boolean; days?: number }>('/api/subscriptions/trial/eligibility')
        .then((r) => r.data)
        .catch(() => null),
    enabled: !!user,
    staleTime: 5 * 60_000,
  })
}

export function useCurrentSubscription(options?: { enabled?: boolean }) {
  const user = useStore((s) => s.user)
  return useQuery<SubscriptionInfo | null>({
    queryKey: qk.billing.subscription(user?.id),
    queryFn: () =>
      api.get<SubscriptionInfo>('/api/subscriptions/current').then((r) => r.data),
    enabled: (options?.enabled ?? true) && !!user,
    staleTime: 60_000,
  })
}

export function usePaymentHistory() {
  const user = useStore((s) => s.user)
  return useQuery({
    queryKey: qk.billing.payments(user?.id),
    queryFn: () => api.get('/api/payments/history').then((r) => r.data),
    enabled: !!user,
    staleTime: 60_000,
  })
}

export function useTopupConfig() {
  return useQuery({
    queryKey: qk.billing.topupConfig,
    queryFn: () => api.get('/api/payments/topup/config').then((r) => r.data),
    staleTime: 30 * 60_000,
  })
}

// ── Content ─────────────────────────────────────────────────────────────────

export function useHookTemplates<T>() {
  return useQuery<T>({
    queryKey: qk.content.hookTemplates,
    queryFn: () => api.get<T>('/api/hook-templates').then((r) => r.data),
    // Static asset catalogue: fetch once, reuse for the whole session.
    staleTime: Infinity,
  })
}

// ── Invalidation helpers ────────────────────────────────────────────────────

/**
 * Money moved (top-up, subscribe, cancel, export spend). Anything showing a
 * balance or plan is now wrong — drop it all rather than hand-listing keys at
 * each call site.
 */
export function useInvalidateBilling() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: qk.billing.all })
  }
}

/** A job was created, deleted, or changed state. */
export function useInvalidateJobs() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: qk.jobs.all })
}
