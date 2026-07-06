'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Match } from '@/lib/types/database'
import { formatMatchDate, cn } from '@/lib/utils'
import { Plus, Check, Play, Edit, Trash2, Calendar, ShieldAlert, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AdminDashboardClientProps {
  initialMatches: Match[]
}

export default function AdminDashboardClient({ initialMatches }: AdminDashboardClientProps) {
  const [matches, setMatches] = useState<Match[]>(initialMatches)
  const [activeTab, setActiveTab] = useState<'results' | 'create'>('results')
  const router = useRouter()
  const supabase = createClient()

  // Form states for creating a match
  const [homeTeam, setHomeTeam] = useState('')
  const [awayTeam, setAwayTeam] = useState('')
  const [homeLogo, setHomeLogo] = useState('')
  const [awayLogo, setAwayLogo] = useState('')
  const [competition, setCompetition] = useState('Premier League')
  const [matchDate, setMatchDate] = useState('')
  const [createPending, setCreatePending] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Scores update states
  const [editingScores, setEditingScores] = useState<Record<string, { home: string; away: string }>>({})
  const [isPending, startTransition] = useTransition()

  const refreshMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: false })
    if (data) setMatches(data)
  }

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatePending(true)
    setCreateError(null)

    if (!homeTeam || !awayTeam || !matchDate) {
      setCreateError('Please fill out all required fields')
      setCreatePending(false)
      return
    }

    const { error } = await supabase.from('matches').insert({
      home_team: homeTeam,
      away_team: awayTeam,
      home_team_logo: homeLogo,
      away_team_logo: awayLogo,
      competition,
      kickoff_time: new Date(matchDate).toISOString(),
      status: 'upcoming' as never,
    })

    if (error) {
      setCreateError(error.message)
      setCreatePending(false)
    } else {
      // Success
      setHomeTeam('')
      setAwayTeam('')
      setHomeLogo('')
      setAwayLogo('')
      setMatchDate('')
      setCreatePending(false)
      setActiveTab('results')
      refreshMatches()
      router.refresh()
    }
  }

  const startEditScore = (match: Match) => {
    setEditingScores(prev => ({
      ...prev,
      [match.id]: {
        home: match.home_score?.toString() ?? '',
        away: match.away_score?.toString() ?? '',
      },
    }))
  }

  const handleScoreChange = (matchId: string, team: 'home' | 'away', val: string) => {
    setEditingScores(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: val,
      },
    }))
  }

  const saveScoreAndFinish = (matchId: string) => {
    const scoreState = editingScores[matchId]
    if (!scoreState) return

    const home = parseInt(scoreState.home)
    const away = parseInt(scoreState.away)

    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      alert('Please enter valid scores')
      return
    }

    startTransition(async () => {
      // 1. Update match results & set status to finished
      const { error } = await supabase
        .from('matches')
        .update({
          home_score: home,
          away_score: away,
          status: 'finished',
        })
        .eq('id', matchId)

      if (error) {
        alert(error.message)
      } else {
        // Clear editing state for this match
        setEditingScores(prev => {
          const next = { ...prev }
          delete next[matchId]
          return next
        })
        await refreshMatches()
        router.refresh()
      }
    })
  }

  const startMatchLive = async (matchId: string) => {
    const { error } = await supabase
      .from('matches')
      .update({ status: 'live' })
      .eq('id', matchId)

    if (error) {
      alert(error.message)
    } else {
      refreshMatches()
      router.refresh()
    }
  }

  const deleteMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match? All predictions will be lost.')) return

    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', matchId)

    if (error) {
      alert(error.message)
    } else {
      refreshMatches()
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-slate-700/50">
        <button
          onClick={() => setActiveTab('results')}
          className={cn(
            'px-5 py-3 text-sm font-semibold border-b-2 transition-all',
            activeTab === 'results'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-white'
          )}
        >
          Manage Results
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={cn(
            'px-5 py-3 text-sm font-semibold border-b-2 transition-all',
            activeTab === 'create'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-white'
          )}
        >
          Add New Match
        </button>
      </div>

      {activeTab === 'results' ? (
        /* TAB 1: Manage Results */
        <div className="space-y-4">
          {matches.length === 0 ? (
            <div className="glass-card p-10 text-center text-slate-500">
              No matches found in the system. Use the &quot;Add New Match&quot; tab to create one.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {matches.map(match => {
                const isEditing = editingScores[match.id] !== undefined
                const scores = editingScores[match.id]

                return (
                  <div key={match.id} className="glass-card p-5 flex flex-col justify-between gap-4">
                    {/* Header info */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{match.competition}</span>
                      <span>{formatMatchDate(match.kickoff_time)}</span>
                    </div>

                    {/* Match display */}
                    <div className="flex items-center justify-between gap-3 my-2">
                      <div className="flex-1 text-center font-bold text-sm text-white truncate">
                        {match.home_team}
                      </div>

                      {/* Editing vs Display Scores */}
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={scores?.home ?? ''}
                            onChange={e => handleScoreChange(match.id, 'home', e.target.value)}
                            placeholder="0"
                            className="w-12 h-10 text-center font-bold bg-slate-800 border border-slate-600 rounded-lg text-white"
                          />
                          <span className="text-slate-500">—</span>
                          <input
                            type="number"
                            min="0"
                            value={scores?.away ?? ''}
                            onChange={e => handleScoreChange(match.id, 'away', e.target.value)}
                            placeholder="0"
                            className="w-12 h-10 text-center font-bold bg-slate-800 border border-slate-600 rounded-lg text-white"
                          />
                        </div>
                      ) : (
                        <div className="text-xl font-black text-slate-200">
                          {match.status === 'finished' ? (
                            <span>{match.home_score} – {match.away_score}</span>
                          ) : (
                            <span className="text-slate-500 text-sm italic">VS</span>
                          )}
                        </div>
                      )}

                      <div className="flex-1 text-center font-bold text-sm text-white truncate">
                        {match.away_team}
                      </div>
                    </div>

                    {/* Bottom Status + Admin Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-700/40">
                      <div>
                        {match.status === 'upcoming' && (
                          <span className="badge badge-brand">Upcoming</span>
                        )}
                        {match.status === 'live' && (
                          <span className="badge badge-danger animate-pulse">● Live</span>
                        )}
                        {match.status === 'finished' && (
                          <span className="badge badge-success">FT & Scored</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveScoreAndFinish(match.id)}
                              disabled={isPending}
                              className="btn-primary p-2 py-1 text-xs rounded-lg flex items-center gap-1 shadow-none"
                            >
                              {isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              Save & Score
                            </button>
                            <button
                              onClick={() => {
                                setEditingScores(prev => {
                                  const next = { ...prev }
                                  delete next[match.id]
                                  return next
                                })
                              }}
                              className="btn-secondary p-2 py-1 text-xs rounded-lg"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            {match.status !== 'finished' && (
                              <button
                                onClick={() => startEditScore(match)}
                                className="btn-primary p-2 py-1 text-xs rounded-lg flex items-center gap-1 shadow-none"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                Set Score
                              </button>
                            )}
                            {match.status === 'upcoming' && (
                              <button
                                onClick={() => startMatchLive(match.id)}
                                className="btn-secondary p-2 py-1 text-xs rounded-lg flex items-center gap-1"
                              >
                                <Play className="w-3.5 h-3.5 text-emerald-400" />
                                Live
                              </button>
                            )}
                            <button
                              onClick={() => deleteMatch(match.id)}
                              className="btn-danger p-2 py-1 text-xs rounded-lg"
                              title="Delete Match"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: Create Match Form */
        <div className="glass-card p-6 max-w-xl mx-auto">
          <h3 className="font-semibold text-white text-lg mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Add New Fixture
          </h3>

          <form onSubmit={handleCreateMatch} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Home Team <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={homeTeam}
                  onChange={e => setHomeTeam(e.target.value)}
                  placeholder="e.g. Manchester United"
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Away Team <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={awayTeam}
                  onChange={e => setAwayTeam(e.target.value)}
                  placeholder="e.g. Arsenal"
                  required
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Home Team Logo URL
                </label>
                <input
                  type="url"
                  value={homeLogo}
                  onChange={e => setHomeLogo(e.target.value)}
                  placeholder="https://logo.png"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Away Team Logo URL
                </label>
                <input
                  type="url"
                  value={awayLogo}
                  onChange={e => setAwayLogo(e.target.value)}
                  placeholder="https://logo.png"
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Competition Name
                </label>
                <input
                  type="text"
                  value={competition}
                  onChange={e => setCompetition(e.target.value)}
                  placeholder="e.g. Premier League"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Kick-Off Date & Time <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={matchDate}
                  onChange={e => setMatchDate(e.target.value)}
                  required
                  className="input-field"
                />
              </div>
            </div>

            {createError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {createError}
              </div>
            )}

            <button
              type="submit"
              disabled={createPending}
              className="btn-primary w-full py-3"
            >
              {createPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              {createPending ? 'Creating...' : 'Create Match Fixture'}
            </button>
          </form>

          <div className="flex items-center gap-2 text-xs text-amber-500/80 bg-amber-500/5 border border-amber-500/10 p-3 rounded-lg mt-6">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span>
              Fixtures default to status: <strong>upcoming</strong>. Score prediction starts immediately after creation.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
