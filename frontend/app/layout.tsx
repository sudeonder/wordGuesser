import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Word Guessing Game',
  description: 'Guess the word using embedding similarity',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
