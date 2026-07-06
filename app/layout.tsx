import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PredictSports — The Ultimate Sports Prediction Game',
  description: 'Predict match scores, earn points, and compete with friends in private leagues. Real-time global leaderboards.',
  keywords: ['sports prediction', 'football predictions', 'fantasy sports', 'score prediction'],
  openGraph: {
    title: 'PredictSports',
    description: 'Predict match scores, compete with friends in private leagues.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface-900">
        {children}
      </body>
    </html>
  )
}
