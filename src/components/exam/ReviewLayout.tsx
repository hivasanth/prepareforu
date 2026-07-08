import type { FC, ReactNode } from 'react';
import { Trophy, Target, CheckCircle2, XCircle, Clock, Layers, AlertCircle, Eye, Search } from 'lucide-react';
import { IconBadge, StatCard } from '../common/AntigravityUI';
import { BilingualToggle } from '../common/BilingualToggle';
import { FixedBackButton } from './FixedBackButton';

interface ReviewStats {
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  notVisited: number;
  score: number;
  accuracy: number;
  timeTaken: number;
}

interface ReviewLayoutProps {
  examTitle: string;
  stats: ReviewStats;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
  filterCounts: Record<string, number>;
  displayLang: 'en' | 'te';
  onToggleLang: (lang: 'en' | 'te') => void;
  onBack: () => void;
  children: ReactNode;
}

export const ReviewLayout: FC<ReviewLayoutProps> = ({
  examTitle,
  stats,
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  filterCounts,
  displayLang,
  onToggleLang,
  onBack,
  children,
}) => {
  return (
    <div className="min-h-screen bg-app-bg">
      <FixedBackButton onClick={onBack} />

      <div className="max-w-[1200px] mx-auto px-4 py-6 md:py-10 space-y-8">
        <div className="bg-card-bg border border-border-subtle shadow-2xl p-8 md:p-10 text-center space-y-6 relative overflow-hidden rounded-[32px]">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-secondary to-primary" />
          <IconBadge icon={Trophy} size="6xl" shape="circle" className="mx-auto mb-4 rounded-full bg-primary/10 text-primary" />
          <div>
            <h1 className="text-[clamp(22px,3.5vw,42px)] font-black text-text-primary uppercase tracking-tighter m-0">Performance Report</h1>
            <p className="text-[clamp(11px,1.2vw,14px)] font-medium text-text-secondary opacity-60 uppercase tracking-widest mt-2">{examTitle}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-border-subtle">
            <StatCard icon={Target} label="Accuracy" value={`${stats.accuracy}%`} color="var(--primary)" />
            <StatCard icon={CheckCircle2} label="Correct" value={stats.correct} color="var(--success)" />
            <StatCard icon={XCircle} label="Wrong" value={stats.wrong} color="var(--danger)" />
            <StatCard icon={Clock} label="Time" value={`${Math.floor(stats.timeTaken / 60)}m`} color="var(--info)" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm font-bold text-text-secondary">
            <span><Layers size={14} className="inline mr-1" />Total: {stats.total}</span>
            <span><AlertCircle size={14} className="inline mr-1" />Skipped: {stats.skipped}</span>
            <span><Eye size={14} className="inline mr-1" />Not Visited: {stats.notVisited}</span>
            <span><Trophy size={14} className="inline mr-1" />Score: {stats.score}</span>
          </div>
        </div>

        <div className="bg-card-bg border border-border-subtle shadow-xl p-6 md:p-8 lg:p-12 space-y-8 rounded-[32px]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
            <h3 className="text-[clamp(16px,2vw,20px)] font-black text-text-primary uppercase tracking-tight m-0">Detailed Analysis</h3>
            <BilingualToggle displayLang={displayLang} onChange={onToggleLang} showShadow />
          </div>

          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:text-primary transition-all" size={20} />
            <input
              type="text"
              placeholder="Search questions or subjects..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-[20px] border-2 outline-none font-bold transition-all shadow-sm bg-app-bg border-border-subtle focus:border-primary focus:ring-4 focus:ring-primary/5 text-text-primary placeholder:text-text-secondary/30"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { id: 'all', label: 'All', count: filterCounts.all || 0 },
              { id: 'correct', label: 'Correct', count: filterCounts.correct || 0 },
              { id: 'wrong', label: 'Wrong', count: filterCounts.wrong || 0 },
              { id: 'skipped', label: 'Skipped', count: filterCounts.skipped || 0 },
              { id: 'not_visited', label: 'Not Visited', count: filterCounts.not_visited || 0 },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => onFilterChange(f.id)}
                className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border-2 ${
                  filter === f.id
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                    : 'bg-app-bg text-text-secondary border-border-subtle hover:border-primary/30'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          <div className="space-y-16">
            {children}
          </div>

          {(!children || (Array.isArray(children) && children.length === 0)) && (
            <div className="py-24 text-center border-2 border-dashed rounded-[32px] border-border-subtle">
              <IconBadge icon={Search} size="4xl" className="rounded-2xl mx-auto mb-6" darkClassName="bg-hover-bg text-text-disabled" />
              <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">No matching results</h3>
              <p className="text-text-secondary mt-2">Adjust your filter to explore different segments.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
