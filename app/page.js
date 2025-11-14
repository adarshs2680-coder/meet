'use client'
import { useEffect, useState } from 'react'
import { auth } from '../firebase/clientApp'
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import Link from 'next/link'

export default function Home() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  async function login() {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error('Login error:', error)
      alert('Login failed: ' + error.message)
    }
  }

  async function logout() {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return <div style={styles.container}><p>Loading...</p></div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Meet Presence</h1>
        <p style={styles.subtitle}>One-on-one doubt clearing with presence indicator</p>

        {!user ? (
          <div style={styles.authSection}>
            <p style={styles.text}>Please sign in with Google to continue.</p>
            <button onClick={login} style={styles.primaryButton}>
              Sign in with Google
            </button>
          </div>
        ) : (
          <div style={styles.authSection}>
            <p style={styles.text}>Signed in as:</p>
            <p style={styles.email}>{user.email}</p>
            <div style={styles.buttonGroup}>
              <Link href="/dashboard">
                <button style={styles.primaryButton}>Go to Dashboard</button>
              </Link>
              <button onClick={logout} style={styles.secondaryButton}>
                Sign Out
              </button>
            </div>
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
  email: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px',
    padding: '10px',
    backgroundColor: '#f9f9f9',
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