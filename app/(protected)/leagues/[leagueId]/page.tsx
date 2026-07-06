import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LeagueLeaderboardClient from '@/components/leagues/LeagueLeaderboardClient'
import InviteSection from '@/components/leagues/InviteSection'
import { Trophy, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 30

export async function generateMetadata({ params }: { params: { leagueId: string } }): Promise<Metadata> {
  const supabase = await createClient()
  const { data: league } = await supabase
    .from('leagues')
    .select('name')
    .eq('id', params.leagueId)
    .single()

  return {
    title: league ? `${league.name} — PredictSports` : 'League — PredictSports',
  }
}

export default async function LeagueDetailPage({
  params,
}: {
  params: { leagueId: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch league
  const { data: league } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', params.leagueId)
    .single()

  if (!league) notFound()

  // Verify membership
  const { data: membership } = await supabase
    .from('league_members')
    .select('id')
    .eq('league_id', params.leagueId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    // Not a member — redirect to join
    redirect(`/join/${league.invite_code}`)
  }

  // Fetch members with profiles
  const { data: members } = await supabase
    .from('league_members')
    .select(`
      joined_at,
      profiles (*)
    `)
    .eq('league_id', params.leagueId)

  const initialLeaderboard = (members ?? [])
    .filter(m => m.profiles)
    .map(m => ({ ...(m.profiles as any), joined_at: m.joined_at }))
    .sort((a: any, b: any) => b.total_points - a.total_points)
    .map((p: any, i: number) => ({ ...p, rank: i + 1 }))

  return (
    <div className="animate-fade-in space-y-6">
      {/* Back */}
      <Link href="/leagues" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        All Leagues
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
            <Trophy className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">{league.name}</h1>
            {league.description && (
              <p className="text-slate-400 text-sm mt-0.5">{league.description}</p>
            )}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <Users className="w-3 h-3" />
              <span>{initialLeaderboard.length} members</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invite section */}
      <InviteSection
        inviteCode={league.invite_code}
        leagueId={league.id}
        isOwner={league.owner_id === user.id}
      />

      {/* League leaderboard (real-time) */}
      <div>
        <h2 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          League Standings
        </h2>
        <LeagueLeaderboardClient
          leagueId={params.leagueId}
          initialData={initialLeaderboard}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}
