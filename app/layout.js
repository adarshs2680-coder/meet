'use client'

import { useEffect } from 'react'
import './globals.css'

export const metadata = {
  title: 'Meet Presence',
  description: 'One-on-one doubt clearing with presence indicator',
}

export default function RootLayout({ children }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then(() => console.log("Firebase SW registered"))
        .catch((err) => console.error("SW registration failed:", err));
    }
  }, [])

  return (
    <html lang="en">
      <body>
        <main style={{ padding: 0, fontFamily: 'system-ui, sans-serif' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
