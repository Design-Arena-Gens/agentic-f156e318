/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

type EngagementMode = "like" | "retweet" | "reply" | "dm";

interface GenerationResponse {
  tweet: string;
  imageUrl?: string;
  log: string[];
}

export default function Home() {
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("");
  const [tone, setTone] = useState("witty");
  const [callToAction, setCallToAction] = useState("");
  const [hashtags, setHashtags] = useState("ai automation growth");
  const [engagementModes, setEngagementModes] = useState<EngagementMode[]>([
    "like",
    "retweet",
  ]);
  const [dmTarget, setDmTarget] = useState("@ExampleBrand");
  const [dmMessage, setDmMessage] = useState(
    "Hey {{brand}}, loved your latest launch! Let's collaborate on automation."
  );
  const [autoImage, setAutoImage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResponse | null>(null);

  const toggleMode = (mode: EngagementMode) => {
    setEngagementModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/tweet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          niche,
          tone,
          callToAction,
          hashtags: hashtags.split(" ").filter(Boolean),
          engagementModes,
          dmTarget,
          dmMessage,
          autoImage,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to generate tweet");
      }

      const payload = (await response.json()) as GenerationResponse;
      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-4">
          <span className="w-fit rounded-full border border-slate-800 px-3 py-1 text-xs uppercase tracking-widest text-slate-400">
            Twitter Agent Studio
          </span>
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">
            Automate your Twitter presence with AI + n8n
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-slate-300">
            Configure the strategic inputs that feed the n8n workflow. This
            dashboard orchestrates AI-authored tweets, image generation,
            engagement bursts, and direct outreach so your brand stays visible
            without manual effort.
          </p>
        </header>

        <main className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur">
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
                  Topic Focus
                  <input
                    required
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder="e.g. AI productivity tactics"
                    className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
                  Audience Niche
                  <input
                    required
                    value={niche}
                    onChange={(event) => setNiche(event.target.value)}
                    placeholder="e.g. SaaS founders"
                    className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
                Tone
                <input
                  required
                  value={tone}
                  onChange={(event) => setTone(event.target.value)}
                  placeholder="e.g. Witty, insightful, energetic"
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
                Call-to-action
                <input
                  value={callToAction}
                  onChange={(event) => setCallToAction(event.target.value)}
                  placeholder="Optional: drive readers to a product, newsletter, DM, etc."
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
                Hashtags (space separated)
                <input
                  value={hashtags}
                  onChange={(event) => setHashtags(event.target.value)}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                />
              </label>

              <fieldset className="rounded-2xl border border-slate-800 p-6">
                <legend className="px-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Engagement Burst
                </legend>
                <p className="mb-4 text-sm text-slate-400">
                  Select which engagement behaviours the workflow should execute
                  after posting.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["like", "retweet", "reply", "dm"] as EngagementMode[]).map(
                    (mode) => {
                      const labelMap: Record<EngagementMode, string> = {
                        like: "Auto-like target tweets",
                        retweet: "Auto-retweet curated feed",
                        reply: "Thread replies to strategic posts",
                        dm: "Send DM outreach",
                      };

                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => toggleMode(mode)}
                          className={`rounded-2xl border px-4 py-3 text-left transition ${
                            engagementModes.includes(mode)
                              ? "border-sky-500/70 bg-sky-500/10 text-sky-200"
                              : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
                          }`}
                        >
                          <span className="text-sm font-semibold uppercase tracking-wide">
                            {mode.toUpperCase()}
                          </span>
                          <span className="mt-1 block text-xs text-slate-400">
                            {labelMap[mode]}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>

                {engagementModes.includes("reply") && (
                  <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs leading-relaxed text-slate-400">
                    Thread replies use the base prompt with additional context
                    crafted by GPT. Configure the search terms for candidate
                    tweets inside the n8n workflow.
                  </p>
                )}
              </fieldset>

              <fieldset className="rounded-2xl border border-slate-800 p-6">
                <legend className="px-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  AI Imagery
                </legend>
                <p className="mb-4 text-sm text-slate-400">
                  Allow the workflow to generate Midjourney-style companion
                  artwork via OpenAI&apos;s image endpoint whenever it fits the
                  narrative.
                </p>
                <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-200">
                  <input
                    type="checkbox"
                    checked={autoImage}
                    onChange={(event) => setAutoImage(event.target.checked)}
                    className="h-5 w-5 rounded border border-slate-700 bg-slate-950 text-sky-500 focus:ring-sky-500"
                  />
                  Enable autonomous image drops
                </label>
              </fieldset>

              {engagementModes.includes("dm") && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
                    DM target handle / list
                    <input
                      value={dmTarget}
                      onChange={(event) => setDmTarget(event.target.value)}
                      placeholder="@ExampleBrand or comma-separated handles"
                      className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
                    DM message template
                    <textarea
                      value={dmMessage}
                      onChange={(event) => setDmMessage(event.target.value)}
                      rows={4}
                      className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                    />
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-sky-500 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-950 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
              >
                {loading ? "Generating..." : "Generate AI Tweet Plan"}
              </button>

              {error && (
                <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              {result && (
                <div className="flex flex-col gap-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-sm text-emerald-100">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                      Tweet Draft
                    </span>
                    <p className="mt-2 whitespace-pre-line text-base leading-7 text-emerald-50">
                      {result.tweet}
                    </p>
                  </div>
                  {result.imageUrl && (
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
                        Image Preview
                      </span>
                      <img
                        src={result.imageUrl}
                        alt="AI generated concept"
                        className="aspect-video w-full rounded-2xl border border-emerald-500/40 object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
                      Workflow Log
                    </span>
                    <ul className="mt-2 space-y-1 text-emerald-100/80">
                      {result.log.map((entry, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                          <span>{entry}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </form>
          </section>

          <aside className="flex flex-col gap-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
              <h2 className="text-lg font-semibold text-white">
                Import the n8n workflow
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Download the orchestrator JSON and import it into your n8n
                instance. Wire the HTTP Webhook trigger to this dashboard by
                copying the endpoint URL into the form submission action.
              </p>
              <a
                href="/workflows/twitter-ai-orchestrator.json"
                download
                className="mt-4 inline-flex items-center justify-center rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white"
              >
                Download workflow JSON
              </a>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-300">
              <h2 className="text-lg font-semibold text-white">
                Quick wiring checklist
              </h2>
              <ul className="mt-3 space-y-2">
                <li>
                  1. Add OpenAI & Twitter credentials in n8n credentials store
                  + .env
                </li>
                <li>
                  2. Enable the webhook trigger & connect `/api/tweet` as the
                  upstream orchestrator
                </li>
                <li>
                  3. Customize the search terms in the engagement branch
                </li>
                <li>
                  4. Set up schedule triggers (cron) for autonomous publishing
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-300">
              <h2 className="text-lg font-semibold text-white">
                Observability
              </h2>
              <p className="mt-2">
                n8n nodes are annotated with run data for analytics. Pin the
                success dashboard to track tweet URL, media IDs, and engagement
                actions per execution.
              </p>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
