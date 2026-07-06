'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Star, TrendingUp, Calendar } from 'lucide-react'
import MatchCard from '@/components/matches/MatchCard'
import { createClient } from '@/lib/supabase/client'
import type { Match, Prediction } from '@/lib/types/database'

type DashboardClientProps = {
  userId?: string
  initialProfile?: any
}

export default function DashboardClient({ userId = '', initialProfile }: DashboardClientProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [profile, setProfile] = useState(initialProfile ?? null)
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])
  const [finishedMatches, setFinishedMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadDashboardData = async () => {
      setIsLoading(true)

      if (!userId) {
        if (isMounted) router.push('/login')
        return
      }

      const [{ data: upcomingMatchesData, error: upcomingError }, { data: finishedMatchesData, error: finishedError }] = await Promise.all([
        supabase.from('matches').select('*').eq('status', 'UPCOMING' as never).order('kickoff_time', { ascending: true }),
        supabase.from('matches').select('*').eq('status', 'FINISHED' as never).order('kickoff_time', { ascending: false }).limit(5),
      ])

      let predictionsData: Prediction[] = []
      const allMatchIds = [
        ...(upcomingMatchesData ?? []).map((match) => match.id),
        ...(finishedMatchesData ?? []).map((match) => match.id),
      ]

      if (allMatchIds.length > 0) {
        const { data: fetchedPredictions } = await supabase
          .from('predictions')
          .select('*')
          .eq('user_id', userId)
          .in('match_id', allMatchIds)

        predictionsData = fetchedPredictions ?? []
      }

      if (!isMounted) return

      setProfile(initialProfile ?? null)
      setUpcomingMatches(upcomingError ? [] : (upcomingMatchesData ?? []))
      setFinishedMatches(finishedError ? [] : (finishedMatchesData ?? []))
      setPredictions(predictionsData)
      setIsLoading(false)
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [])

  const predictionMap = useMemo(() => {
    const map: Record<string, Prediction> = {}
    predictions.forEach((prediction) => {
      map[prediction.match_id] = prediction
    })
    return map
  }, [predictions])

  const totalPredictions = predictions.length
  const pointsEarned = predictions.reduce((acc, prediction) => acc + (prediction.points_earned ?? 0), 0)

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-white">
            Welcome back, <span className="text-gradient">{profile?.username ?? 'Predictor'}</span> 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">Submit your predictions before kick-off!</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            icon: Star,
            iconColor: 'text-yellow-400',
            bg: 'bg-yellow-400/10',
            value: profile?.total_points ?? 0,
            label: 'Total Points',
          },
          {
            icon: TrendingUp,
            iconColor: 'text-brand-400',
            bg: 'bg-brand-500/10',
            value: profile?.global_rank ? `#${profile.global_rank}` : '—',
            label: 'Global Rank',
          },
          {
            icon: Calendar,
            iconColor: 'text-indigo-400',
            bg: 'bg-indigo-500/10',
            value: totalPredictions,
            label: 'Predictions',
          },
          {
            icon: Trophy,
            iconColor: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            value: pointsEarned,
            label: 'Points Earned',
          },
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
              <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
            </div>
            <div className="text-2xl font-black text-white">{stat.value}</div>
            <div className="text-xs text-slate-400">{stat.label}</div>
          </div>
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-400" />
            Upcoming Matches
          </h2>
          <span className="badge badge-brand">{upcomingMatches.length} matches</span>
        </div>

        {isLoading ? (
          <div className="glass-card p-10 text-center text-slate-400">Loading matches…</div>
        ) : upcomingMatches.length > 0 ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {upcomingMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                userPrediction={predictionMap[match.id] ?? null}
                userId={userId}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card p-10 text-center">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No upcoming matches right now. Check back soon!</p>
          </div>
        )}
      </section>

      {finishedMatches.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-xl text-white flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-emerald-400" />
            Recent Results
          </h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {finishedMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                userPrediction={predictionMap[match.id] ?? null}
                userId={userId}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
