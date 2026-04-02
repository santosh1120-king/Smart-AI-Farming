const STORAGE_KEY = 'smart-farming-ai-keys'

export const EMPTY_AI_KEYS = {
  groqApiKey: '',
  openRouterApiKey: '',
}

export function loadAIKeys() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY_AI_KEYS }
    const parsed = JSON.parse(raw)
    return {
      groqApiKey: parsed.groqApiKey || '',
      openRouterApiKey: parsed.openRouterApiKey || '',
    }
  } catch {
    return { ...EMPTY_AI_KEYS }
  }
}

export function saveAIKeys(keys) {
  const payload = {
    groqApiKey: keys.groqApiKey?.trim() || '',
    openRouterApiKey: keys.openRouterApiKey?.trim() || '',
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  return payload
}

export function clearAIKeys() {
  localStorage.removeItem(STORAGE_KEY)
}

export function hasAnyAIKey(keys) {
  return Boolean(keys?.groqApiKey || keys?.openRouterApiKey)
}

export function buildAIHeaders(keys) {
  const headers = {}
  if (keys?.groqApiKey) headers['X-AI-Groq-Key'] = keys.groqApiKey.trim()
  if (keys?.openRouterApiKey) headers['X-AI-OpenRouter-Key'] = keys.openRouterApiKey.trim()
  return headers
}
