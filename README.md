# 🚀 PromptIQ

Real-time prompt engineering optimizer & high-fidelity scoring dashboard. Evaluate prompts against the structured prompt-engineering framework using a hybrid pipeline of instant regex heuristics and advanced asynchronous LLM analysis.

![PromptIQ Header](https://raw.githubusercontent.com/Stanlyps1910/PromptIQ/main/public/header.png)

---

## ✨ Features

- **📊 0-100 Score circular telemetry**: Glowing futuristic circular gauge that maps weighted prompt evaluation dimensions in real-time.
- **⚡ Hybrid evaluation Pipeline**:
  - **Instant Rule-Based Heuristics**: Custom regex patterns analyze your prompt instantly on every keystroke with zero network overhead.
  - **Asynchronous Deep Scan**: Debounced LLM analysis triggers 1.5 seconds after typing, using Mistral Cloud or a local Ollama instance for multi-dimension grading.
- **🪙 Session Token Quota Tracker**: Tracks execution cost metrics including prompt, output, and total token usage, alongside an active session budget pool of `25,000` tokens.
- **🌗 Premium HSL Theme Engine**: Supports instantaneous transitioning between a deep midnight **Dark Space Theme** and a frosted glass **Light Slate Theme**.
- **🛡️ AbortController Request Control**: Cancels obsolete in-flight HTTP requests automatically during fast typing to prevent asynchronous UI state corruption.
- **🔔 Non-Intrusive Toast Alerts**: Displays beautiful glassmorphic warning notifications for unreachable APIs or connection timeouts, transitioning to offline rules gracefully.

---

## 🏗️ Architecture & Scoring weights

PromptIQ evaluates prompts across six core structural prompt engineering dimensions:

| Dimension | Metric Analyzed | Weight |
| :--- | :--- | :--- |
| **Objective / Task** | Clarity of core goals, instructions, and outcomes | **25%** |
| **Context** | Background information, constraints, and scope definitions | **20%** |
| **Role** | Persona definition and context alignment constraints | **15%** |
| **Response Format** | Structure commands (JSON, Markdown, tables, etc.) | **15%** |
| **Audience** | Targeted level, perspective, or reader profiles | **13%** |
| **Style & Tone** | Aesthetic rules, delivery tone, or phrasing guidelines | **12%** |

---

## 🛠️ Quick Start & Setup

### 1. Clone & Install Dependencies
First, check out the repository and install required modules:
```bash
npm install
```

### 2. Configure Environment Keys
Create or open your `.env.local` file in the root workspace and define your Mistral credentials:
```env
MISTRAL_API_KEY=your_mistral_api_key_here
```
> [!NOTE]
> You can acquire a Mistral Cloud API key at [console.mistral.ai](https://console.mistral.ai).

### 3. Configure Local LLM Models (Optional)
To evaluate prompts completely offline using Ollama, install [Ollama](https://ollama.com) and pull the lightweight Llama 3.2 model:
```bash
# Verify Ollama is running and fetch the model
ollama pull llama3.2:1b
```
Toggle the segmented control in the top-right header of PromptIQ between **Cloud API** and **Local Model** to switch execution targets.

### 4. Run Development Server
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) to begin engineering.

---

## 🚀 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescript.org/) (Explicit type safety & ESLint strictly compliant)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Vanilla CSS variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) (HSL Adaptive design tokens)
- **Icons**: [Lucide React](https://lucide.dev/)
- **UI Elements**: Custom frosted-glass panels (`glass-panel`) with responsive micro-animations.

---

## 📄 License

PromptIQ is open-source software licensed under the MIT license.
