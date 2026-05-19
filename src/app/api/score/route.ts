import { NextRequest, NextResponse } from 'next/server';
import { LLMResponse, ScoreResponse, ScoringMode, TokenUsage } from '@/lib/types';

const SYSTEM_PROMPT = `You are an expert prompt evaluator. Score the following prompt against these dimensions: Role, Context, Objective/Task, Style & Tone, Audience, Response Format.
Return ONLY a JSON object in this exact format, no explanation:
{
  "role": <0-10>,
  "context": <0-10>,
  "objective": <0-10>,
  "styleTone": <0-10>,
  "audience": <0-10>,
  "responseFormat": <0-10>,
  "suggestions": {
    "role": "<one line suggestion if score < 7, else empty string>",
    "context": "<one line suggestion if score < 7, else empty string>",
    "objective": "<one line suggestion if score < 7, else empty string>",
    "styleTone": "<one line suggestion if score < 7, else empty string>",
    "audience": "<one line suggestion if score < 7, else empty string>",
    "responseFormat": "<one line suggestion if score < 7, else empty string>"
  }
}`;

// Robust helper to extract and parse JSON from LLM string outputs
function extractJSON(text: string): LLMResponse {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {}

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  
  if (start !== -1 && end !== -1 && end > start) {
    const jsonStr = trimmed.substring(start, end + 1);
    try {
      return JSON.parse(jsonStr);
    } catch {
      // Attempt manual recovery of common LLM trailing commas and control char formatting faults
      try {
        const cleanedStr = jsonStr
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        return JSON.parse(cleanedStr);
      } catch {}
    }
  }
  throw new Error('Evaluation model returned an invalid JSON response structure.');
}

async function scoreWithMistral(prompt: string): Promise<ScoreResponse> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error('Mistral API Key is missing. Please configure MISTRAL_API_KEY in your env file.');
  }

  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      Authorization: `Bearer ${apiKey}` 
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Mistral API error: Status ${res.status} (${res.statusText})`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  const scores: LLMResponse = extractJSON(content);

  const usage = data.usage || {};
  const tokenUsage: TokenUsage = {
    promptTokens: usage.prompt_tokens ?? 0,
    completionTokens: usage.completion_tokens ?? 0,
    totalTokens: usage.total_tokens ?? 0,
  };

  return { scores, tokenUsage };
}

async function scoreWithOllama(prompt: string): Promise<ScoreResponse> {
  let res: Response;
  try {
    res = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:1b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        stream: false,
        options: { temperature: 0.1 },
      }),
    });
  } catch {
    throw new Error('Local Ollama server is offline or unreachable. Please run "ollama serve" and verify connection.');
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Ollama model error: ${res.statusText}. ${errorText.substring(0, 100)}`);
  }

  const data = await res.json();
  const content = data.message?.content || '';
  const scores: LLMResponse = extractJSON(content);

  const tokenUsage: TokenUsage = {
    promptTokens: data.prompt_eval_count ?? 0,
    completionTokens: data.eval_count ?? 0,
    totalTokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
  };

  return { scores, tokenUsage };
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, mode } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt text is required for evaluation.' }, { status: 400 });
    }

    const llmMode: ScoringMode = mode === 'local' ? 'local' : 'cloud';
    const result = llmMode === 'cloud'
      ? await scoreWithMistral(prompt)
      : await scoreWithOllama(prompt);

    return NextResponse.json(result);
  } catch (err) {
    console.error('LLM scoring error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'An unexpected exception occurred during evaluation.' },
      { status: 500 }
    );
  }
}
