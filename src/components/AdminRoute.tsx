import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import useStore from '../store'

interface AdminRouteProps {
  children: ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { token, user } = useStore()
  const location = useLocation()
  if (!token) return <Navigate to="/signin" replace state={{ from: location }} />
  if (!user?.is_admin) return <Navigate to="/app" replace />
  return <>{children}</>
}
