import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios'
import { toast } from './components/Toast'

// Requests that show their own inline error state opt out of the global
// toast by setting `{ silent: true }` in the axios config.
declare module 'axios' {
  export interface AxiosRequestConfig {
    silent?: boolean
  }
}

function messageFor(err: AxiosError): string {
  const data = err.response?.data as { detail?: string; message?: string } | undefined
  if (typeof data?.detail === 'string') return data.detail
  if (typeof data?.message === 'string') return data.message
  if (!err.response) return 'Network error — check your connection and try again.'
  if (err.response.status >= 500) return 'Something went wrong on our end. Please try again.'
  return 'Something went wrong. Please try again.'
}

// Trailing slash must be stripped: axios normalizes `host/` + `/api/x`, but the // raw `${API_BASE_URL}${path}` concats (video/stream/overlay src) would emit
// `host//api/x`, which FastAPI 404s.
export const API_BASE_URL = (import.meta.env.VITE_APP_API_URL || 'http://localhost:8000').replace(/\/+$/, '')

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      // Only bounce to signin on a real session expiry (a token existed).
      // Anonymous 401s from background calls on public pages (e.g. Landing)
      // must NOT redirect, or the public homepage flashes then kicks to signin.
      const hadToken = !!localStorage.getItem('auth_token')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      const path = window.location.pathname
      if (hadToken && !path.startsWith('/signin') && !path.startsWith('/signup')) {
        // Preserve the page (and search) so we can bounce the user back
        // after re-login. Without this, a 2-hour job page becomes orphaned
        // the moment the JWT expires.
        try {
          sessionStorage.setItem(
            'post_login_redirect',
            path + window.location.search,
          )
        } catch {
          /* sessionStorage may be unavailable in private mode — ignore */
        }
        window.location.href = '/signin'
      }
    } else if (!err.config?.silent) {
      toast.error(messageFor(err))
    }
    return Promise.reject(err)
  }
)

export default api

