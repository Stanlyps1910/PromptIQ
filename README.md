# PromptIQ

Real-time AI prompt scoring tool. Score prompts against the CO-STAR + RTF framework using a hybrid rule-based + LLM system.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.local` and add your Mistral API key:

```
MISTRAL_API_KEY=your_mistral_api_key_here
```

Get a key at [console.mistral.ai](https://console.mistral.ai).

### 3. LLM Setup

**Cloud mode (default):** Uses Mistral API — just set your `MISTRAL_API_KEY`.

**Local mode (Ollama):** Install [Ollama](https://ollama.com), then pull the model:

```bash
ollama pull llama3.2:1b
```

Then toggle to "Local" in the UI.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

- **Rule-based scoring** fires instantly on every keystroke — checks for keywords/patterns per dimension.
- **LLM scoring** triggers 1500ms after you stop typing — sends the prompt to Mistral or Ollama for deeper evaluation.
- Scores are weighted: Objective/Task (25%), Context (20%), Role (15%), Response Format (15%), Audience (13%), Style & Tone (12%).

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- shadcn/ui
- TypeScript
