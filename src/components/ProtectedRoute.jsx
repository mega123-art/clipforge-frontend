import { Navigate, useLocation } from 'react-router-dom'
import useStore from '../store'

export default function ProtectedRoute({ children }) {
  const token = useStore((s) => s.token)
  const location = useLocation()
  if (!token) {
    return <Navigate to="/signin" replace state={{ from: location }} />
  }
  return children
}
