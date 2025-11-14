import adminApp, { adminAuth, adminDB } from '../../../firebase/admin'

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const idToken = authHeader.split('Bearer ')[1]
    let decoded
    try {
      decoded = await adminAuth.verifyIdToken(idToken)
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { token } = await req.json()

    if (!token) {
      return new Response(JSON.stringify({ error: 'No token provided' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    await adminDB.collection('fcmTokens').doc(token).set({
      uid: decoded.uid,
      email: decoded.email,
      createdAt: new Date()
    }, { merge: true })

    return new Response(JSON.stringify({ ok: true, message: 'Token registered' }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Token registration error:', err)
    return new Response(JSON.stringify({ ok: false, error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}