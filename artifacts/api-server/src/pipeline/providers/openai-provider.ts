import type { AIProvider, AIGenerateOptions, NormalizedScene } from "../interfaces";

export const openaiProvider: AIProvider = {
  name: "openai",

  async generate(opts: AIGenerateOptions): Promise<NormalizedScene[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured. Add it to your environment secrets.");

    const systemPrompt = `You are a professional short-form video content writer for social media platforms.
Generate exactly ${opts.count} scenes for a video about: "${opts.topic}".
Tone: ${opts.tone ?? "inspirational"}
Style: ${opts.style ?? "modern"}

Respond ONLY with a JSON array of scene objects. Each scene must have:
- text: string (the on-screen quote or headline, max 120 chars)
- voiceScript: string (the full narration, 1-3 sentences)
- cta: string or null (call to action, only on first and last scene)
- duration: number (seconds, 5-10)
- keywords: string[] (2-4 keywords for SEO)
- thumbnailHint: string (one-line visual description for thumbnail)

Example:
[{"text":"Your only limit is your mind.","voiceScript":"Your only limit is your mind. The moment you believe in yourself, everything changes.","cta":"Follow for more","duration":6,"keywords":["mindset","growth"],"thumbnailHint":"Person breaking through a wall"}]`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: systemPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error: ${response.status} — ${err}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    const content = data.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);
    const items: unknown[] = Array.isArray(parsed) ? parsed : (parsed.scenes ?? parsed.items ?? []);

    return items
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .slice(0, opts.count)
      .map((item, i) => ({
        order: i,
        text: String(item.text ?? ""),
        voiceScript: String(item.voiceScript ?? item.voice_script ?? item.text ?? ""),
        cta: item.cta ? String(item.cta) : null,
        duration: parseFloat(String(item.duration ?? "6")) || 6,
        animationPreset: opts.style ?? "modern",
        backgroundType: "gradient",
        subtitleMode: "word_highlight",
        keywords: Array.isArray(item.keywords) ? item.keywords.map(String) : [],
        thumbnailHint: item.thumbnailHint ? String(item.thumbnailHint) : null,
      }));
  },
};
