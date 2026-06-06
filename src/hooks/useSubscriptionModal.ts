import { create } from 'zustand'

interface SubscriptionModalStore {
  subscriptionOpen: boolean
  topupOpen: boolean
  openSubscription: () => void
  closeSubscription: () => void
  openTopup: () => void
  closeTopup: () => void
}

export const useSubscriptionModal = create<SubscriptionModalStore>((set) => ({
  subscriptionOpen: false,
  topupOpen: false,
  openSubscription: () => set({ subscriptionOpen: true }),
  closeSubscription: () => set({ subscriptionOpen: false }),
  openTopup: () => set({ topupOpen: true }),
  closeTopup: () => set({ topupOpen: false }),
}))
