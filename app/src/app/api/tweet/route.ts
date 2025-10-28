import { NextResponse } from "next/server";
import OpenAI from "openai";
import { TwitterApi, type SendTweetV2Params } from "twitter-api-v2";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  topic: z.string().min(3),
  niche: z.string().min(3),
  tone: z.string().min(3),
  callToAction: z.string().optional(),
  hashtags: z.array(z.string()).default([]),
  engagementModes: z
    .array(z.enum(["like", "retweet", "reply", "dm"]))
    .default([]),
  dmTarget: z.string().optional(),
  dmMessage: z.string().optional(),
  autoImage: z.boolean().default(false),
});

const sanitizeHashtags = (tags: string[]) =>
  tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => {
      const cleaned = tag.replace(/[^a-zA-Z0-9_]/g, "");
      return cleaned ? `#${cleaned.replace(/^#+/, "")}` : "";
    })
    .filter(Boolean);

const fallbackTweet = (params: {
  topic: string;
  niche: string;
  tone: string;
  callToAction?: string;
  hashtags: string[];
}) => {
  const { topic, niche, tone, callToAction, hashtags } = params;
  const hashtagText = hashtags.join(" ");
  return [
    `🚀 ${topic} update for ${niche}!`,
    `Keeping it ${tone.toLowerCase()} so you stay ahead of the curve.`,
    callToAction ? `➡️ ${callToAction}` : "",
    hashtagText,
  ]
    .filter(Boolean)
    .join("\n\n");
};

const ensureOpenAi = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
};

