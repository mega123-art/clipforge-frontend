import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios'

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL || 'http://localhost:8000',
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
    }
    return Promise.reject(err)
  }
)

export default api
