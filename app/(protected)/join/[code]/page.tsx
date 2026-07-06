import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Trophy, Users, CheckCircle, Shield } from 'lucide-react'
import Link from 'next/link'

interface JoinPageProps {
  params: Promise<{ code: string }>
}

export default async function JoinLeaguePage({ params }: JoinPageProps) {
  // בגרסאות Next.js החדשות חייבים לעשות await ל-params
  const resolvedParams = await params
  const inviteCode = resolvedParams.code.toUpperCase()
  
  const supabase = await createClient()

  // 1. Fetch the league details
  const { data: league } = await supabase
    .from('leagues')
    .select(`
      id,
      name,
      description,
      invite_code,
      owner_id,
      profiles (username)
    `)
    .eq('invite_code', inviteCode)
    .single()

  if (!league) {
    notFound()
  }

  // 2. Fetch current user (משתמש כבר מחובר כי הדף נמצא תחת קבוצת protected)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 3. Check if already a member
  const { data: membership } = await supabase
    .from('league_members')
    .select('id')
    .eq('league_id', league.id)
    .eq('user_id', user.id)
    .single()

  if (membership) {
    redirect(`/leagues/${league.id}`)
  }

  // Fetch current member count
  const { count: memberCount } = await supabase
    .from('league_members')
    .select('*', { count: 'exact', head: true })
    .eq('league_id', league.id)

  // Server Action להצטרפות לליגה
  const handleJoin = async () => {
    'use server'
    const joinSupabase = await createClient()
    const { data: { user: actionUser } } = await joinSupabase.auth.getUser()

    if (actionUser) {
      await joinSupabase.from('league_members').insert({
        league_id: league.id,
        user_id: actionUser.id,
      })
    }

    redirect(`/leagues/${league.id}`)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="glass-card p-8 max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mx-auto">
          <Trophy className="w-8 h-8 text-indigo-400" />
        </div>

        <div>
          <span className="badge badge-brand mb-2">Private League Invite</span>
          <h1 className="text-2xl font-bold text-white mt-1">{league.name}</h1>
          {league.description && (
            <p className="text-slate-400 text-sm mt-2">{league.description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 border-y border-slate-700/40 py-4">
          <div className="text-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Created By</span>
            <span className="font-semibold text-slate-200 text-sm flex items-center justify-center gap-1 mt-1">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              {(league.profiles as any)?.username ?? 'Predictor'}
            </span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Members</span>
            <span className="font-semibold text-slate-200 text-sm flex items-center justify-center gap-1 mt-1">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              {memberCount ?? 0}
            </span>
          </div>
        </div>

        <form action={handleJoin}>
          <button type="submit" className="btn-primary w-full py-3.5 cursor-pointer">
            <CheckCircle className="w-5 h-5" />
            Accept Invite & Join League
          </button>
        </form>

        <Link href="/dashboard" className="block text-slate-500 hover:text-slate-400 text-xs transition-colors">
          Go to Dashboard instead
        </Link>
      </div>
    </div>
  )
}