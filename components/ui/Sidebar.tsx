'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Trophy, LayoutDashboard, BarChart3,
  Users, Shield, LogOut, Menu, X, Star
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types/database'
import { cn } from '@/lib/utils'

interface SidebarProps {
  profile: Profile | null
}

const navItems = [
  { href: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/leaderboard', label: 'Leaderboard', icon: BarChart3 },
  { href: '/leagues',     label: 'My Leagues',  icon: Users },
]

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-700/50">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-brand">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-white">
            Predict<span className="text-gradient">Sports</span>
          </span>
        </Link>
      </div>

      {/* Profile card */}
      {profile && (
        <div className="mx-3 mt-4 p-3 rounded-xl bg-slate-700/30 border border-slate-700/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {profile.username?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-white text-sm truncate">{profile.username}</div>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Star className="w-3 h-3 text-yellow-400" />
                <span>{profile.total_points} pts</span>
                {profile.global_rank && (
                  <span className="text-slate-600">· #{profile.global_rank}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-3 mt-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(active ? 'nav-link-active' : 'nav-link')}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </Link>
          )
        })}

        {profile?.is_admin && (
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className={cn(pathname.startsWith('/admin') ? 'nav-link-active' : 'nav-link')}
          >
            <Shield className="w-5 h-5 flex-shrink-0" />
            Admin Panel
          </Link>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6 mt-auto border-t border-slate-700/40 pt-4">
        <button
          onClick={handleLogout}
          id="logout-btn"
          className="nav-link w-full text-left text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 w-64 bg-surface-800 border-r border-slate-700/50 z-40">
        <NavContent />
      </aside>

      {/* Mobile topbar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-4 bg-surface-800/95 backdrop-blur-sm border-b border-slate-700/50">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-base text-white">
            Predict<span className="text-gradient">Sports</span>
          </span>
        </Link>
        <button
          id="mobile-menu-btn"
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg hover:bg-slate-700 text-slate-300 transition-colors"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside className="absolute inset-y-0 left-0 w-72 bg-surface-800 border-r border-slate-700/50 flex flex-col">
            <NavContent />
          </aside>
        </div>
      )}

      {/* Mobile top padding */}
      <div className="lg:hidden h-14" />
    </>
  )
}
