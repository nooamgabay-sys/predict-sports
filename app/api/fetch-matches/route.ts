import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4'
const WORLD_CUP_COMPETITION = 'WC'

type MatchStatus = 'UPCOMING' | 'LIVE' | 'FINISHED'

type FootballDataMatch = {
  id: number
  utcDate: string
  status: string
  stage?: string | null
  homeTeam: {
    name: string
    crest?: string | null
  }
  awayTeam: {
    name: string
    crest?: string | null
  }
  score?: {
    fullTime?: {
      home: number | null
      away: number | null
    }
  }
  competition?: {
    name?: string | null
  }
}

type MatchRow = {
  id: string
  home_team: string
  away_team: string
  kickoff_time: string
  status: MatchStatus
  stage: string | null
  home_team_logo: string
  away_team_logo: string
}

function toStableUuid(value: string) {
  const hash = createHash('sha1').update(value).digest('hex')
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-${['8', '9', 'a', 'b'][parseInt(hash.slice(16, 17), 16) % 4]}${hash.slice(17, 20)}-${hash.slice(20, 32)}`
}

function mapStatus(rawStatus?: string | null): MatchStatus {
  const status = (rawStatus ?? '').toUpperCase()

  if (['TIMED', 'SCHEDULED', 'UPCOMING'].includes(status)) return 'UPCOMING'
  if (status === 'FINISHED') return 'FINISHED'
  if (['IN_PLAY', 'PAUSED', 'LIVE', 'HALF_TIME', 'INTERRUPTED', 'AWARDED'].includes(status)) return 'LIVE'
  return status as MatchStatus
}

function normalizeMatch(match: FootballDataMatch): MatchRow {
  const homeTeam = match.homeTeam?.name?.trim() ?? 'Unknown'
  const awayTeam = match.awayTeam?.name?.trim() ?? 'Unknown'

  return {
    id: toStableUuid(`wc-${match.id}`),
    home_team: homeTeam,
    away_team: awayTeam,
    kickoff_time: match.utcDate,
    status: mapStatus(match.status),
    stage: match.stage ?? null,
    home_team_logo: match.homeTeam?.crest || '',
    away_team_logo: match.awayTeam?.crest || '',
  }
}

async function fetchWithRetry(url: string, headers: Record<string, string>, retries = 2) {
  let lastError: unknown

  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(url, {
        headers,
        next: { revalidate: 60 },
        signal: controller.signal,
      })

      if (response.status === 429 || response.status === 503) {
        const retryAfter = Number(response.headers.get('retry-after') || 0)
        const delayMs = Math.max(retryAfter * 1000, attempt * 2000)
        console.warn(`[fetch-matches] Rate limited or temporarily unavailable. Retrying in ${delayMs / 1000}s (attempt ${attempt}/${retries + 1})`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
        continue
      }

      return response
    } catch (error) {
      lastError = error
      console.error(`[fetch-matches] Fetch attempt ${attempt}/${retries + 1} failed:`, error)
      if (attempt > retries + 1) break
      await new Promise(resolve => setTimeout(resolve, attempt * 2000))
    } finally {
      clearTimeout(timeout)
    }
  }

  throw lastError ?? new Error('Failed to fetch matches from Football-Data.org')
}

async function fetchUpcomingMatches(): Promise<MatchRow[]> {
  console.log('[fetch-matches] Starting Football-Data.org fetch for World Cup')

  const apiKey = process.env.FOOTBALL_DATA_API_KEY

  if (!apiKey) {
    console.error('[fetch-matches] Missing FOOTBALL_DATA_API_KEY')
    return []
  }

  try {
    const response = await fetchWithRetry(
      `${FOOTBALL_DATA_BASE_URL}/competitions/${WORLD_CUP_COMPETITION}/matches`,
      {
        'X-Auth-Token': apiKey,
        Accept: 'application/json',
      }
    )

    console.log('[fetch-matches] Raw Football-Data.org response status:', response.status)

    if (!response.ok) {
      const responseText = await response.text()
      console.error('[fetch-matches] Football-Data.org request failed:', response.status, responseText)
      return []
    }

    const payload = await response.json()
    const matches = Array.isArray(payload?.matches) ? payload.matches : []

    console.log('[fetch-matches] Received matches count:', matches.length)

    const now = new Date()

    return matches
      .filter((match: FootballDataMatch) => new Date(match.utcDate) > now)
      .map((match: FootballDataMatch) => normalizeMatch(match))
      .sort((a: MatchRow, b: MatchRow) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime())
  } catch (error) {
    console.error('[fetch-matches] Error while fetching from Football-Data.org:', error)
    return []
  }
}

export async function GET() {
  console.log('[fetch-matches] Request started')

  try {
    const matches = await fetchUpcomingMatches()
    console.log('[fetch-matches] Matches prepared for upsert:', matches.length)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

    if (!supabaseUrl || !supabaseKey) {
      console.error('[fetch-matches] Missing Supabase credentials for route runtime', {
        supabaseUrl: Boolean(supabaseUrl),
        supabaseKey: Boolean(supabaseKey),
      })
      return NextResponse.json(
        { success: false, error: 'Missing Supabase credentials', imported: 0 },
        { status: 500 }
      )
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    try {
      const { error } = await supabase.from('matches').upsert(matches as never[], {
        onConflict: 'id',
        ignoreDuplicates: false,
      })

      if (error) {
        console.error('[fetch-matches] Supabase upsert error:', error)
        return NextResponse.json(
          { success: false, error: error.message, imported: 0 },
          { status: 500 }
        )
      }

      console.log('[fetch-matches] Supabase upsert succeeded')
      return NextResponse.json({
        success: true,
        imported: matches.length,
        message: 'Upcoming matches fetched and synced to Supabase.',
      })
    } catch (dbError) {
      console.error('[fetch-matches] Unexpected Supabase error:', dbError)
      return NextResponse.json(
        { success: false, error: dbError instanceof Error ? dbError.message : 'Unknown database error', imported: 0 },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[fetch-matches] Route error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error', imported: 0 },
      { status: 500 }
    )
  }
}
