import { initializeApp, getApps } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getMessaging, isSupported } from 'firebase/messaging'

const clientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Validate config
if (!clientConfig.apiKey || !clientConfig.projectId) {
  console.error('Firebase config is incomplete. Check your .env.local file.')
  console.log('Available env vars:', {
    apiKey: !!clientConfig.apiKey,
    authDomain: !!clientConfig.authDomain,
    projectId: !!clientConfig.projectId,
    messagingSenderId: !!clientConfig.messagingSenderId,
    appId: !!clientConfig.appId,
  })
}

let app
if (!getApps().length) {
  app = initializeApp(clientConfig)
} else {
  app = getApps()[0]
}

export const auth = getAuth(app)
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence)
    .catch(err => console.error("Persistence error:", err))
}

export const db = getFirestore(app)

export const messaging = typeof window !== 'undefined' && isSupported()
  ? getMessaging(app)
  : null

 