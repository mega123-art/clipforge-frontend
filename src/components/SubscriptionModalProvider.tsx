import { useSubscriptionModal } from '../hooks/useSubscriptionModal'
import SubscriptionModal from './SubscriptionModal'
import TopupModal from './TopupModal'
import UpgradeBanner from './UpgradeBanner'

export default function SubscriptionModalProvider() {
  const { subscriptionOpen, topupOpen, closeSubscription, closeTopup, openTopup } = useSubscriptionModal()

  return (
    <>
      <UpgradeBanner />

      {subscriptionOpen && (
        <SubscriptionModal
          onClose={closeSubscription}
          onSubscribed={() => {
            closeSubscription()
            window.location.reload()
          }}
        />
      )}

      {topupOpen && (
        <TopupModal
          onClose={closeTopup}
          onTopup={() => {
            closeTopup()
            window.location.reload()
          }}
        />
      )}
    </>
  )
}
