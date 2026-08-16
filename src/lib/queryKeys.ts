/**
 * Every query key in the app lives here.
 *
 * Keys are hierarchical so a broad invalidation cascades: invalidating
 * `qk.jobs.all` refreshes every job list *and* every job detail, while
 * `qk.jobs.detail(id)` touches exactly one. Keys that depend on who is signed
 * in take the user id, so switching accounts can never serve the previous
 * user's cached data.
 */
export const qk = {
  jobs: {
    all: ['jobs'] as const,
    lists: ['jobs', 'list'] as const,
    list: (params: { page: number; pageSize: number; q: string }) =>
      ['jobs', 'list', params] as const,
    active: ['jobs', 'active'] as const,
    detail: (jobId?: string) => ['jobs', 'detail', jobId] as const,
  },

  billing: {
    all: ['billing'] as const,
    breakdown: (userId?: string) => ['billing', 'breakdown', userId] as const,
    subscription: (userId?: string) => ['billing', 'subscription', userId] as const,
    tiers: ['billing', 'tiers'] as const,
    trialEligibility: (userId?: string) => ['billing', 'trial-eligibility', userId] as const,
    payments: (userId?: string) => ['billing', 'payments', userId] as const,
    topupConfig: ['billing', 'topup-config'] as const,
  },

  auth: {
    referral: (userId?: string) => ['auth', 'referral', userId] as const,
  },

  clips: {
    expiry: (clipId: string) => ['clips', 'expiry', clipId] as const,
  },

  content: {
    hookTemplates: ['content', 'hook-templates'] as const,
  },

  system: {
    status: ['system', 'status'] as const,
    debugHealth: ['system', 'debug-health'] as const,
  },
} as const
