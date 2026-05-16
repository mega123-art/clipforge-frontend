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
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      if (
        !window.location.pathname.startsWith('/signin') &&
        !window.location.pathname.startsWith('/signup')
      ) {
        window.location.href = '/signin'
      }
    }
    return Promise.reject(err)
  }
)

export default api
