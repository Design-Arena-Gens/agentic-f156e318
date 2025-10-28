## Agentic Twitter Automation Studio

Opinionated UI + serverless orchestrator for an n8n-powered Twitter growth workflow. Configure campaign inputs, trigger AI-authored tweets (with optional imagery), and launch automatic engagement/DM routines.

### Stack

- Next.js App Router + Tailwind UI
- Server action (`/api/tweet`) that coordinates OpenAI + Twitter API
- Downloadable n8n workflow (`public/workflows/twitter-ai-orchestrator.json`)

### Local development

1. Install dependencies

   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example` and fill in API credentials.

3. Start dev server

   ```bash
   npm run dev
   ```

### Environment variables

| key | description |
| --- | --- |
| `OPENAI_API_KEY` | Required for GPT-4o-mini text + image generation. |
| `TWITTER_APP_KEY` / `TWITTER_APP_SECRET` | Twitter app credentials. |
| `TWITTER_ACCESS_TOKEN` / `TWITTER_ACCESS_SECRET` | OAuth 1.0a user tokens (read/write). |
| `TWITTER_BEARER_TOKEN` | Optional: powers search enrichment. |
| `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` | Optional if using OAuth2 features. |
| `TWITTER_WEBHOOK_ENV` | Optional: DM webhook env name. |

Without credentials the UI falls back to mock content so you can demo flows safely.

### n8n workflow

1. Import `public/workflows/twitter-ai-orchestrator.json`.
2. Add your webhook credentials and point the `AGENTIC_AGENT_ENDPOINT` environment variable (optional) at the deployed `/api/tweet` endpoint.
3. Map the form submission (or cron trigger) to launch the automation.

### Production deploy

Ready for Vercel (`npm run build` / `npm run start`). Ensure the required env vars are set in the project dashboard.
