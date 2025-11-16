import './globals.css'

export const metadata = {
  title: 'Meet Presence',
  description: 'One-on-one doubt clearing with presence indicator',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main style={{ padding: 0, fontFamily: 'system-ui, sans-serif' }}>{children}</main>
      </body>
    </html>
  )
}