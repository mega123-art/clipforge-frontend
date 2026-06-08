import { useSubscriptionModal } from '../hooks/useSubscriptionModal'
import SubscriptionModal from './SubscriptionModal'
import TopupModal from './TopupModal'
import UpgradeBanner from './UpgradeBanner'

export default function SubscriptionModalProvider() {
  const { subscriptionOpen, topupOpen, closeSubscription, closeTopup, onPaymentSuccess } = useSubscriptionModal()

  const handleTopupSuccess = () => {
    closeTopup()
    if (onPaymentSuccess) {
      onPaymentSuccess()
    } else {
      window.location.reload()
    }
  }

  const handleSubscriptionSuccess = () => {
    closeSubscription()
    if (onPaymentSuccess) {
      onPaymentSuccess()
    } else {
      window.location.reload()
    }
  }

  return (
    <>
      <UpgradeBanner />

      {subscriptionOpen && (
        <SubscriptionModal
          onClose={closeSubscription}
          onSubscribed={handleSubscriptionSuccess}
        />
      )}

      {topupOpen && (
        <TopupModal
          onClose={closeTopup}
          onTopup={handleTopupSuccess}
        />
      )}
    </>
  )
}
