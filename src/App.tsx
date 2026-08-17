import { useEffect, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from './lib/queryKeys'
import Home from './pages/Home'
import Landing from './pages/Landing'
import Processing from './pages/Processing'
import Review from './pages/Review'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Admin from './pages/Admin'
import MyClips from './pages/MyClips'
import Billing from './pages/Billing'
import VerifyEmail from './pages/VerifyEmail'
import Down from './pages/Down'
import ProtectedRoute from './components/ProtectedRoute'
import SubscriptionModalProvider from './components/SubscriptionModalProvider'
import { ToastProvider } from './components/Toast'
import ActiveJobBanner from './components/ActiveJobBanner'
import ScrollToTop from './components/ScrollToTop'
import useStore from './store'
import api from './api'
import type { AppStatus, AuthOut } from './types/api'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function AuthHydrator(): null {
  const { token, refreshUser, setAuth } = useStore()
  const queryClient = useQueryClient()

  // Signing out must drop every cached response — user-scoped keys alone are
  // not enough, since a cached page would still render before the refetch.
  useEffect(() => {
    if (!token) queryClient.clear()
  }, [token, queryClient])

  useEffect(() => {
    if (token) {
      refreshUser()
    } else if (import.meta.env.VITE_APP_ENV === 'development') {
      import('./api').then(({ default: api }) => {
        api
          .post<AuthOut>('/api/auth/dev-login')
          .then(({ data }) => setAuth(data))
          .catch(() => {})
      })
    }
    const onFocus = () => {
      if (useStore.getState().token) refreshUser()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [token, refreshUser, setAuth])
  return null
}

// Logged-in users skip the marketing page and land in the app.
function LandingRoute() {
  const token = useStore((s) => s.token)
  if (token) return <Navigate to="/app" replace />
  return <Landing />
}

function MaintenanceGate({ children }: { children: ReactNode }) {
  const location = useLocation()
  const user = useStore((s) => s.user)
  const { data } = useQuery<AppStatus>({
    queryKey: qk.system.status,
    queryFn: () => api.get<AppStatus>('/api/system/status').then((r) => r.data),
    refetchInterval: 30000,
    retry: 1,
  })

  const allowedPath =
    location.pathname === '/down' ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/signin') ||
    location.pathname.startsWith('/signup')

  if (data?.maintenance_mode && !user?.is_admin && !allowedPath) {
    return <Navigate to="/down" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <ToastProvider>
          <ScrollToTop />
          <AuthHydrator />
          <SubscriptionModalProvider />
          <div className="min-h-screen bg-forge-bg text-forge-text">
            <MaintenanceGate>
              <ActiveJobBanner />
              <Routes>
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/down" element={<Down />} />
                <Route path="/" element={<LandingRoute />} />
                <Route path="/app" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/processing/:jobId" element={<ProtectedRoute><Processing /></ProtectedRoute>} />
                <Route path="/review/:jobId" element={<ProtectedRoute><Review /></ProtectedRoute>} />
                <Route path="/clips" element={<ProtectedRoute><MyClips /></ProtectedRoute>} />
                <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MaintenanceGate>
          </div>
        </ToastProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}
