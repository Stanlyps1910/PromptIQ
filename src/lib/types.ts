export type DimensionKey = 'role' | 'context' | 'objective' | 'styleTone' | 'audience' | 'responseFormat';

export interface DimensionScore {
  label: string;
  key: DimensionKey;
  score: number;
  suggestion: string;
}

export interface ScoreResult {
  overall: number;
  dimensions: DimensionScore[];
  scoringType: 'rule' | 'llm';
}

export interface LLMResponse {
  role: number;
  context: number;
  objective: number;
  styleTone: number;
  audience: number;
  responseFormat: number;
  suggestions: Record<DimensionKey, string>;
}

export type ScoringMode = 'cloud' | 'local';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ScoreResponse {
  scores: LLMResponse;
  tokenUsage: TokenUsage;
}
