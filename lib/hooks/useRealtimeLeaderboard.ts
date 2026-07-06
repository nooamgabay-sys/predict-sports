'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types/database'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type LeaderboardEntry = Profile & { rank: number }

export function useRealtimeLeaderboard(initialData: Profile[]) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(
    initialData.map((p, i) => ({ ...p, rank: p.global_rank ?? i + 1 }))
  )
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(100)

    if (data) {
      setEntries(
        data.map((p, i) => ({ ...p, rank: p.global_rank ?? i + 1 }))
      )
    }
  }

  useEffect(() => {
    channelRef.current = supabase
      .channel('global-leaderboard')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        () => {
          // Re-fetch sorted leaderboard on any profile update
          fetchLeaderboard()
        }
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { entries, refetch: fetchLeaderboard }
}
