'use client'

import { useState } from 'react'
import { Copy, Check, Share2, ShieldAlert } from 'lucide-react'

interface InviteSectionProps {
  inviteCode: string
  leagueId: string
  isOwner: boolean
}

export default function InviteSection({ inviteCode, leagueId, isOwner }: InviteSectionProps) {
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const joinLink = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${inviteCode}`
    : ''

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'code') {
        setCopiedCode(true)
        setTimeout(() => setCopiedCode(false), 2000)
      } else {
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="glass-card p-6 grid sm:grid-cols-2 gap-6 items-center border-indigo-500/10">
      <div className="space-y-2">
        <h3 className="font-semibold text-white text-base flex items-center gap-2">
          <Share2 className="w-4 h-4 text-indigo-400" />
          Invite Your Friends
        </h3>
        <p className="text-slate-400 text-xs leading-relaxed">
          Share the invite code or direct link with friends. Anyone with the code can join this league and compete.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {/* Code copy */}
        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-xl p-2 pl-4">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Invite Code</span>
            <span className="font-mono font-bold text-white text-base tracking-wider">{inviteCode}</span>
          </div>
          <button
            onClick={() => copyToClipboard(inviteCode, 'code')}
            className="btn-secondary p-2.5 rounded-lg flex-shrink-0 hover:bg-slate-700 hover:text-white"
            title="Copy Code"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Link copy */}
        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-xl p-2 pl-4">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Direct Invite Link</span>
            <span className="text-slate-400 text-xs truncate block pr-2">{joinLink}</span>
          </div>
          <button
            onClick={() => copyToClipboard(joinLink, 'link')}
            className="btn-secondary p-2.5 rounded-lg flex-shrink-0 hover:bg-slate-700 hover:text-white"
            title="Copy Link"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2 text-[10px] text-indigo-400/80 mt-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>You are the administrator of this league.</span>
          </div>
        )}
      </div>
    </div>
  )
}
