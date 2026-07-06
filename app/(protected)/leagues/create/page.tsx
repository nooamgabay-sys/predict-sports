'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateInviteCode } from '@/lib/utils'

export default function CreateLeaguePage() {
  const [name, setName] = useState('')
  const [description, setDesc] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('League name is required')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError(userError?.message ?? 'You must be logged in')
        return
      }

      const inviteCode = generateInviteCode()

      const { data: league, error: leagueErr } = await supabase
        .from('leagues')
        .insert({
          name: name.trim(),
          description: description.trim(),
          invite_code: inviteCode,
          created_by: user.id,
        } as any)
        .select()
        .single()

      if (leagueErr || !league) {
        setError(leagueErr?.message ?? 'Failed to create league')
        return
      }

      const { error: memberErr } = await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: user.id,
      })

      if (memberErr) {
        setError(memberErr.message)
        return
      }

      router.push(`/leagues/${league.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create league')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-white flex items-center gap-2">
          <Plus className="w-7 h-7 text-indigo-400" />
          Create a League
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Set up a private league and invite friends with a unique code.
        </p>
      </div>

      <div className="glass-card p-6">
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label htmlFor="league-name" className="block text-sm font-medium text-slate-300 mb-1.5">
              League Name <span className="text-red-400">*</span>
            </label>
            <input
              id="league-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Work Champions Cup"
              required
              maxLength={50}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="league-desc" className="block text-sm font-medium text-slate-300 mb-1.5">
              Description <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <textarea
              id="league-desc"
              value={description}
              onChange={e => setDesc(e.target.value)}
              placeholder="What's this league about?"
              rows={3}
              maxLength={200}
              className="input-field resize-none"
            />
          </div>

          <div className="p-4 rounded-xl bg-indigo-500/8 border border-indigo-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-indigo-300">What happens next</span>
            </div>
            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
              <li>A unique 8-character invite code is generated</li>
              <li>Share it with friends so they can join</li>
              <li>A private leaderboard is created just for your league</li>
              <li>Points update in real-time as results come in</li>
            </ul>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            id="create-league-btn"
            type="submit"
            disabled={isLoading || !name.trim()}
            className="btn-primary w-full py-3"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
            ) : (
              <><Plus className="w-4 h-4" /> Create League</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
