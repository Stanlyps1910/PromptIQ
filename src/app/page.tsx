'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import OverallScore from '@/components/OverallScore';
import ScoreCard from '@/components/ScoreCard';
import ToggleMode from '@/components/ToggleMode';
import APIKeyModal from '@/components/APIKeyModal';
import { ruleBasedScore } from '@/lib/ruleBasedScorer';
import { ScoreResponse, ScoreResult, ScoringMode, TokenUsage } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles, Terminal, FileText, BarChart3, HelpCircle, Activity, Lightbulb, Coins, Sun, Moon, AlertTriangle, Key } from 'lucide-react';

const SAMPLE_PROMPT = `Act as a senior software engineer. I am a junior developer building my first REST API in Node.js. Explain how to structure routes, handle errors, and validate input in a clear step-by-step guide. Write in a friendly, mentor-like tone. Format the response with code examples and bullet points.`;
const SESSION_TOKEN_LIMIT = 25000;

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<ScoringMode>('cloud');
  const [scoreResult, setScoreResult] = useState<ScoreResult>(() => ruleBasedScore(''));
  const [llmLoading, setLlmLoading] = useState(false);
  const [lastTokens, setLastTokens] = useState<TokenUsage | null>(null);
  const [cumulativeTokens, setCumulativeTokens] = useState<TokenUsage>({
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const promptRef = useRef(prompt);

  // Sync prompt state to ref to check for async race condition responses
  useEffect(() => {
    promptRef.current = prompt;
  }, [prompt]);

  // Initialize theme and mode settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('promptiq-mode');
    if (saved === 'local' || saved === 'cloud') {
      setMode(saved);
    }

    const savedTheme = localStorage.getItem('promptiq-theme') || 'dark';
    setTheme(savedTheme as 'light' | 'dark');
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    const savedApiKey = localStorage.getItem('promptiq-api-key') || '';
    setUserApiKey(savedApiKey);
  }, []);

  useEffect(() => {
    localStorage.setItem('promptiq-mode', mode);
  }, [mode]);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedApiKey = localStorage.getItem('promptiq-api-key') || '';
      setUserApiKey(savedApiKey);
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 500);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Auto-dismiss toast warnings after 7 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('promptiq-theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const handleLlmScore = useCallback(async (text: string, currentMode: ScoringMode) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setLlmLoading(false);
      return;
    }

    // Abort previous pending evaluation calls to eliminate asynchronous race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLlmLoading(true);
    setToast(null); // Clear previous alerts

    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed, mode: currentMode, apiKey: userApiKey }),
        signal: controller.signal
      });

      // Parse error payload if server threw an error
      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}));
        throw new Error(errPayload.error || 'Server returned an error.');
      }

      const data: ScoreResponse = await res.json();
      
      // Verify prompt has not changed since fetch started (stale response protection)
      if (trimmed !== promptRef.current.trim()) {
        return;
      }

      const { scores, tokenUsage } = data;

      setLastTokens(tokenUsage);
      setCumulativeTokens((prev) => ({
        promptTokens: prev.promptTokens + tokenUsage.promptTokens,
        completionTokens: prev.completionTokens + tokenUsage.completionTokens,
        totalTokens: prev.totalTokens + tokenUsage.totalTokens,
      }));

      setScoreResult({
        overall: Math.round(
          (scores.role * 0.15 +
          scores.context * 0.20 +
          scores.objective * 0.25 +
          scores.styleTone * 0.12 +
          scores.audience * 0.13 +
          scores.responseFormat * 0.15) * 10
        ),
        dimensions: [
          { label: 'Role', key: 'role', score: scores.role, suggestion: scores.suggestions.role },
          { label: 'Context', key: 'context', score: scores.context, suggestion: scores.suggestions.context },
          { label: 'Objective / Task', key: 'objective', score: scores.objective, suggestion: scores.suggestions.objective },
          { label: 'Style & Tone', key: 'styleTone', score: scores.styleTone, suggestion: scores.suggestions.styleTone },
          { label: 'Audience', key: 'audience', score: scores.audience, suggestion: scores.suggestions.audience },
          { label: 'Response Format', key: 'responseFormat', score: scores.responseFormat, suggestion: scores.suggestions.responseFormat },
        ],
        scoringType: 'llm',
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore aborted requests silently
      }
      const message = err instanceof Error ? err.message : 'AI engine is unreachable. Keeping rule-based local evaluations.';
      console.warn('LLM scoring failed:', message);
      
      // Push error warning toast to UI
      setToast({
        message,
        type: 'error'
      });
    } finally {
      if (trimmed === promptRef.current.trim()) {
        setLlmLoading(false);
      }
    }
  }, [userApiKey]);

  function handleChange(value: string) {
    setPrompt(value);
    const ruleResult = ruleBasedScore(value);
    setScoreResult(ruleResult);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    // Clear pending abort calls if text is empty
    if (!value.trim()) {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      setLlmLoading(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      handleLlmScore(value, mode);
    }, 1500);
  }

  function handleSample() {
    setPrompt(SAMPLE_PROMPT);
    const ruleResult = ruleBasedScore(SAMPLE_PROMPT);
    setScoreResult(ruleResult);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handleLlmScore(SAMPLE_PROMPT, mode);
    }, 1500);
  }

  const wordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;
  const remainingTokens = Math.max(SESSION_TOKEN_LIMIT - cumulativeTokens.totalTokens, 0);

  return (
    <div className="min-h-screen relative p-4 md:p-8 flex flex-col justify-start">
      {/* Decorative top lighting glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full z-10 space-y-8 flex-1">
        {/* Navigation & Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-black/5 dark:border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary/10 rounded-xl border border-primary/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                <Terminal className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
                PromptIQ
              </h1>
              <span className="text-[9px] uppercase tracking-widest font-extrabold px-1.5 py-0.5 rounded bg-primary/15 border border-primary/20 text-primary">
                v1.0
              </span>
            </div>
            <p className="text-xs text-muted-foreground tracking-wide">
              Real-time engineering analysis & structured feedback for LLM prompts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* API Key Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setApiKeyModalOpen(true)}
              className="glass-panel glass-panel-hover gap-1.5 text-xs font-semibold px-3 h-9"
              aria-label="Configure API Key"
            >
              <Key className={`h-3.5 w-3.5 ${userApiKey ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="hidden md:inline">{userApiKey ? 'API Key Set' : 'Set API Key'}</span>
            </Button>

            {/* Theme Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="glass-panel glass-panel-hover gap-1.5 text-xs font-semibold px-3 h-9"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden md:inline">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="hidden md:inline">Dark Mode</span>
                </>
              )}
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSample}
              className="glass-panel glass-panel-hover gap-1.5 text-xs font-semibold px-4 h-9"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Sample Prompt
            </Button>
            <ToggleMode mode={mode} onChange={(newMode) => {
              setMode(newMode);
              if (prompt.trim()) {
                handleLlmScore(prompt, newMode);
              }
            }} />
          </div>
        </header>

        {/* Primary Workspace Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Playground / Left Panel (6 columns) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="glass-panel rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary/80" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                    Prompt Playground
                  </span>
                </div>
                <span className="text-[10px] tracking-widest uppercase font-semibold text-muted-foreground/60 flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${llmLoading ? 'bg-primary animate-pulse' : 'bg-muted-foreground/40'}`} />
                  {llmLoading ? 'Analyzing...' : 'Ready'}
                </span>
              </div>

              <div className="relative group">
                {/* Glowing border container */}
                <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-primary/10 to-blue-500/10 opacity-60 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                
                <Textarea
                  placeholder="Type or paste your prompt here... Include role, context, task objective, style, and formatting details for high-fidelity evaluation."
                  value={prompt}
                  onChange={(e) => handleChange(e.target.value)}
                  className="relative min-h-[300px] w-full bg-white/[0.01] dark:bg-white/[0.01] bg-black/[0.005] border-white/5 dark:border-white/5 border-black/10 focus-visible:border-primary/40 focus-visible:ring-primary/10 rounded-xl p-4 text-sm leading-relaxed font-mono resize-none focus:outline-none"
                />
              </div>

              {/* Character and Word Counter telemetry */}
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground/80 px-1 pt-1">
                <div className="flex gap-4">
                  <span>
                    Words: <span className="text-foreground">{wordCount}</span>
                  </span>
                  <span>
                    Characters: <span className="text-foreground">{prompt.length}</span>
                  </span>
                </div>
                {llmLoading && (
                  <span className="text-primary animate-pulse text-[10px] font-bold tracking-widest uppercase flex items-center gap-1">
                    <Activity className="h-3 w-3 animate-spin" /> Deep Scan...
                  </span>
                )}
              </div>

              {/* Session Token Quota & Used Telemetry */}
              <div className="pt-4 mt-2 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/[0.02] dark:bg-white/[0.01] p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Coins className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-foreground/75 block">Session Token Quota</span>
                    <span className="text-[9px] text-muted-foreground">Tracks API/Ollama utilization metrics.</span>
                  </div>
                </div>
                
                <div className="flex gap-4 text-xs font-semibold">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-muted-foreground block uppercase tracking-wider">Used Tokens</span>
                    <span className="text-foreground font-extrabold text-sm">{cumulativeTokens.totalTokens}</span>
                  </div>
                  <div className="space-y-0.5 border-l border-black/5 dark:border-white/5 pl-4">
                    <span className="text-[9px] text-muted-foreground block uppercase tracking-wider font-bold">Remaining</span>
                    <span className="text-primary font-extrabold text-sm">{remainingTokens}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Micro Prompting Tips panel */}
            <div className="glass-panel rounded-2xl p-5 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/15 shrink-0 mt-0.5">
                <Lightbulb className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground/90">Prompt Engineering Tip</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Start your prompt with a strong **Role** constraint (e.g., <i>&quot;Act as a Senior Project Manager&quot;</i>) and wrap your final instructions in an explicit **Response Format** command.
                </p>
              </div>
            </div>
          </div>

          {/* Analysis Dashboard / Right Panel (6 columns) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Top row: Overall Score Gauge & Token Stats side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <OverallScore
                score={scoreResult.overall}
                scoringType={scoreResult.scoringType}
                isAnimating={llmLoading}
              />

              {/* Telemetry statistics card */}
              <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between overflow-hidden relative">
                {/* Visual mesh lighting */}
                <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary/80" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                      Execution Call metrics
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Details of the last evaluation call processed by the active model engine.
                  </p>
                </div>

                {lastTokens && scoreResult.scoringType === 'llm' ? (
                  <div className="space-y-3 mt-4">
                    {/* Token Breakdown Display Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center bg-white/[0.02] dark:bg-white/[0.02] bg-black/[0.005] border border-black/5 dark:border-white/5 p-2 rounded-xl">
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground/80 font-bold block">Prompt</span>
                        <span className="text-sm font-extrabold text-foreground">{lastTokens.promptTokens}</span>
                      </div>
                      <div className="space-y-0.5 border-x border-black/5 dark:border-white/5">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground/80 font-bold block">Output</span>
                        <span className="text-sm font-extrabold text-foreground">{lastTokens.completionTokens}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground/80 font-bold block">Total</span>
                        <span className="text-sm font-extrabold text-primary">{lastTokens.totalTokens}</span>
                      </div>
                    </div>
                    
                    {/* Session Statistics cumulative */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/75 px-1 font-semibold pt-1 border-t border-black/5 dark:border-white/5">
                      <span>Inference Execution Status</span>
                      <span className="text-emerald-500 font-bold">Success</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 flex flex-col items-center justify-center py-6 text-center border border-dashed border-black/5 dark:border-white/5 rounded-xl bg-white/[0.01]">
                    <HelpCircle className="h-6 w-6 text-muted-foreground/45 mb-1.5" />
                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                      Inference Idle
                    </span>
                    <p className="text-[9px] text-muted-foreground/50 max-w-[180px] leading-relaxed mt-1">
                      Start typing or load a sample to trigger AI diagnostics.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Section: Dimension Grid Breakdown */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-bold tracking-tight text-foreground/90 uppercase">
                    Dimension Evaluation
                  </h2>
                  <p className="text-[10px] text-muted-foreground">
                    Deep-dive breakdown mapped against prompt structures.
                  </p>
                </div>
              </div>

              {/* Grid of customized ScoreCards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {scoreResult.dimensions.map((dim) => (
                  <ScoreCard key={dim.key} dimension={dim} />
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Floating Glassmorphic Toast Alert warnings */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel border-rose-500/20 bg-rose-500/10 dark:bg-rose-500/5 max-w-sm rounded-xl p-4 shadow-[0_12px_40px_rgba(244,63,94,0.15)] flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="p-1.5 rounded-lg bg-rose-500/10 shrink-0 mt-0.5">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Evaluation Warning</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{toast.message}</p>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="text-muted-foreground hover:text-foreground text-xs font-bold p-0.5 shrink-0 transition-colors duration-200"
            aria-label="Dismiss toast alert"
          >
            ✕
          </button>
        </div>
      )}

      {/* API Key Configuration Modal */}
      <APIKeyModal isOpen={apiKeyModalOpen} onClose={() => setApiKeyModalOpen(false)} />

      {/* Footer copyright */}
      <footer className="mt-12 text-center border-t border-black/5 dark:border-white/5 pt-6 text-[10px] tracking-wider text-muted-foreground/40 font-semibold uppercase">
        © 2026 PromptIQ. All rights reserved. Powered by Mistral Cloud & Ollama.
      </footer>
    </div>
  );
}
