import type { ContentAdapter, ContentPackage, NormalizedScene } from "../interfaces";

export const jsonAdapter: ContentAdapter = {
  name: "json",

  async parse(input: string): Promise<ContentPackage> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(input);
    } catch {
      throw new Error("Invalid JSON — could not parse input");
    }

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("JSON must be an object with at minimum { title, contentType, scenes[] }");
    }

    const raw = parsed as Record<string, unknown>;

    // If it's a raw array of scenes (shorthand format)
    if (Array.isArray(raw.scenes)) {
      return {
        title: String(raw.title ?? "JSON Import"),
        contentType: String(raw.contentType ?? raw.content_type ?? raw.type ?? "general"),
        description: raw.description ? String(raw.description) : null,
        theme: raw.theme ? String(raw.theme) : null,
        voice: raw.voice ? String(raw.voice) : null,
        music: raw.music ? String(raw.music) : null,
        cta: raw.cta ? String(raw.cta) : null,
        brand: raw.brand ? String(raw.brand) : null,
        scenes: normalizeScenes(raw.scenes),
      };
    }

    // Flat array of items (each item becomes a scene)
    if (Array.isArray(parsed)) {
      const scenes = normalizeScenes(parsed);
      return {
        title: "JSON Import",
        contentType: "general",
        description: `Imported from JSON array — ${scenes.length} scenes`,
        scenes,
      };
    }

    throw new Error("JSON format not recognized — expected { title, contentType, scenes[] } or a scene array");
  },
};

function normalizeScenes(items: unknown[]): NormalizedScene[] {
  return items
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item, i) => {
      const text = String(item.text ?? item.quote ?? item.content ?? item.hook ?? item.body ?? "");
      const keywords = Array.isArray(item.keywords)
        ? item.keywords.map(String)
        : typeof item.keywords === "string"
        ? item.keywords.split(/[,;|]/).map((k: string) => k.trim()).filter(Boolean)
        : [];

      return {
        order: typeof item.order === "number" ? item.order : i,
        text,
        voiceScript: String(item.voiceScript ?? item.voice_script ?? item.narration ?? item.script ?? text),
        cta: item.cta ? String(item.cta) : null,
        duration: parseFloat(String(item.duration ?? "6")) || 6,
        animationPreset: item.animationPreset ? String(item.animationPreset) : null,
        backgroundType: item.backgroundType ? String(item.backgroundType) : null,
        subtitleMode: item.subtitleMode ? String(item.subtitleMode) : null,
        keywords,
        thumbnailHint: item.thumbnailHint ? String(item.thumbnailHint) : null,
      };
    })
    .filter(s => s.text.length > 0);
}
