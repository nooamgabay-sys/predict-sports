import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminDashboardClient from '@/components/admin/AdminDashboardClient'
import { Shield } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard — PredictSports',
  description: 'Manage matches, create fixtures, and enter official scores',
}

export const revalidate = 0 // Admin dashboard must always be fresh

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile to verify admin status
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    // Access denied
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 text-sm max-w-sm">
          You do not have administrative privileges to access this area.
        </p>
      </div>
    )
  }

  // Fetch all matches to display
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: false })

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-white flex items-center gap-2.5">
          <Shield className="w-7 h-7 text-indigo-400" />
          Admin Panel
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Create new matches and update official final scores to trigger automatic scoring.
        </p>
      </div>

      <AdminDashboardClient initialMatches={matches ?? []} />
    </div>
  )
}
