import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import Home from './pages/Home'
import Processing from './pages/Processing'
import Review from './pages/Review'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Admin from './pages/Admin'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import useStore from './store'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function AuthHydrator() {
  const { token, refreshUser, setAuth } = useStore()
  useEffect(() => {
    if (token) {
      refreshUser()
    } else if (import.meta.env.VITE_APP_ENV === 'development') {
      import('./api').then(({ default: api }) => {
        api.post('/api/auth/dev-login').then(({ data }) => setAuth(data)).catch(() => {})
      })
    }
    const onFocus = () => { if (useStore.getState().token) refreshUser() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [token, refreshUser, setAuth])
  return null
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthHydrator />
        <div className="min-h-screen bg-forge-bg text-forge-text">
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/processing/:jobId" element={<ProtectedRoute><Processing /></ProtectedRoute>} />
            <Route path="/review/:jobId" element={<ProtectedRoute><Review /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}
