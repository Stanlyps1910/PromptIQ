'use client';

import { useEffect, useRef, useState } from 'react';

function getScoreRating(score: number): { label: string; color: string; desc: string } {
  if (score >= 85) return { label: 'Exceptional', color: 'text-emerald-400', desc: 'Ready for production deployment.' };
  if (score >= 70) return { label: 'Highly Effective', color: 'text-teal-400', desc: 'Strong structure with minor optimizations possible.' };
  if (score >= 50) return { label: 'Moderate Quality', color: 'text-amber-400', desc: 'Good baseline, needs more details or constraints.' };
  return { label: 'Needs Optimization', color: 'text-rose-400', desc: 'Lacks fundamental context or formatting instructions.' };
}

function scoreRingColor(score: number): string {
  if (score >= 85) return '#34d399'; // Emerald 400
  if (score >= 70) return '#2dd4bf'; // Teal 400
  if (score >= 50) return '#fbbf24'; // Amber 400
  return '#f87171'; // Rose 400
}

interface OverallScoreProps {
  score: number;
  scoringType: 'rule' | 'llm';
  isAnimating?: boolean;
}

export default function OverallScore({ score, scoringType, isAnimating }: OverallScoreProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const prevScoreRef = useRef(0);
  const targetScore = Math.round(score);

  useEffect(() => {
    const from = prevScoreRef.current;
    const to = targetScore;
    const duration = 800; // Smoother and slightly longer transition
    const steps = 40;
    const increment = (to - from) / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const current = from + increment * step;
      if (step >= steps) {
        setDisplayScore(to);
        prevScoreRef.current = to;
        clearInterval(timer);
      } else {
        const roundedCurrent = Math.round(current);
        setDisplayScore(roundedCurrent);
        prevScoreRef.current = roundedCurrent;
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [targetScore]);

  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;
  const rating = getScoreRating(targetScore);
  const activeColor = scoreRingColor(targetScore);

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300">
      {/* Decorative background glow matching the score state */}
      <div 
        className="absolute w-36 h-36 rounded-full blur-[60px] opacity-10 pointer-events-none transition-all duration-700" 
        style={{ backgroundColor: activeColor, top: '10%', left: '30%' }}
      />
      
      <div className="relative flex items-center justify-center mb-4">
        {/* Futuristic SVG Ring */}
        <svg width="160" height="160" className="transform -rotate-90 filter drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]">
          {/* Track Circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.04)"
            strokeWidth="8"
          />
          {/* Active Glowing Circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={activeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              filter: `drop-shadow(0 0 6px ${activeColor}55)`,
              transition: 'stroke-dashoffset 0.5s ease-out, stroke 0.5s ease-out'
            }}
          />
        </svg>

        {/* Center Display Score */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-4xl font-extrabold tracking-tight transition-colors duration-500`} style={{ color: activeColor }}>
            {displayScore}
          </span>
          <span className="text-[10px] tracking-wider uppercase text-muted-foreground font-semibold mt-0.5">
            Score
          </span>
        </div>

        {/* Active Evaluation Ping */}
        {isAnimating && (
          <span className="absolute top-2 right-2 h-3.5 w-3.5 flex">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary" />
          </span>
        )}
      </div>

      {/* Score Grading and Assessment */}
      <div className="text-center space-y-1 z-10">
        <h3 className={`text-lg font-bold tracking-tight ${rating.color} transition-colors duration-500`}>
          {rating.label}
        </h3>
        <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
          {rating.desc}
        </p>
      </div>

      {/* Scorer Type Indicator */}
      <div className="mt-4 px-3 py-1 bg-white/5 border border-white/5 rounded-full z-10">
        <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
          {scoringType === 'llm' ? '✨ AI Evaluated' : '🤖 Rule-Based Analyzer'}
        </span>
      </div>
    </div>
  );
}
