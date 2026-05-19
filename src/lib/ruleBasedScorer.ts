import { DimensionKey, DimensionScore, ScoreResult } from './types';

interface RuleCheck {
  keywords: RegExp[];
  weight: number;
}

const DIMENSION_WEIGHTS: Record<DimensionKey, number> = {
  role: 0.15,
  context: 0.20,
  objective: 0.25,
  styleTone: 0.12,
  audience: 0.13,
  responseFormat: 0.15,
};

const CHECKS: Record<DimensionKey, RuleCheck> = {
  role: {
    keywords: [
      /\bact as\b/i,
      /\byou are\b/i,
      /\bas a\b/i,
      /\bpretend you are\b/i,
      /\byou're a\b/i,
      /\byou will be\b/i,
      /\b扮演/i,
    ],
    weight: 1,
  },
  context: {
    keywords: [
      /\bI am\b/i,
      /\bI have\b/i,
      /\bcurrently\b/i,
      /\bbackground\b/i,
      /\bworking on\b/i,
      /\bcontext\b/i,
      /\bsituation\b/i,
      /\bscenario\b/i,
    ],
    weight: 1,
  },
  objective: {
    keywords: [
      /\bI want\b/i,
      /\bhelp me\b/i,
      /\bgenerate\b/i,
      /\bwrite\b/i,
      /\bcreate\b/i,
      /\bexplain\b/i,
      /\bdraft\b/i,
      /\bcompose\b/i,
      /\bproduce\b/i,
      /\bdevelop\b/i,
      /\bsummarize\b/i,
      /\banalyze\b/i,
      /\bobjective\b/i,
      /\bgoal\b/i,
      /\btask\b/i,
    ],
    weight: 1,
  },
  styleTone: {
    keywords: [
      /\bformal\b/i,
      /\bcasual\b/i,
      /\bfriendly\b/i,
      /\bprofessional\b/i,
      /\bsimple\b/i,
      /\bcreative\b/i,
      /\bhumorous\b/i,
      /\bstyle\b/i,
      /\btone\b/i,
      /\bvoice\b/i,
      /\bconversational\b/i,
      /\bpersuasive\b/i,
    ],
    weight: 1,
  },
  audience: {
    keywords: [
      /\bfor a\b/i,
      /\baudience\b/i,
      /\baimed at\b/i,
      /\bbeginner\b/i,
      /\bexpert\b/i,
      /\bfor .*who\b/i,
      /\btarget\b/i,
      /\bstudents\b/i,
      /\bdevelopers\b/i,
      /\bprofessionals\b/i,
    ],
    weight: 1,
  },
  responseFormat: {
    keywords: [
      /\bbullet points?\b/i,
      /\blist\b/i,
      /\btable\b/i,
      /\bparagraph\b/i,
      /\bin JSON\b/i,
      /\bstep by step\b/i,
      /\bformat\b/i,
      /\boutline\b/i,
      /\bjson\b/i,
      /\bmarkdown\b/i,
      /\bcsv\b/i,
      /\bsections?\b/i,
      /\bnumbered\b/i,
    ],
    weight: 1,
  },
};

function scoreDimension(text: string, check: RuleCheck): number {
  let matches = 0;
  for (const regex of check.keywords) {
    if (regex.test(text)) {
      matches++;
    }
  }
  const raw = Math.min(matches / 2, 1) * 10;
  return Math.round(raw * 10) / 10;
}

export function ruleBasedScore(prompt: string): ScoreResult {
  const text = prompt.trim();
  if (!text) {
    const emptyDimensions: DimensionScore[] = (Object.keys(CHECKS) as DimensionKey[]).map((key) => ({
      label: labelForKey(key),
      key,
      score: 0,
      suggestion: '',
    }));
    return { overall: 0, dimensions: emptyDimensions, scoringType: 'rule' };
  }

  const dimensions: DimensionScore[] = (Object.keys(CHECKS) as DimensionKey[]).map((key) => ({
    label: labelForKey(key),
    key,
    score: scoreDimension(text, CHECKS[key]),
    suggestion: '',
  }));

  let weightedSum = 0;
  for (const dim of dimensions) {
    weightedSum += dim.score * DIMENSION_WEIGHTS[dim.key];
  }
  const overall = Math.round(weightedSum * 10);

  return { overall, dimensions, scoringType: 'rule' };
}

function labelForKey(key: DimensionKey): string {
  const labels: Record<DimensionKey, string> = {
    role: 'Role',
    context: 'Context',
    objective: 'Objective / Task',
    styleTone: 'Style & Tone',
    audience: 'Audience',
    responseFormat: 'Response Format',
  };
  return labels[key];
}
