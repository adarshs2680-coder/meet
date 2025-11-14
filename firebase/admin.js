// Server-side Firebase Admin initialization for API routes
import admin from 'firebase-admin'

console.log('[Firebase Admin] Initializing...')
console.log('[Firebase Admin] Service account JSON present:', !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON)

let adminApp

try {
  if (!admin.apps.length) {
    console.log('[Firebase Admin] Parsing service account...')
    
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set')
    }

    let serviceAccount
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
      console.log('[Firebase Admin] Service account parsed successfully')
    } catch (parseError) {
      console.error('[Firebase Admin] Failed to parse service account JSON:', parseError.message)
      throw new Error('Invalid service account JSON: ' + parseError.message)
    }

    console.log('[Firebase Admin] Initializing app...')
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
    console.log('[Firebase Admin] App initialized successfully')
  } else {
    console.log('[Firebase Admin] Using existing app')
    adminApp = admin.app()
  }
} catch (error) {
  console.error('[Firebase Admin] Initialization failed:', error.message)
  console.error('[Firebase Admin] Stack:', error.stack)
  // Don't throw - export dummy objects so at least the import succeeds
  adminApp = null
}

let adminAuth = null
let adminDB = null

if (adminApp) {
  try {
    adminAuth = adminApp.auth()
    console.log('[Firebase Admin] Auth initialized')
  } catch (e) {
    console.error('[Firebase Admin] Failed to initialize auth:', e.message)
  }
  
  try {
    adminDB = adminApp.firestore()
    console.log('[Firebase Admin] Firestore initialized')
  } catch (e) {
    console.error('[Firebase Admin] Failed to initialize Firestore:', e.message)
  }
}

export { adminAuth, adminDB }
export default adminApp