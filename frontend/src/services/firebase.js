import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let app = null
let messaging = null

// Only initialize if Firebase config is available
if (firebaseConfig.apiKey) {
  try {
    app = initializeApp(firebaseConfig)
    messaging = getMessaging(app)
  } catch (e) {
    console.warn('Firebase initialization skipped:', e.message)
  }
}

export async function requestNotificationPermission() {
  if (!messaging || !('Notification' in window)) return null
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    })
    return token
  } catch (e) {
    console.warn('FCM token error:', e)
    return null
  }
}

export function subscribeToMessages(callback) {
  if (!messaging) return () => {}
  return onMessage(messaging, (payload) => {
    callback(payload)
  })
}

export { messaging }
