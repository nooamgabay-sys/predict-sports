import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, isPast } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMatchDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return format(date, 'EEE dd MMM, HH:mm');
}

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
}

export function isMatchLocked(matchDate: string, status: string): boolean {
  const normalizedStatus = status?.toLowerCase()
  return normalizedStatus !== 'upcoming' || isPast(new Date(matchDate))
}

export function getOutcome(home: number, away: number): 'home' | 'draw' | 'away' {
  if (home > away) return 'home'
  if (home < away) return 'away'
  return 'draw'
}

export function scorePoints(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number
): number {
  if (predHome === actualHome && predAway === actualAway) return 3
  if (getOutcome(predHome, predAway) === getOutcome(actualHome, actualAway)) return 1
  return 0
}

export function getRankBadge(rank: number): {
  color: string
  bg: string
  label: string
} {
  if (rank === 1) return { color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: '🥇' }
  if (rank === 2) return { color: 'text-gray-300',   bg: 'bg-gray-300/10',   label: '🥈' }
  if (rank === 3) return { color: 'text-amber-600',  bg: 'bg-amber-600/10',  label: '🥉' }
  return { color: 'text-slate-400', bg: 'bg-slate-700/30', label: `#${rank}` }
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function getPointsLabel(points: number | null | undefined): {
  label: string
  color: string
} {
  if (points === null || points === undefined)
    return { label: 'Pending', color: 'text-slate-400' }
  if (points === 3) return { label: '+3 pts ⭐', color: 'text-emerald-400' }
  if (points === 1) return { label: '+1 pt',     color: 'text-brand-400' }
  return { label: '0 pts',          color: 'text-slate-500' }
}
