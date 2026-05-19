'use client';

import { ScoringMode } from '@/lib/types';
import { Cloud, Server } from 'lucide-react';

interface ToggleModeProps {
  mode: ScoringMode;
  onChange: (mode: ScoringMode) => void;
}

export default function ToggleMode({ mode, onChange }: ToggleModeProps) {
  return (
    <div className="relative flex items-center p-1 bg-white/[0.02] border border-white/[0.06] rounded-xl select-none w-[280px]">
      {/* Sliding Background Accent Pill */}
      <div 
        className="absolute top-1 bottom-1 rounded-lg bg-primary shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all duration-300 ease-out pointer-events-none"
        style={{
          left: mode === 'cloud' ? '4px' : 'calc(50% + 2px)',
          width: 'calc(50% - 6px)',
        }}
      />
      
      {/* Cloud Option */}
      <button
        onClick={() => onChange('cloud')}
        className={`relative z-10 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors duration-300 w-1/2 ${
          mode === 'cloud' ? 'text-white' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Cloud className="h-3.5 w-3.5" />
        Cloud API
      </button>

      {/* Local Option */}
      <button
        onClick={() => onChange('local')}
        className={`relative z-10 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors duration-300 w-1/2 ${
          mode === 'local' ? 'text-white' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Server className="h-3.5 w-3.5" />
        Local Model
      </button>
    </div>
  );
}
