import { Navigate, useLocation } from 'react-router-dom'
import useStore from '../store'

export default function AdminRoute({ children }) {
  const { token, user } = useStore()
  const location = useLocation()
  if (!token) return <Navigate to="/signin" replace state={{ from: location }} />
  if (!user?.is_admin) return <Navigate to="/" replace />
  return children
}
