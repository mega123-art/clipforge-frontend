import axios from 'axios'

const api = axios.create()

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      if (!window.location.pathname.startsWith('/signin') && !window.location.pathname.startsWith('/signup')) {
        window.location.href = '/signin'
      }
    }
    return Promise.reject(err)
  }
)

export default api
