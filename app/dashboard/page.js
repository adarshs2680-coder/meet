'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db, messaging } from '../../firebase/clientApp'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState('')
  const [presence, setPresence] = useState({ isOnline: false, currentUser: null })
  const [tokensRegistered, setTokensRegistered] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u)
      if (u) {
        const stored = localStorage.getItem(`username_${u.uid}`)
        setUsername(stored || u.email)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    console.log('[Dashboard] Setting up Firestore listener...')
    const presenceRef = doc(db, 'presence', 'main')
    console.log('[Dashboard] Firestore reference created for:', presenceRef.path)
    
    const unsub = onSnapshot(presenceRef, snap => {
      console.log('[Dashboard] Firestore update received')
      console.log('[Dashboard] Snap exists:', snap.exists())
      if (snap.exists()) {
        const data = snap.data()
        console.log('[Dashboard] Snap data:', data)
        setPresence(data)
      } else {
        console.log('[Dashboard] Snap does not exist, using default')
        setPresence({ isOnline: false, currentUser: null })
      }
    }, (error) => {
      console.error('[Dashboard] Firestore error:', error.message)
      console.error('[Dashboard] Error code:', error.code)
    })
    
    console.log('[Dashboard] Listener subscription created')
    return () => {
      console.log('[Dashboard] Unsubscribing from Firestore listener')
      unsub()
    }
  }, [])

  async function callSetStatus(payload) {
    try {
      if (!auth.currentUser) {
        alert('Please sign in first')
        return
      }
      const idToken = await auth.currentUser.getIdToken()
      console.log('Calling API with payload:', payload)
      
      const response = await fetch('/api/setStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + idToken
        },
        body: JSON.stringify(payload),
      })

      console.log('Response status:', response.status)
      console.log('Response OK:', response.ok)
      
      // Always get the text first
      const text = await response.text()
      console.log('Raw response:', text.substring(0, 200))

      if (response.ok) {
        try {
          const data = JSON.parse(text)
          console.log('Success response:', data)
          // No need to alert on success, the UI will update via Firestore listener
        } catch (e) {
          console.log('Response parsed but was not JSON:', text)
        }
      } else {
        // Error response
        try {
          const error = JSON.parse(text)
          console.error('Error response:', error)
          alert('Error: ' + (error.reason || error.error || 'Unknown error'))
        } catch (e) {
          console.error('Failed to parse error response')
          alert('Server error. Check console logs.')
        }
      }
    } catch (error) {
      console.error('Error calling setStatus:', error)
      alert('Failed: ' + error.message)
    }
  }

  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || ''
  const isOwner = user?.email === ownerEmail

  async function toggleOnline() {
    console.log('[Dashboard] toggleOnline called, current state:', presence.isOnline)
    const newState = !presence.isOnline
    console.log('[Dashboard] Setting online to:', newState)
    await callSetStatus({ action: 'setOnline', isOnline: newState })
  }

  async function joinCall() {
    await callSetStatus({ action: 'tryJoin', username })
    const meetLink = process.env.NEXT_PUBLIC_GOOGLE_MEET_LINK
    if (meetLink) {
      window.open(meetLink, '_blank')
    }
  }

  async function leaveCall() {
    await callSetStatus({ action: 'leave' })
  }

  async function logout() {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  async function registerForPush() {
    if (!messaging) return alert('Push not available on this browser')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return alert('Permission not granted')

      const { getToken } = await import('firebase/messaging')
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || ''
      })

      if (!token) throw new Error('No token')

      const idToken = await auth.currentUser.getIdToken()
      const response = await fetch('/api/registerToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + idToken
        },
        body: JSON.stringify({ token })
      })

      if (response.ok) {
        setTokensRegistered(true)
        alert('Push notifications enabled!')
      }
    } catch (e) {
      console.error(e)
      alert('Failed to register for push: ' + e.message)
    }
  }

  if (loading) {
    return <div style={styles.container}><p>Loading...</p></div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Dashboard</h1>
          <button onClick={logout} style={styles.logoutButton}>Sign Out</button>
        </div>

        <p style={styles.text}>Signed in as: <strong>{username}</strong></p>

        {/* Status Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Owner Status</h2>
          <div style={styles.statusBadge}>
            <span style={{
              ...styles.badge,
              backgroundColor: presence.isOnline ? '#4CAF50' : '#f44336'
            }}>
              {presence.isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
            </span>
          </div>

          {presence.currentUser ? (
            <p style={styles.text}>Currently helping: <strong>{presence.currentUserName || presence.currentUser}</strong></p>
          ) : (
            <p style={styles.text}>No one is in call</p>
          )}
        </div>

        {/* Owner Controls */}
        {isOwner ? (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Your Controls</h2>
            <button onClick={toggleOnline} style={styles.primaryButton}>
              {presence.isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
        ) : (
          /* Visitor Controls */
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Join Meeting</h2>
            {presence.isOnline ? (
              <>
                {presence.currentUser ? (
                  <>
                    <p style={styles.text}>Owner is busy. Please wait.</p>
                    <button disabled style={styles.disabledButton}>
                      Someone is with owner
                    </button>
                  </>
                ) : (
                  <>
                    <p style={styles.text}>Owner is available!</p>
                    <button onClick={joinCall} style={styles.primaryButton}>
                      Join Call
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <p style={styles.text}>Owner is not online.</p>
                <button disabled style={styles.disabledButton}>
                  Owner Offline
                </button>
              </>
            )}

            {presence.currentUser === user?.uid && (
              <button onClick={leaveCall} style={{ ...styles.primaryButton, marginTop: '10px', backgroundColor: '#f44336' }}>
                Leave Call
              </button>
            )}

            <div style={styles.notificationSection}>
              <button onClick={registerForPush} disabled={tokensRegistered} style={styles.secondaryButton}>
                {tokensRegistered ? '✓ Notifications Enabled' : 'Enable Notifications'}
              </button>
            </div>
          </div>
        )}

        {/* Meet Link */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Meet Link</h2>
          {presence.isOnline ? (
            <a href={process.env.NEXT_PUBLIC_GOOGLE_MEET_LINK} target="_blank" rel="noreferrer" style={styles.link}>
              Open Google Meet →
            </a>
          ) : (
            <p style={styles.text}>Link will appear when owner is online</p>
          )}
        </div>

        <Link href="/">
          <button style={styles.backButton}>← Back to Home</button>
        </Link>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    maxWidth: '600px',
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: 0,
    color: '#333',
  },
  logoutButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#333',
  },
  section: {
    marginBottom: '25px',
    padding: '15px',
    backgroundColor: '#fafafa',
    borderRadius: '4px',
    border: '1px solid #eee',
  },
  text: {
    fontSize: '14px',
    color: '#666',
    margin: '10px 0',
  },
  statusBadge: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '15px',
  },
  badge: {
    padding: '8px 16px',
    borderRadius: '20px',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  primaryButton: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#4285F4',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  secondaryButton: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  disabledButton: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#ccc',
    color: '#666',
    border: 'none',
    borderRadius: '4px',
    cursor: 'not-allowed',
  },
  notificationSection: {
    marginTop: '15px',
  },
  link: {
    display: 'inline-block',
    padding: '10px 20px',
    backgroundColor: '#4285F4',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
  },
  backButton: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '20px',
  },
}
