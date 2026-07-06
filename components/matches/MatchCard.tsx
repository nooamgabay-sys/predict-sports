'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Clock, Lock, CheckCircle2, Loader2, Edit2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Match, Prediction } from '@/lib/types/database'
import { formatMatchDate, isMatchLocked, getPointsLabel, cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface MatchCardProps {
  match: Match
  userPrediction: Prediction | null
  userId: string
}

export default function MatchCard({ match, userPrediction, userId }: MatchCardProps) {
  const prediction = userPrediction as any

  const [homeScore, setHomeScore] = useState<string>(
    prediction?.home_prediction?.toString() ?? ''
  )
  const [awayScore, setAwayScore] = useState<string>(
    prediction?.away_prediction?.toString() ?? ''
  )
  const [editing, setEditing]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted]   = useState(!!userPrediction)
  const router = useRouter()
  const supabase = createClient()

  const normalizedStatus = match.status?.toLowerCase()
  const locked = isMatchLocked(match.kickoff_time, normalizedStatus ?? '')

  const handleSubmit = async () => {
    const home = parseInt(homeScore)
    const away = parseInt(awayScore)

    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      setError('Please enter valid scores (0 or higher)')
      return
    }

    setError(null)
    startTransition(async () => {
      const payload = {
        user_id: userId,
        match_id: match.id,
        home_prediction: home,
        away_prediction: away,
      } as any

      const { error: dbError } = await supabase
        .from('predictions')
        .upsert(payload, { onConflict: 'user_id,match_id' })

      if (dbError) {
        setError(dbError.message)
      } else {
        setSubmitted(true)
        setEditing(false)
        router.refresh()
      }
    })
  }

  const points = getPointsLabel(userPrediction?.points_earned)
  const isFinished = normalizedStatus === 'finished'

  const getStatusBadge = () => {
    if (normalizedStatus === 'live') return { label: '● LIVE', cls: 'badge-danger animate-pulse' }
    if (normalizedStatus === 'finished') return { label: 'FT', cls: 'badge-neutral' }
    return { label: formatMatchDate(match.kickoff_time), cls: 'badge-neutral text-xs' }
  }

  const statusBadge = getStatusBadge()

  return (
    <div
      className={cn(
        'glass-card p-5 flex flex-col gap-4 transition-all duration-300',
        'hover:border-slate-600/80 hover:shadow-card-hover',
        isFinished && 'border-slate-700/30 opacity-90'
      )}
    >
      {/* Competition + Status */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {match.competition}
        </span>
        <span className={`badge ${statusBadge.cls}`}>{statusBadge.label}</span>
      </div>

      {/* Teams + Score */}
      <div className="flex items-center justify-between gap-3">
        {/* Home team */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <TeamLogo logo={match.home_team_logo} name={match.home_team} />
          <span className="text-xs font-semibold text-white text-center leading-tight line-clamp-2">
            {match.home_team}
          </span>
        </div>

        {/* Score display */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isFinished ? (
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-white">{match.home_score}</span>
              <span className="text-lg font-bold text-slate-500">—</span>
              <span className="text-3xl font-black text-white">{match.away_score}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {locked ? (
                <Lock className="w-4 h-4 text-slate-600" />
              ) : (
                <Clock className="w-4 h-4 text-slate-500" />
              )}
            </div>
          )}
        </div>

        {/* Away team */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <TeamLogo logo={match.away_team_logo} name={match.away_team} />
          <span className="text-xs font-semibold text-white text-center leading-tight line-clamp-2">
            {match.away_team}
          </span>
        </div>
      </div>

      {/* Prediction section */}
      <div className="border-t border-slate-700/40 pt-4">
        {isFinished && userPrediction ? (
          /* Show result + points earned */
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Your prediction:</span>
              <span className="font-bold text-white">
                {prediction.home_prediction} – {prediction.away_prediction}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Points earned:</span>
              <span className={cn('font-bold', points.color)}>{points.label}</span>
            </div>
          </div>
        ) : isFinished ? (
          <p className="text-center text-slate-500 text-xs">No prediction submitted</p>
        ) : locked ? (
          /* Match started, show submitted prediction or locked msg */
          submitted || userPrediction ? (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Prediction locked in</span>
              </div>
              <span className="font-bold text-white">
                {prediction?.home_prediction ?? homeScore} – {prediction?.away_prediction ?? awayScore}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-500 text-sm justify-center">
              <Lock className="w-4 h-4" />
              <span>Predictions closed</span>
            </div>
          )
        ) : (
          /* Prediction input */
          <div>
            {submitted && !editing ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Predicted: <strong>{homeScore} – {awayScore}</strong>
                  </span>
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Edit prediction"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 text-center">Your prediction</p>
                <div className="flex items-center justify-center gap-3">
                  <input
                    id={`home-score-${match.id}`}
                    type="number"
                    min="0"
                    max="20"
                    value={homeScore}
                    onChange={e => setHomeScore(e.target.value)}
                    placeholder="0"
                    className="score-input"
                    aria-label={`${match.home_team} score prediction`}
                  />
                  <span className="text-slate-400 font-bold text-xl">—</span>
                  <input
                    id={`away-score-${match.id}`}
                    type="number"
                    min="0"
                    max="20"
                    value={awayScore}
                    onChange={e => setAwayScore(e.target.value)}
                    placeholder="0"
                    className="score-input"
                    aria-label={`${match.away_team} score prediction`}
                  />
                </div>
                {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                <button
                  id={`submit-prediction-${match.id}`}
                  onClick={handleSubmit}
                  disabled={isPending || homeScore === '' || awayScore === ''}
                  className="btn-primary w-full py-2.5 text-sm"
                >
                  {isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  ) : submitted ? 'Update Prediction' : 'Submit Prediction'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TeamLogo({ logo, name }: { logo: string; name: string }) {
  const [imgError, setImgError] = useState(false)

  if (!logo || imgError) {
    return (
      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-sm font-bold">
        {name[0]}
      </div>
    )
  }

  return (
    <div className="w-10 h-10 relative">
      <Image
        src={logo}
        alt={name}
        fill
        className="object-contain"
        onError={() => setImgError(true)}
        unoptimized
      />
    </div>
  )
}
