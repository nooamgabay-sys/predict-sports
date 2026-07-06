'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types/database'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type LeagueLeaderboardEntry = Profile & { rank: number; joined_at: string }

export function useRealtimeLeagueLeaderboard(
  leagueId: string,
  initialData: LeagueLeaderboardEntry[]
) {
  const [entries, setEntries] = useState<LeagueLeaderboardEntry[]>(initialData)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()

  const fetchLeagueLeaderboard = async () => {
    const { data } = await (supabase
      .from('league_members')
      .select(`
        joined_at,
        profiles (*)
      `)
      .eq('league_id', leagueId)
      .order('joined_at', { ascending: true }) as any)

    if (data) {
      const sorted: LeagueLeaderboardEntry[] = (data as Array<{ joined_at: string; profiles: Profile | null }>)
        .filter((lm): lm is { joined_at: string; profiles: Profile } => !!lm.profiles)
        .map(lm => ({ ...lm.profiles, joined_at: lm.joined_at }))
        .sort((a, b) => b.total_points - a.total_points)
        .map((p, i) => ({ ...p, rank: i + 1 }))

      setEntries(sorted)
    }
  }

  useEffect(() => {
    channelRef.current = supabase
      .channel(`league-leaderboard:${leagueId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        () => fetchLeagueLeaderboard()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'league_members', filter: `league_id=eq.${leagueId}` },
        () => fetchLeagueLeaderboard()
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [leagueId]) // eslint-disable-line react-hooks/exhaustive-deps

  return { entries, refetch: fetchLeagueLeaderboard }
}
