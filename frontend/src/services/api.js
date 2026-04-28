import axios from 'axios'

function normalizeApiBaseUrl(value) {
  if (!value) {
    return import.meta.env.PROD ? 'https://smart-ai-farming.onrender.com' : ''
  }

  const trimmed = value.trim().replace(/\/+$/, '')

  // Support either `https://host` or `https://host/api` in env config
  return trimmed.replace(/\/api$/, '')
}

function getApiBaseUrl() {
  return normalizeApiBaseUrl(import.meta.env.VITE_API_URL)
}

function getStoredToken() {
  return localStorage.getItem('token')
}

function clearStoredAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

function redirectToLogin() {
  window.location.href = '/login'
}

function createApiClient() {
  return axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 30000,
  })
}

const api = createApiClient()

function attachToken(config) {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

function handleApiError(error) {
  if (error.response?.status === 401) {
    clearStoredAuth()
    redirectToLogin()
  }

  return Promise.reject(error)
}

api.interceptors.request.use(attachToken)
api.interceptors.response.use((response) => response, handleApiError)

export default api
