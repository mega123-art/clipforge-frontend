import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import useStore from '../store'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = useStore((s) => s.token)
  const user = useStore((s) => s.user)
  const location = useLocation()
  
  if (!token) {
    return <Navigate to="/signin" replace state={{ from: location }} />
  }
  
  // Email verification route guard temporarily bypassed
  // if (user && user.is_email_verified === false && user.auth_provider === 'local') {
  //   return <Navigate to="/verify-email" replace state={{ from: location }} />
  // }
  
  return <>{children}</>
}
