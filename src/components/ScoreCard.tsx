'use client';

import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress';
import { DimensionScore } from '@/lib/types';
import { CheckCircle2, AlertTriangle, XCircle, Sparkles } from 'lucide-react';

function getDimensionRating(score: number): {
  colorClass: string;
  progressBarClass: string;
  textColor: string;
  icon: React.ReactNode;
  label: string;
} {
  if (score >= 8) {
    return {
      colorClass: 'border-emerald-500/20 bg-emerald-500/5',
      progressBarClass: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]',
      textColor: 'text-emerald-400',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
      label: 'Optimal',
    };
  }
  if (score >= 5) {
    return {
      colorClass: 'border-amber-500/20 bg-amber-500/5',
      progressBarClass: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]',
      textColor: 'text-amber-400',
      icon: <AlertTriangle className="h-4 w-4 text-amber-400" />,
      label: 'Adequate',
    };
  }
  return {
    colorClass: 'border-rose-500/20 bg-rose-500/5',
    progressBarClass: 'bg-rose-400 shadow-[0_0_10px_rgba(248,113,113,0.3)]',
    textColor: 'text-rose-400',
    icon: <XCircle className="h-4 w-4 text-rose-400" />,
    label: 'Needs Work',
  };
}

export default function ScoreCard({ dimension }: { dimension: DimensionScore }) {
  const rating = getDimensionRating(dimension.score);

  return (
    <div className={`glass-panel glass-panel-hover rounded-xl p-4 flex flex-col justify-between transition-all duration-300 border ${rating.colorClass}`}>
      <div className="space-y-3">
        {/* Header containing Name and Score Badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-foreground/90">
            {dimension.label}
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-white/5 border border-white/5 text-muted-foreground`}>
              {rating.label}
            </span>
            <span className={`text-base font-extrabold tracking-tight ${rating.textColor}`}>
              {dimension.score.toFixed(1)}<span className="text-xs text-muted-foreground/60">/10</span>
            </span>
          </div>
        </div>

        {/* Progress Bar indicator */}
        <Progress value={dimension.score * 10}>
          <ProgressTrack className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <ProgressIndicator className={`h-full rounded-full transition-all duration-700 ease-out ${rating.progressBarClass}`} />
          </ProgressTrack>
        </Progress>
      </div>

      {/* Actionable Suggestion Alert Panel */}
      {dimension.suggestion && dimension.score < 8.5 && (
        <div className="mt-3.5 flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[11px] leading-relaxed text-muted-foreground hover:text-foreground/90 transition-colors duration-200">
          <Sparkles className="h-3.5 w-3.5 mt-0.5 text-primary/70 shrink-0" />
          <p className="italic">
            {dimension.suggestion}
          </p>
        </div>
      )}
    </div>
  );
}
