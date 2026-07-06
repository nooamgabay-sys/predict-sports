'use client'

import { useRealtimeLeaderboard } from '@/lib/hooks/useRealtimeLeaderboard'
import type { Profile } from '@/lib/types/database'
import { cn } from '@/lib/utils'
import { Trophy, Star } from 'lucide-react'

interface LeaderboardTableProps {
  initialData: Profile[]
  currentUserId: string
}

export default function LeaderboardTable({ initialData, currentUserId }: LeaderboardTableProps) {
  const { entries } = useRealtimeLeaderboard(initialData)

  if (entries.length === 0) {
    return (
      <div className="glass-card p-10 text-center">
        <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">No players yet. Be the first to predict!</p>
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[3rem_1fr_7rem] sm:grid-cols-[3rem_1fr_8rem_8rem] gap-3 px-4 py-3 border-b border-slate-700/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <div className="text-center">Rank</div>
        <div>Player</div>
        <div className="text-right hidden sm:block">Predictions</div>
        <div className="text-right">Points</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-700/30">
        {entries.map((entry, index) => {
          const rank = entry.global_rank ?? index + 1
          const isCurrentUser = entry.id === currentUserId
          const isTop3 = rank <= 3

          return (
            <div
              key={entry.id}
              className={cn(
                'grid grid-cols-[3rem_1fr_7rem] sm:grid-cols-[3rem_1fr_8rem_8rem] gap-3 px-4 py-3.5 items-center transition-colors duration-150',
                isCurrentUser
                  ? 'bg-brand-500/8 border-l-2 border-brand-500'
                  : 'hover:bg-slate-700/20',
                rank === 1 && 'bg-yellow-500/5',
                rank === 2 && 'bg-slate-300/3',
                rank === 3 && 'bg-amber-600/3',
              )}
            >
              {/* Rank */}
              <div className="text-center">
                {rank === 1 ? (
                  <span className="text-xl">🥇</span>
                ) : rank === 2 ? (
                  <span className="text-xl">🥈</span>
                ) : rank === 3 ? (
                  <span className="text-xl">🥉</span>
                ) : (
                  <span className={cn(
                    'text-sm font-bold',
                    isCurrentUser ? 'text-brand-400' : 'text-slate-500'
                  )}>
                    #{rank}
                  </span>
                )}
              </div>

              {/* Player */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                    rank === 1 ? 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-400/30' :
                    rank === 2 ? 'bg-gray-400/15 text-gray-300 ring-1 ring-gray-400/20' :
                    rank === 3 ? 'bg-amber-600/20 text-amber-500 ring-1 ring-amber-500/20' :
                    isCurrentUser ? 'bg-brand-500/20 text-brand-400 ring-1 ring-brand-500/30' :
                    'bg-slate-700/60 text-slate-300'
                  )}
                >
                  {entry.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0">
                  <div className={cn(
                    'font-semibold text-sm truncate',
                    isCurrentUser ? 'text-brand-300' : 'text-white'
                  )}>
                    {entry.username}
                    {isCurrentUser && (
                      <span className="ml-1.5 text-[10px] text-brand-400 font-normal">(you)</span>
                    )}
                  </div>
                  {isTop3 && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {Array.from({ length: Math.min(rank === 1 ? 3 : rank === 2 ? 2 : 1, 3) }).map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Predictions count (desktop) */}
              <div className="text-right hidden sm:block">
                <span className="text-sm text-slate-400">—</span>
              </div>

              {/* Points */}
              <div className="text-right">
                <span className={cn(
                  'text-lg font-black',
                  rank === 1 ? 'text-gradient-gold' :
                  isCurrentUser ? 'text-brand-400' :
                  'text-white'
                )}>
                  {entry.total_points}
                </span>
                <span className="text-xs text-slate-500 ml-1">pts</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
