# PromptIQ

Real-time prompt engineering optimizer & high-fidelity scoring dashboard. Evaluate prompts against a structured prompt-engineering framework using a hybrid pipeline of instant regex heuristics and advanced asynchronous LLM analysis.

---

## Features

- **0-100 Score Circular Gauge** — Glowing animated gauge mapping weighted prompt evaluation dimensions in real-time
- **Hybrid Evaluation Pipeline**
  - **Instant Rule-Based Heuristics** — Custom regex patterns analyze your prompt on every keystroke with zero network overhead
  - **Asynchronous Deep Scan** — Debounced (1.5s) LLM analysis via Mistral Cloud or local Ollama for multi-dimension grading
- **Per-User API Key Management** — Each user enters their own Mistral API key via the dashboard settings modal. Keys are stored in browser localStorage and sent only to the Mistral API during evaluation — never persisted on any server
- **Session Token Quota Tracker** — Tracks prompt, output, and total token usage against a 25,000 token session budget
- **Dual Theme Engine** — Instantly switch between Dark Space Theme and Light Slate Theme via HSL CSS custom properties
- **AbortController Request Control** — Cancels in-flight HTTP requests during fast typing to prevent stale UI state
- **Glassmorphic Toast Alerts** — Non-intrusive notifications for API errors, falling back gracefully to offline rule-based scoring

---

## Architecture

### Scoring Dimensions & Weights

| Dimension | What It Analyzes | Weight |
|---|---|---|
| **Objective / Task** | Clarity of core goals, instructions, and outcomes | 25% |
| **Context** | Background information, constraints, and scope | 20% |
| **Role** | Persona definition and alignment constraints | 15% |
| **Response Format** | Structure commands (JSON, Markdown, tables, etc.) | 15% |
| **Audience** | Targeted level, perspective, or reader profiles | 13% |
| **Style & Tone** | Aesthetic rules, delivery tone, phrasing guidelines | 12% |

### Scoring Pipeline

```
User types prompt
       │
       ▼
──────────────────┐
│ Rule-Based Score │── Instant (0ms), client-side regex matching
│ (ruleBasedScorer)│   against 6 dimension keyword sets
└────────┬─────────┘
         │
         ▼ (1.5s debounce)
┌──────────────────┐
│  LLM Deep Scan   │── Server-side via /api/score
│  (POST /api/score)   Mistral Cloud  →  mistral-small-latest
│                      Local Ollama  →  llama3.2:1b
└─────────────────┘
         │
         ▼
┌──────────────────┐
│  Weighted Blend  │── overall = Σ(dimScore × weight) × 10
│  Overall Score   │
└──────────────────┘
```

### Rule-Based Scorer (`src/lib/ruleBasedScorer.ts`)

Each dimension has a set of regex keyword patterns. The scorer counts matches, caps at 2, normalizes to a 0-10 scale, then applies dimension weights for the overall score.

```
raw = min(matches / 2, 1) * 10
overall = round(Σ(score × weight) * 10)
```

### LLM Scoring (`src/app/api/score/route.ts`)

A Next.js API route accepts `{ prompt, mode, apiKey }`:
- **mode: 'cloud'** — Calls `https://api.mistral.ai/v1/chat/completions` with `mistral-small-latest`. Uses user-provided API key from request body, falling back to `MISTRAL_API_KEY` env variable
- **mode: 'local'** — Calls `http://localhost:11434/api/chat` with `llama3.2:1b`. No API key needed

The LLM returns a JSON object with 0-10 scores per dimension plus improvement suggestions.

### API Key Flow

```
User clicks "Set API Key" button
       │
       ▼
┌──────────────────┐
│  API Key Modal   │── Input field with show/hide toggle
│  (APIKeyModal)   │   Validation (non-empty, min length)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  localStorage    │── Stored as 'promptiq-api-key'
│  (browser only)  │   Never sent to any server except Mistral
└─────────────────┘
         │
         ▼
┌──────────────────┐
│  /api/score POST │── Included in request body as 'apiKey'
│  (route.ts)      │   Used as Bearer token for Mistral API
└──────────────────┘
```

---

## Project Structure

```
PromptIQ/
── .env.local                          # Server-side env vars (MISTRAL_API_KEY fallback)
├── .eslintrc.json                      # ESLint config (next/core-web-vitals)
├── .gitignore
├── components.json                     # shadcn/ui config (base-nova style)
├── next.config.mjs                     # Next.js config
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts                  # Tailwind config with HSL color tokens
├── tsconfig.json
├── README.md
└── src/
    ├── app/
    │   ├── layout.tsx                  # Root layout (Plus Jakarta Sans font, mesh-bg, dark default)
    │   ├── page.tsx                    # Main dashboard (single-page client component, ~500 lines)
    │   ├── globals.css                 # Theme tokens, glass-panel utilities, mesh background, scrollbar
    │   ├── favicon.ico
    │   ── api/
    │       └── score/
    │           └── route.ts            # API route: Mistral Cloud + Ollama scoring endpoints
    ├── components/
    │   ├── APIKeyModal.tsx             # Per-user API key input modal (localStorage-backed)
    │   ├── OverallScore.tsx            # Circular score gauge with animated SVG
    │   ├── ScoreCard.tsx               # Dimension score card with progress bar + suggestion
    │   ├── ToggleMode.tsx              # Cloud API / Local Model segmented control
    │   ── ui/                         # shadcn/ui primitives
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── label.tsx
    │       ├── progress.tsx
    │       ├── switch.tsx
    │       └── textarea.tsx
    └── lib/
        ├── ruleBasedScorer.ts          # Client-side regex-based heuristic scoring engine
        ├── types.ts                    # TypeScript interfaces (DimensionKey, ScoreResult, etc.)
        └── utils.ts                    # cn() utility (clsx + tailwind-merge)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 14.2.35](https://nextjs.org/) (App Router, SSR/SSG) |
| **Language** | [TypeScript 5.x](https://www.typescript.org/) |
| **UI Runtime** | [React 18](https://react.dev/) + [React DOM 18](https://react.dev/) |
| **Styling** | [Tailwind CSS 3.4.1](https://tailwindcss.com/) + HSL CSS custom properties |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) (base-nova style) with custom frosted-glass panels |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Utility** | class-variance-authority, clsx, tailwind-merge |
| **Base UI** | [@base-ui/react 1.4.1](https://base-ui.com/) |
| **Linting** | ESLint 8 + eslint-config-next |

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment (Optional)

Create `.env.local` in the project root:

```env
MISTRAL_API_KEY=your_mistral_api_key_here
```

> The env key serves as a **server-side fallback**. Each user can also provide their own key via the dashboard's **Set API Key** button, which takes precedence.

Get a Mistral API key at [console.mistral.ai](https://console.mistral.ai).

### 3. Configure Local LLM (Optional)

For offline evaluation with Ollama:

```bash
ollama pull llama3.2:1b
```

Toggle between **Cloud API** and **Local Model** using the segmented control in the dashboard header.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Set Your API Key

Click the **Key** button in the header to open the API Key modal. Enter your Mistral API key — it's stored in your browser's localStorage and used for all Cloud API evaluations.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Production build with type checking |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint (next/core-web-vitals) |

---

## License

MIT
