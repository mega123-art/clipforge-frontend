import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import useStore from '../store'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = useStore((s) => s.token)
  const location = useLocation()
  if (!token) {
    return <Navigate to="/signin" replace state={{ from: location }} />
  }
  return <>{children}</>
}
