import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const inviteCode = formData.get('invite_code')?.toString().toUpperCase().trim()
    const userId = formData.get('user_id')?.toString()

    if (!inviteCode || !userId) {
      return NextResponse.redirect(
        new URL('/leagues?error=missing_data', request.url)
      )
    }

    const supabase = await createClient()

    // Find the league
    const { data: league, error: leagueErr } = await supabase
      .from('leagues')
      .select('id')
      .eq('invite_code', inviteCode)
      .single()

    if (leagueErr || !league) {
      return NextResponse.redirect(
        new URL('/leagues?error=invalid_code', request.url)
      )
    }

    // Try joining
    const { error: joinErr } = await supabase
      .from('league_members')
      .insert({
        league_id: league.id,
        user_id: userId,
      })

    if (joinErr) {
      // Check if already a member (PGRST116 / unique constraint violation)
      if (joinErr.code === '23505') {
        return NextResponse.redirect(
          new URL(`/leagues/${league.id}`, request.url)
        )
      }
      return NextResponse.redirect(
        new URL(`/leagues?error=join_failed&msg=${encodeURIComponent(joinErr.message)}`, request.url)
      )
    }

    return NextResponse.redirect(
      new URL(`/leagues/${league.id}`, request.url)
    )
  } catch (error: any) {
    return NextResponse.redirect(
      new URL(`/leagues?error=server_error&msg=${encodeURIComponent(error?.message ?? '')}`, request.url)
    )
  }
}