const ensureTwitterClient = () => {
  const required = [
    process.env.TWITTER_APP_KEY,
    process.env.TWITTER_APP_SECRET,
    process.env.TWITTER_ACCESS_TOKEN,
    process.env.TWITTER_ACCESS_SECRET,
  ];

  if (required.some((value) => !value)) {
    return null;
  }

  return new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY!,
    appSecret: process.env.TWITTER_APP_SECRET!,
    accessToken: process.env.TWITTER_ACCESS_TOKEN!,
    accessSecret: process.env.TWITTER_ACCESS_SECRET!,
  });
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    topic,
    niche,
    tone,
    callToAction,
    hashtags,
    engagementModes,
    dmTarget,
    dmMessage,
    autoImage,
  } = parsed.data;

  const cleanHashtags = sanitizeHashtags(hashtags);
  const log: string[] = [];

  const openai = ensureOpenAi();
  const twitter = ensureTwitterClient();
  const useMockAi = !openai;
  const useMockTwitter = !twitter;
  const imageShouldGenerate = autoImage && Math.random() > 0.4;

  let content = fallbackTweet({
    topic,
    niche,
    tone,
    callToAction,
    hashtags: cleanHashtags,
  });

  let imageDataUrl: string | undefined;
  let postedTweetUrl: string | undefined;
  let postedTweetId: string | undefined;

  if (useMockAi) {
    log.push(
      "OPENAI_API_KEY missing. Using deterministic mock copy for preview."
    );
  } else {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.75,
        messages: [
          {
            role: "system",
            content:
              "You are a senior social media strategist focused on crafting viral, on-brand Twitter posts that feel human, crisp, and clever.",
          },
          {
            role: "user",
            content: [
              `Topic: ${topic}`,
              `Audience: ${niche}`,
              `Tone: ${tone}`,
              callToAction ? `Call to action: ${callToAction}` : "",
              cleanHashtags.length
                ? `Mandatory hashtags: ${cleanHashtags.join(" ")}`
                : "",
              "Compose a single English tweet beneath 270 characters. Use line breaks for pacing if helpful.",
            ]
              .filter(Boolean)
              .join("\n"),
          },
        ],
      });

      const aiTweet =
        response.choices[0]?.message?.content?.trim() ??
        fallbackTweet({
          topic,
          niche,
          tone,
          callToAction,
          hashtags: cleanHashtags,
        });

      content = aiTweet;
      log.push("Generated tweet copy with OpenAI GPT-4o-mini.");
    } catch (error) {
      log.push(
        `OpenAI text generation failed (${(error as Error).message}). Falling back to template copy.`
      );
    }
  }

  if (imageShouldGenerate) {
    if (useMockAi) {
      log.push("Mock image generated (AI key missing).");
      imageDataUrl =
        "https://images.unsplash.com/photo-1522199755839-a2bacb67c546?auto=format&fit=crop&w=1600&q=80";
    } else {
      try {
        const imagePrompt = `Create a cinematic, high-contrast illustration about "${topic}" for a Twitter post targeting ${niche}. The tone should feel ${tone}.`;
        const imageResponse = await openai.images.generate({
          model: "gpt-image-1",
          prompt: imagePrompt,
          size: "1024x1024",
          response_format: "b64_json",
        });
        const b64 = imageResponse.data?.[0]?.b64_json;

        if (b64) {
          imageDataUrl = `data:image/png;base64,${b64}`;
          log.push("Generated companion image with OpenAI image endpoint.");
        }
      } catch (error) {
        log.push(
          `Image generation skipped (${(error as Error).message}). Continuing without media.`
        );
      }
    }
  } else {
    log.push("Image generation skipped for this iteration.");
  }

  const finalTweet = (() => {
    const segments = [content.trim()];
    if (callToAction && !content.includes(callToAction)) {
      segments.push(callToAction);
    }
    const hashtagBlock = cleanHashtags.join(" ");
    if (hashtagBlock && !content.includes("#")) {
      segments.push(hashtagBlock);
    }
    return segments.filter(Boolean).join("\n\n");
  })();

  if (useMockTwitter) {
    log.push(
      "Twitter credentials missing. Skipping live posting and engagement automations."
    );
  } else if (twitter) {
    try {
      const rwClient = twitter.readWrite;
      const mediaIds: string[] = [];

      if (imageDataUrl?.startsWith("data:image")) {
        const base64 = imageDataUrl.split(",")[1];
        if (base64) {
          const buffer = Buffer.from(base64, "base64");
          const uploaded = await rwClient.v1.uploadMedia(buffer, {
            mimeType: "image/png",
          });
          mediaIds.push(uploaded);
          log.push("Uploaded media to Twitter.");
        }
      }

      let mediaPayload: SendTweetV2Params["media"] | undefined;

      if (mediaIds.length > 0) {
        const limited = mediaIds.slice(0, 4);
        if (limited.length === 1) {
          mediaPayload = { media_ids: [limited[0]] };
        } else if (limited.length === 2) {
          mediaPayload = { media_ids: [limited[0], limited[1]] };
        } else if (limited.length === 3) {
          mediaPayload = {
            media_ids: [limited[0], limited[1], limited[2]],
          };
        } else if (limited.length >= 4) {
          mediaPayload = {
            media_ids: [
              limited[0],
              limited[1],
              limited[2],
              limited[3],
            ],
          };
        }
      }

      const tweetResponse = await rwClient.v2.tweet({
        text: finalTweet,
        ...(mediaPayload ? { media: mediaPayload } : {}),
      });

      postedTweetId = tweetResponse.data?.id;
      postedTweetUrl = postedTweetId
        ? `https://twitter.com/i/web/status/${postedTweetId}`
        : undefined;
      log.push("Tweet published via Twitter API.");

      const me = await rwClient.v2.me();
      const myUserId = me.data.id;

      if (postedTweetId && engagementModes.length > 0) {
        const searchQuery = `${topic} ${niche} -is:retweet lang:en`;
        const searchResults = await rwClient.v2.search(searchQuery, {
          max_results: 10,
          expansions: ["author_id"],
        });

        const targetTweets = searchResults.tweets?.filter(
          (tweet) => tweet.id !== postedTweetId
        );

        if (targetTweets && targetTweets.length > 0) {
          const [first] = targetTweets;

          if (engagementModes.includes("like")) {
            await rwClient.v2.like(myUserId, first.id);
            log.push(`Liked tweet ${first.id}.`);
          }

          if (engagementModes.includes("retweet")) {
            await rwClient.v2.retweet(myUserId, first.id);
            log.push(`Retweeted ${first.id}.`);
          }

          if (engagementModes.includes("reply")) {
            const replyPrompt = useMockAi
              ? `Love this perspective on ${topic}!`
              : await (() => {
                  try {
                    return openai!.chat.completions
                      .create({
                        model: "gpt-4o-mini",
                        temperature: 0.7,
                        messages: [
                          {
                            role: "system",
                            content:
                              "Write a concise, value-add reply (under 220 characters) that references the original topic without sounding generic.",
                          },
                          {
                            role: "user",
                            content: `Original tweet context: ${first.text}\nTopic: ${topic}\nTone: ${tone}`,
                          },
                        ],
                      })
                      .then(
                        (completion) =>
                          completion.choices[0]?.message?.content?.trim() ??
                          `Appreciate this insight on ${topic}!`
                      );
                  } catch (error) {
                    log.push(
                      `Reply generation failed (${(error as Error).message}).`
                    );
                    return `Jumping in on this ${topic} convo!`;
                  }
                })();

            await rwClient.v2.reply(replyPrompt, first.id);
            log.push(`Replied to ${first.id}.`);
          }
        } else {
          log.push("No candidate tweets found for engagement search.");
        }
      }

      if (engagementModes.includes("dm") && dmTarget && dmMessage) {
        const handles = dmTarget
          .split(",")
          .map((handle) => handle.trim())
          .filter(Boolean);

        for (const handle of handles) {
          const sanitizedHandle = handle.replace(/^@/, "");
          try {
            const user = await rwClient.v2.userByUsername(sanitizedHandle);
            const recipientId = user.data.id;
            const personalizedMessage = dmMessage.replace(
              /{{\s*brand\s*}}/gi,
              sanitizedHandle
            );

            await (rwClient.v1 as unknown as {
              sendDm: (payload: { recipient_id: string; text: string }) => Promise<void>;
            }).sendDm({
              recipient_id: recipientId,
              text: personalizedMessage,
            });

            log.push(`Sent DM to @${sanitizedHandle}.`);
          } catch (error) {
            log.push(
              `Failed to send DM to @${sanitizedHandle}: ${
                (error as Error).message
              }`
            );
          }
        }
      }
    } catch (error) {
      log.push(`Twitter automation failed: ${(error as Error).message}`);
    }
  }

  if (postedTweetUrl) {
    log.push(`Live tweet URL: ${postedTweetUrl}`);
  }

  return NextResponse.json({
    tweet: finalTweet,
    imageUrl: imageDataUrl,
    log,
  });
}
