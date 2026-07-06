import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable'
import { BarChart3, Zap } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Global Leaderboard — PredictSports',
  description: 'See how you rank against all predictors worldwide. Updated in real-time.',
}

export const revalidate = 30

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('total_points', { ascending: false })
    .limit(100)

  const currentUserRank = profiles?.findIndex(p => p.id === user.id) ?? -1

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-brand-400" />
            Global Leaderboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Top 100 predictors · Updated in real-time</p>
        </div>
        <div className="flex items-center gap-2 badge badge-brand animate-pulse-glow">
          <Zap className="w-3.5 h-3.5" />
          Live
        </div>
      </div>

      {/* Your current rank highlight */}
      {currentUserRank >= 0 && (
        <div className="glass-card p-4 border-brand-500/30 bg-brand-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Your Position</p>
              <p className="font-bold text-white text-lg">
                #{profiles?.[currentUserRank]?.global_rank ?? currentUserRank + 1}
                <span className="text-slate-400 font-normal text-sm ml-2">
                  of {profiles?.length} predictors
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-0.5">Total Points</p>
              <p className="font-black text-2xl text-gradient-gold">
                {profiles?.[currentUserRank]?.total_points ?? 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard table — client component for realtime */}
      <LeaderboardTable initialData={profiles ?? []} currentUserId={user.id} />
    </div>
  )
}
