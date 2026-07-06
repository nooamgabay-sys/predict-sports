import Link from 'next/link'
import { Trophy, Zap, Users, BarChart3, Star, ChevronRight, Target } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-800/50 backdrop-blur-md bg-surface-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">
              Predict<span className="text-gradient">Sports</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm px-4 py-2">
              Sign In
            </Link>
            <Link href="/signup" className="btn-primary text-sm px-4 py-2">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4">
        {/* Background glow effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/5 blur-[100px]" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-indigo-500/5 blur-[80px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-8 animate-fade-in">
            <Zap className="w-4 h-4" />
            Real-time leaderboards · Instant point updates
          </div>

          <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-7xl text-white leading-[1.05] mb-6 animate-slide-up">
            Predict. Compete.{' '}
            <span className="text-gradient">Dominate.</span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in">
            The ultimate sports prediction game. Forecast match scores, challenge friends
            in private leagues, and climb the global leaderboard in real time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link href="/signup" className="btn-primary text-base px-8 py-4">
              Start Predicting Free
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="btn-secondary text-base px-8 py-4">
              Sign In
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-4 max-w-md mx-auto">
            {[
              { value: '3 pts', label: 'Exact score' },
              { value: '1 pt',  label: 'Right outcome' },
              { value: 'Live',  label: 'Leaderboards' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-4 text-center">
                <div className="text-2xl font-black text-gradient-gold">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4">
              Everything you need to win
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              A full-featured prediction platform with real-time updates, private leagues, and fair scoring.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                color: 'text-brand-400',
                bg:    'bg-brand-500/10',
                title: 'Smart Predictions',
                desc:  'Submit score predictions before kick-off. Predictions lock automatically when the match starts — no late entries.',
              },
              {
                icon: Star,
                color: 'text-yellow-400',
                bg:    'bg-yellow-500/10',
                title: 'Fair Scoring System',
                desc:  'Earn 3 points for exact scores, 1 point for correct outcomes. Every prediction counts.',
              },
              {
                icon: Users,
                color: 'text-indigo-400',
                bg:    'bg-indigo-500/10',
                title: 'Private Leagues',
                desc:  'Create a league, share the invite code, and compete in a private leaderboard with friends.',
              },
              {
                icon: BarChart3,
                color: 'text-emerald-400',
                bg:    'bg-emerald-500/10',
                title: 'Global Leaderboard',
                desc:  'Rank against thousands of predictors worldwide. Rankings update live after every result.',
              },
              {
                icon: Zap,
                color: 'text-accent-400',
                bg:    'bg-accent-500/10',
                title: 'Real-Time Updates',
                desc:  'No page refresh needed. Points and rankings update instantly the moment a result is entered.',
              },
              {
                icon: Trophy,
                color: 'text-amber-400',
                bg:    'bg-amber-500/10',
                title: 'Admin Dashboard',
                desc:  'Dedicated admin panel for entering official match results, which auto-triggers scoring.',
              },
            ].map((feature) => (
              <div key={feature.title} className="glass-card p-6 group hover:border-slate-600/80 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-white text-lg mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scoring explainer */}
      <section className="py-24 px-4 border-t border-slate-800/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4">
            How scoring works
          </h2>
          <p className="text-slate-400 mb-12">Simple, transparent, fair.</p>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                points: '3',
                title: 'Exact Score',
                example: 'You predict 2-1 · Final 2-1',
                color: 'from-emerald-500 to-teal-500',
                glow:  'shadow-[0_0_30px_rgba(16,185,129,0.2)]',
              },
              {
                points: '1',
                title: 'Correct Outcome',
                example: 'You predict 1-0 · Final 3-1',
                color: 'from-brand-500 to-indigo-500',
                glow:  'shadow-[0_0_30px_rgba(14,165,233,0.2)]',
              },
              {
                points: '0',
                title: 'Wrong Outcome',
                example: 'You predict 1-0 · Final 0-2',
                color: 'from-slate-600 to-slate-700',
                glow:  '',
              },
            ].map((tier) => (
              <div key={tier.title} className={`glass-card p-6 ${tier.glow}`}>
                <div className={`text-5xl font-black bg-gradient-to-br ${tier.color} bg-clip-text text-transparent mb-3`}>
                  {tier.points}
                </div>
                <div className="font-semibold text-white mb-1">{tier.title}</div>
                <div className="text-xs text-slate-500">{tier.example}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass-card p-10 border-brand-500/20 shadow-glow-brand">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="font-display font-bold text-3xl text-white mb-3">
              Ready to predict?
            </h2>
            <p className="text-slate-400 mb-8">
              Join thousands of sports fans. Create your account in 30 seconds.
            </p>
            <Link href="/signup" className="btn-primary text-base px-10 py-4">
              Create Free Account
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Trophy className="w-4 h-4 text-brand-400" />
            <span>PredictSports © 2025</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <span>Built with Next.js + Supabase</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
