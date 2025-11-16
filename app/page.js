'use client'
import { useEffect, useState } from 'react'
import { auth } from '../firebase/clientApp'
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import Link from 'next/link'

export default function Home() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [showUsernameInput, setShowUsernameInput] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => {
      setUser(u)
      if (u) {
        // Load stored username
        const stored = localStorage.getItem(`username_${u.uid}`)
        if (stored) {
          setUsername(stored)
          setShowUsernameInput(false)
        } else {
          setShowUsernameInput(true)
        }
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  async function verifyPhone() {
    setError('')
    if (!phone.trim()) {
      setError('Please enter a phone number')
      return
    }

    // Get allowed phones from env
    const allowedPhones = JSON.parse(process.env.NEXT_PUBLIC_ALLOWED_PHONES || '{}')
    
    if (!allowedPhones[phone]) {
      setError('Phone number not authorized. Access denied.')
      return
    }

    // Phone is valid - set the assigned username
    const assignedUsername = allowedPhones[phone]
    
    // Sign in with Google (we still need Google auth for Firebase)
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      // Store the phone number and assigned username
      localStorage.setItem(`phone_${auth.currentUser.uid}`, phone)
      localStorage.setItem(`username_${auth.currentUser.uid}`, assignedUsername)
      setPhoneVerified(true)
      setUsername(assignedUsername)
    } catch (error) {
      console.error('Login error:', error)
      setError('Login failed: ' + error.message)
    }
  }

  async function logout() {
    try {
      await signOut(auth)
      setPhoneVerified(false)
      setPhone('')
      setError('')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  function saveUsername() {
    // Username is auto-assigned from phone verification
    // No need to manually save
    localStorage.setItem(`username_${user.uid}`, username)
    setShowUsernameInput(false)
  }

  if (loading) {
    return <div style={styles.container}><p>Loading...</p></div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Meet Presence</h1>
        <p style={styles.subtitle}>Ask until there is no doubts lefts</p>

        {!user || !phoneVerified ? (
          <div style={styles.authSection}>
            <p style={styles.text}>Enter your phone number to access:</p>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              style={styles.input}
              onKeyPress={(e) => e.key === 'Enter' && verifyPhone()}
              disabled={user !== null && phoneVerified}
            />
            {error && <p style={styles.error}>{error}</p>}
            <button onClick={verifyPhone} style={styles.primaryButton} disabled={user !== null && phoneVerified}>
              {user ? 'Verify' : 'Verify & Continue'}
            </button>
          </div>
        ) : (
          <div style={styles.authSection}>
            {showUsernameInput ? (
              <>
                <p style={styles.text}>Your assigned username:</p>
                <p style={styles.username}>{username}</p>
                <button onClick={saveUsername} style={styles.primaryButton}>
                  Confirm
                </button>
              </>
            ) : (
              <>
                <p style={styles.text}>Welcome,</p>
                <p style={styles.username}>{username}</p>
                <div style={styles.buttonGroup}>
                  <Link href="/dashboard">
                    <button style={styles.primaryButton}>Go to Dashboard</button>
                  </Link>
                  <button onClick={logout} style={styles.secondaryButton}>
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
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
    padding: '40px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#333',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '30px',
  },
  authSection: {
    marginTop: '20px',
  },
  text: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '10px',
  },
  username: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#4285F4',
    marginBottom: '20px',
    padding: '10px',
    backgroundColor: '#f0f7ff',
    borderRadius: '4px',
  },
  email: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px',
    padding: '10px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginBottom: '15px',
    boxSizing: 'border-box',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  error: {
    color: '#d32f2f',
    fontSize: '14px',
    marginBottom: '15px',
    padding: '10px',
    backgroundColor: '#ffebee',
    borderRadius: '4px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryButton: {
    padding: '12px 24px',
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
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
}