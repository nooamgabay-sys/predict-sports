import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Plus, Trophy, ArrowRight, Hash } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Leagues — PredictSports',
  description: 'Create and manage your private prediction leagues',
}

export const revalidate = 60

export default async function LeaguesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Leagues the user is a member of
  const { data: memberships } = await supabase
    .from('league_members')
    .select(`
      joined_at,
      leagues (
        id, name, description, invite_code, owner_id, created_at,
        league_members (count)
      )
    `)
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  const leagues = memberships
    ?.map(m => m.leagues)
    .filter(Boolean) ?? []

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-400" />
            My Leagues
          </h1>
          <p className="text-slate-400 text-sm mt-1">Compete with friends in private leagues</p>
        </div>
        <Link href="/leagues/create" className="btn-primary w-fit">
          <Plus className="w-4 h-4" />
          Create League
        </Link>
      </div>

      {/* Join by code */}
      <JoinByCodeForm userId={user.id} />

      {/* Leagues grid */}
      {leagues.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {leagues.map((league: any) => (
            <Link
              key={league.id}
              href={`/leagues/${league.id}`}
              className="glass-card p-5 group hover:border-slate-600/80 hover:shadow-card-hover transition-all duration-300 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-indigo-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="font-bold text-white group-hover:text-brand-300 transition-colors">
                  {league.name}
                </h3>
                {league.description && (
                  <p className="text-slate-500 text-xs mt-1 line-clamp-2">{league.description}</p>
                )}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-700/40">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Users className="w-3.5 h-3.5" />
                  <span>{league.league_members?.[0]?.count ?? 0} members</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Hash className="w-3 h-3" />
                  <span className="font-mono">{league.invite_code}</span>
                </div>
              </div>
              {league.owner_id === user.id && (
                <span className="badge badge-brand w-fit text-[10px]">Owner</span>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <Users className="w-14 h-14 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg mb-2">No leagues yet</h3>
          <p className="text-slate-400 text-sm mb-6">
            Create your first league and invite friends, or join one with an invite code.
          </p>
          <Link href="/leagues/create" className="btn-primary inline-flex">
            <Plus className="w-4 h-4" />
            Create Your First League
          </Link>
        </div>
      )}
    </div>
  )
}

function JoinByCodeForm({ userId }: { userId: string }) {
  return (
    <form action="/api/leagues/join" method="POST" className="glass-card p-4">
      <p className="text-sm font-medium text-slate-300 mb-3">Have an invite code?</p>
      <div className="flex gap-3">
        <input
          name="invite_code"
          type="text"
          placeholder="Enter 8-character code (e.g. AB12CD34)"
          maxLength={8}
          className="input-field flex-1 uppercase font-mono text-sm tracking-wider"
        />
        <input type="hidden" name="user_id" value={userId} />
        <button type="submit" className="btn-secondary px-4 py-2.5 flex-shrink-0">
          Join
        </button>
      </div>
    </form>
  )
}
