import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In — PredictSports',
  description: 'Sign in to your PredictSports account',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surface-glow">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-brand-500/5 blur-[120px]" />
      </div>
      <div className="relative w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
