import { adminAuth, adminDB } from '../../../firebase/admin'

export async function POST(req) {
  try {
    console.log('[API] setStatus called')
    
    // Check if Firebase is initialized
    if (!adminAuth || !adminDB) {
      console.error('[API] Firebase Admin not initialized')
      return new Response(JSON.stringify({ error: 'Firebase not initialized. Check server logs.' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const authHeader = req.headers.get('authorization') || ''
    console.log('[API] Auth header:', authHeader ? 'present' : 'missing')
    
    if (!authHeader.startsWith('Bearer ')) {
      console.log('[API] Invalid auth header')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const idToken = authHeader.split('Bearer ')[1]
    console.log('[API] Verifying token...')
    
    let decoded
    try {
      decoded = await adminAuth.verifyIdToken(idToken)
      console.log('[API] Token verified for user:', decoded.uid)
    } catch (error) {
      console.log('[API] Token verification failed:', error.message)
      return new Response(JSON.stringify({ error: 'Invalid token: ' + error.message }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    console.log('[API] Request body:', body)
    
    const presenceRef = adminDB.collection('presence').doc('main')
    console.log('[API] Getting current presence...')
    
    let presenceSnap
    try {
      presenceSnap = await presenceRef.get()
      console.log('[API] presenceSnap retrieved successfully')
    } catch (getError) {
      console.error('[API] Error getting presence:', getError.message)
      return new Response(JSON.stringify({ ok: false, error: 'Failed to get presence: ' + getError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const current = presenceSnap.exists ? presenceSnap.data() : { isOnline: false, currentUser: null }
    console.log('[API] Current presence:', current)

    if (body.action === 'setOnline') {
      console.log('[API] Setting online status to:', body.isOnline)
      const newState = {
        isOnline: body.isOnline,
        currentUser: null,
        currentUserEmail: null,
        updatedAt: new Date().toISOString()
      }
      console.log('[API] New state to write:', newState)
      try {
        await presenceRef.set(newState, { merge: true })
        console.log('[API] Status updated successfully in Firestore')
        // Verify the write by reading back
        const verifySnap = await presenceRef.get()
        console.log('[API] Verified read after write:', verifySnap.data())
      } catch (writeError) {
        console.error('[API] Error writing to Firestore:', writeError.message)
        return new Response(JSON.stringify({ ok: false, error: 'Firestore write failed: ' + writeError.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      return new Response(JSON.stringify({ ok: true, message: 'Status updated' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (body.action === 'tryJoin') {
      console.log('[API] User trying to join')
      if (!current.isOnline) {
        console.log('[API] Owner is offline')
        return new Response(JSON.stringify({ ok: false, reason: 'owner offline' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      if (current.currentUser) {
        console.log('[API] Someone already in call')
        return new Response(JSON.stringify({ ok: false, reason: 'occupied' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      await presenceRef.update({
        currentUser: decoded.uid,
        currentUserEmail: decoded.email,
        updatedAt: new Date().toISOString()
      })
      console.log('[API] User joined call')
      return new Response(JSON.stringify({ ok: true, message: 'Joined call' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (body.action === 'leave') {
      console.log('[API] User leaving call')
      if (current.currentUser === decoded.uid) {
        await presenceRef.update({
          currentUser: null,
          currentUserEmail: null,
          updatedAt: new Date().toISOString()
        })
        console.log('[API] Call cleared')
      }
      return new Response(JSON.stringify({ ok: true, message: 'Left call' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('[API] Unknown action:', body.action)
    return new Response(JSON.stringify({ error: 'Unknown action' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('[API] Error:', err.message)
    console.error('[API] Stack:', err.stack)
    return new Response(JSON.stringify({ ok: false, error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}