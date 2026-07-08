import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

/**
 * Netlify Cron Syntax: Runs every hour to sync scores and calculate points
 * To configure this on Netlify, you can also add the following to your netlify.toml:
 * 
 * [[plugins]]
 *   package = "@netlify/plugin-nextjs"
 * 
 * [functions."update-scores"]
 *   schedule = "0 * * * *"
 */
export const config = {
  schedule: "0 * * * *"
}

export const dynamic = 'force-dynamic'

const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4'
const WORLD_CUP_COMPETITION = 'WC'

type FootballDataMatch = {
  id: number
  utcDate: string
  status: string
  score?: {
    fullTime?: {
      home: number | null
      away: number | null
    }
  }
}

function toStableUuid(value: string) {
  const hash = createHash('sha1').update(value).digest('hex')
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-${['8', '9', 'a', 'b'][parseInt(hash.slice(16, 17), 16) % 4]}${hash.slice(17, 20)}-${hash.slice(20, 32)}`
}

function calculatePoints(homeScore: number, awayScore: number, homePred: number, awayPred: number): number {
  // Exact match: 3 points
  if (homeScore === homePred && awayScore === awayPred) {
    return 3
  }

  // Correct outcome (win/draw/loss): 1 point
  const actualOutcome = Math.sign(homeScore - awayScore)
  const predictedOutcome = Math.sign(homePred - awayPred)

  if (actualOutcome === predictedOutcome) {
    return 1
  }

  // Wrong outcome: 0 points
  return 0
}

export async function GET() {
  console.log('[update-scores] Sync started')

  try {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

    if (!apiKey || !supabaseUrl || !supabaseKey) {
      console.error('[update-scores] Missing credentials')
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 500 })
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // 1. Fetch matches from Football-Data API
    const response = await fetch(`${FOOTBALL_DATA_BASE_URL}/competitions/${WORLD_CUP_COMPETITION}/matches`, {
      headers: { 'X-Auth-Token': apiKey },
      next: { revalidate: 0 }
    })

    if (!response.ok) {
      throw new Error(`Football-Data API error: ${response.status}`)
    }

    const data = await response.json()
    const apiMatches: FootballDataMatch[] = data.matches || []

    // Filter for finished matches that have scores
    const finishedMatches = apiMatches.filter(m => 
      m.status === 'FINISHED' && 
      m.score?.fullTime?.home !== null && 
      m.score?.fullTime?.away !== null
    )

    console.log(`[update-scores] Found ${finishedMatches.length} finished matches in API`)

    if (finishedMatches.length === 0) {
      return NextResponse.json({ success: true, message: 'No finished matches to process' })
    }

    let totalUpdatedMatches = 0
    let totalUpdatedPredictions = 0
    const affectedUserIds = new Set<string>()

    // 2. Process each finished match
    for (const apiMatch of finishedMatches) {
      const matchId = toStableUuid(`wc-${apiMatch.id}`)
      const homeScore = apiMatch.score!.fullTime!.home!
      const awayScore = apiMatch.score!.fullTime!.away!

      // Update match in Supabase
      const { error: matchUpdateError } = await supabase
        .from('matches')
        .update({
          home_score: homeScore,
          away_score: awayScore,
          status: 'finished'
        })
        .eq('id', matchId)

      if (matchUpdateError) {
        console.error(`[update-scores] Error updating match ${matchId}:`, matchUpdateError)
        continue
      }
      
      totalUpdatedMatches++

      // 3. Fetch predictions for this match
      const { data: predictions, error: predError } = await supabase
        .from('predictions')
        .select('*')
        .eq('match_id', matchId)

      if (predError || !predictions) {
        console.error(`[update-scores] Error fetching predictions for match ${matchId}:`, predError)
        continue
      }

      // 4. Calculate and update points for each prediction
      for (const pred of predictions) {
        const points = calculatePoints(homeScore, awayScore, pred.home_prediction, pred.away_prediction)
        
        const { error: updatePredError } = await supabase
          .from('predictions')
          .update({ points_earned: points })
          .eq('id', pred.id)

        if (!updatePredError) {
          totalUpdatedPredictions++
          affectedUserIds.add(pred.user_id)
        }
      }
    }

    // 5. Update total points in profiles table for all affected users
    console.log(`[update-scores] Updating points for ${affectedUserIds.size} users`)
    
    for (const userId of affectedUserIds) {
      const { data: userPreds, error: sumError } = await supabase
        .from('predictions')
        .select('points_earned')
        .eq('user_id', userId)

      if (sumError || !userPreds) continue

      const totalPoints = userPreds.reduce((sum, p) => sum + (p.points_earned || 0), 0)

      await supabase
        .from('profiles')
        .update({ total_points: totalPoints })
        .eq('id', userId)
    }

    return NextResponse.json({
      success: true,
      updatedMatches: totalUpdatedMatches,
      updatedPredictions: totalUpdatedPredictions,
      usersAffected: affectedUserIds.size
    })

  } catch (error) {
    console.error('[update-scores] Route error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
