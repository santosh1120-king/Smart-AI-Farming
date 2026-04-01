import axios from 'axios'

function normalizeApiBaseUrl(value) {
  if (!value) return ''

  const trimmed = value.trim().replace(/\/+$/, '')

  // Support either `https://host` or `https://host/api` in env config
  return trimmed.replace(/\/api$/, '')
}

const api = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_URL),
  timeout: 30000,
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 - clear bad tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
