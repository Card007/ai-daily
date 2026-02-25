# AI Daily Digest

> This project is based on [vigorX777/ai-daily-digest](https://github.com/vigorX777/ai-daily-digest).

Fetches the latest articles from 92 top Hacker News tech blogs recommended by [Andrej Karpathy](https://x.com/karpathy), filters them through multi-dimensional AI scoring, and generates a structured daily digest in Markdown. Works with any OpenAI-compatible API.

> Sources from [Hacker News Popularity Contest 2025](https://refactoringenglish.com/tools/hn-popularity/), covering simonwillison.net, paulgraham.com, overreacted.io, gwern.net, krebsonsecurity.com, and more.

## Quick Start

```bash
cp .env.example .env
# Edit .env, fill in your OPENAI_API_KEY (optionally override OPENAI_API_BASE / OPENAI_MODEL)

npx -y bun scripts/digest.ts --hours 48 --top-n 30 --lang en --output ./digest.md
```

### CLI Arguments

| Flag | Default | Description |
|------|---------|-------------|
| `--hours <n>` | 48 | Time window for article filtering (hours) |
| `--date <YYYY-MM-DD>` | — | Filter articles from a specific date (mutually exclusive with `--hours`) |
| `--top-n <n>` | 15 | Number of top articles to include |
| `--lang <zh\|en>` | zh | Output language |
| `--output <path>` | `./digest-YYYYMMDD.md` | Output file path |
| `--fetch-only` | — | Only fetch RSS and save to cache (no AI key needed) |
| `--cache <path>` | — | Load articles from cache file, skip RSS fetching |

### Two-Stage Mode

When AI scoring fails (e.g., JSON parse errors), use two-stage mode to avoid re-fetching RSS:

```bash
# Stage 1: fetch + filter → cache file (no AI key needed)
bun scripts/digest.ts --hours 24 --fetch-only --output "./cache-$(date +%Y_%m_%d).json"

# Stage 2: AI score + summarize (can re-run on failure without re-fetching)
bun scripts/digest.ts --cache "./cache-$(date +%Y_%m_%d).json" --top-n 30 --lang en \
  --output "./web/docs/$(date +%Y_%m_%d)_en.md"
```

## Pipeline

```
RSS Fetch (92 feeds, 10 concurrent, two-phase retry)
  → Time Filter (--hours / --date)
  → [--fetch-only: save cache and exit]
  → [--cache: load from cache, skip above]
  → AI Scoring (batches of 10, 2 concurrent; 3-dimension scoring + categorization + keywords)
  → AI Summarization (Top N only, 4-6 sentence structured summaries)
  → Trend Highlights + Markdown Report Generation
```

1. **RSS Fetch** — Concurrent fetching from 92 sources (10 concurrent, 30s timeout). Failed feeds enter a second-phase retry (2 concurrent, 45s timeout). Supports RSS 2.0 and Atom.
2. **Time Filter** — Filters articles within the specified time window.
3. **AI Scoring** — Scores articles on relevance, quality, and timeliness (1-10 each), with automatic categorization and keyword extraction.
4. **AI Summarization** — Generates structured summaries (4-6 sentences), title translations, and recommendation reasons for Top N articles.
5. **Trend Highlights** — Synthesizes 2-3 macro trends from the day's tech scene.

## Digest Structure

| Section | Content |
|---------|---------|
| Today's Highlights | 3-5 sentence macro trend summary |
| Must Read | Top 3 in-depth: bilingual titles, summary, recommendation reason, keywords |
| Data Overview | Stats table + Mermaid pie chart (category distribution) + Mermaid bar chart (top keywords) + ASCII chart + tag cloud |
| Categorized Articles | Grouped by 6 categories, each with translated title, source, relative time, score, summary, keywords |

### Six Categories

| Category | Coverage |
|----------|----------|
| AI / ML | AI, machine learning, LLM, deep learning |
| Security | Security, privacy, vulnerabilities, cryptography |
| Engineering | Software engineering, architecture, programming languages, system design |
| Tools / OSS | Dev tools, open-source projects, newly released libraries/frameworks |
| Opinion | Industry perspectives, personal reflections, career development |
| Other | Everything else |

## Project Structure

```
scripts/
  digest.ts              # CLI entry point, orchestrates the pipeline
  lib/
    types.ts             # Type definitions and constants
    feeds.ts             # 92 RSS feed URLs
    fetcher.ts           # Concurrent RSS fetching + two-phase retry
    rss-parser.ts        # Zero-dependency RSS/Atom XML parsing (regex-based)
    ai-client.ts         # OpenAI-compatible API client
    ai-scoring.ts        # AI 3-dimension scoring + categorization + keywords
    ai-summary.ts        # AI summarization + title translation
    report.ts            # Markdown report assembly
    visualization.ts     # Mermaid charts / ASCII bar charts / tag cloud
    env.ts               # .env file loader
web/                     # Next.js 15 digest viewer app
  app/
    page.tsx             # Home (digest list)
    digest/[date]/
      page.tsx           # Single digest rendering
  lib/
    docs.ts              # Digest file reading utilities
    mermaid.tsx          # Mermaid chart component (client-side rendering)
.github/workflows/
  daily-digest.yml       # GitHub Actions daily cron job
```

## Requirements

- [Bun](https://bun.sh) runtime (auto-installed via `npx -y bun`)
- `OPENAI_API_KEY` — API key for any OpenAI-compatible service (not needed with `--fetch-only`)
- Optional: `OPENAI_API_BASE` (custom endpoint), `OPENAI_MODEL` (specify model)
- The script auto-loads `.env` and `.env.local` from the current directory (shell variables take precedence)

## Supported AI Providers

Uses the OpenAI-compatible Chat Completions API. Works with any service that supports this format:

| Provider | `OPENAI_API_BASE` | `OPENAI_MODEL` |
|----------|-------------------|----------------|
| OpenAI | `https://api.openai.com/v1` (default) | `gpt-4o-mini` (default) |
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` (auto-inferred) |
| Groq | `https://api.groq.com/openai/v1` | Must specify |
| Together AI | `https://api.together.xyz/v1` | Must specify |
| Qwen | `https://dashscope.aliyuncs.com/compatible-mode/v1` | Must specify |

## Sources

92 RSS feeds curated from the most popular independent tech blogs on Hacker News, including:

> Simon Willison · Paul Graham · Dan Abramov · Gwern · Krebs on Security · Antirez · John Gruber · Troy Hunt · Mitchell Hashimoto · Steve Blank · Eli Bendersky · Fabien Sanglard ...

See `scripts/lib/feeds.ts` for the full list.

## GitHub Actions Automation

The project includes a GitHub Actions workflow that automatically generates daily digests (both Chinese and English) and commits them.

- **Schedule**: Daily at UTC 06:00 (Beijing 14:00)
- **Manual trigger**: Repository Actions → Daily Digest → Run workflow
- **Output**: `web/docs/YYYY_MM_DD.md` (Chinese) and `web/docs/YYYY_MM_DD_en.md` (English)
- **Time window**: `--hours 28` (4h buffer over 24h to prevent cron drift from missing articles)

### Configure Secrets

In repository Settings → Secrets and variables → Actions, add:

| Secret | Required | Description |
|--------|----------|-------------|
| `OPENAI_API_KEY` | Yes | API key for an OpenAI-compatible service |
| `OPENAI_API_BASE` | No | Custom API endpoint |
| `OPENAI_MODEL` | No | Specify model name |

## Web Viewer

The `web/` directory contains a Next.js 15 app for browsing all generated digests in the browser.

### Local Development

```bash
cd web
npm install
npm run dev
```

Make sure there is at least one `YYYY_MM_DD.md` file in `web/docs/` (run the script manually first), then visit `http://localhost:3000`.

### Deploy to Vercel

1. Import this repository on [Vercel](https://vercel.com)
2. Set **Root Directory** to `web/`
3. Framework is auto-detected as Next.js — deploy directly

Vercel will automatically redeploy whenever GitHub Actions pushes a new digest.

### Tech Stack

| Item | Choice |
|------|--------|
| Framework | Next.js 15 (App Router), React 19 |
| Markdown rendering | react-markdown + remark-gfm + rehype-raw |
| Charts | Mermaid v11 (client-side rendering) |
| Styling | Tailwind CSS v4 + @tailwindcss/typography |
