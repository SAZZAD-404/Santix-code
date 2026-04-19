# CodeAgent — AI Coding Assistant

An open-source, full-stack AI coding agent. Describe what you want to build and get a working app — instantly.

## Features

- **Full-stack generation** — frontend, backend, database in one shot
- **Live preview** — see your app running as the AI writes code
- **Iterative editing** — request changes in plain English
- **Bring your own API key** — use Anthropic, OpenAI, Google, or xAI keys
- **Local history** — all chats saved in your browser

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Setup

```bash
git clone <your-repo-url>
cd <project>
pnpm install
```

Copy `.env.local` and add at least one AI provider API key:

```env
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...
# or
GOOGLE_API_KEY=...
# or
XAI_API_KEY=xai-...
```

### Run

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

## Project Structure

- `app/` — Remix frontend application
- `chef-agent/` — AI agent tools and prompts
- `template/` — project template used for new apps
- `public/` — static assets

## License

MIT
