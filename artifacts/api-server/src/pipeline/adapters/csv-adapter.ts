import type { ContentAdapter, ContentPackage, NormalizedScene } from "../interfaces";

const CSV_COLUMN_ALIASES: Record<string, string[]> = {
  title:       ["title", "name", "project"],
  text:        ["text", "quote", "content", "hook", "main", "body", "message"],
  voiceScript: ["voice", "voicescript", "narration", "script", "voiceover"],
  cta:         ["cta", "calltoaction", "call_to_action", "action"],
  duration:    ["duration", "length", "time", "seconds"],
  theme:       ["theme", "style", "aesthetic"],
  animationPreset: ["animation", "preset", "anim"],
  backgroundType:  ["background", "bg", "backdrop"],
  subtitleMode:    ["subtitle", "subtitles", "caption"],
  keywords:    ["keywords", "tags", "hashtags"],
  category:    ["category", "type", "contenttype"],
  author:      ["author", "by", "source"],
};

function parseCSV(raw: string): string[][] {
  const lines = raw.trim().split(/\r?\n/);
  return lines.map(line => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        cells.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

function resolveColumn(header: string): string | null {
  const normalized = header.toLowerCase().replace(/[\s_-]/g, "");
  for (const [field, aliases] of Object.entries(CSV_COLUMN_ALIASES)) {
    if (aliases.some(a => a.replace(/[\s_-]/g, "") === normalized)) return field;
  }
  return null;
}

export const csvAdapter: ContentAdapter = {
  name: "csv",

  async parse(input: string): Promise<ContentPackage> {
    const rows = parseCSV(input);
    if (rows.length < 2) throw new Error("CSV must have a header row and at least one data row");

    const headerRow = rows[0].map(h => h.toLowerCase().trim());
    const columnMap: Record<number, string> = {};
    headerRow.forEach((h, i) => {
      const field = resolveColumn(h);
      if (field) columnMap[i] = field;
    });

    const scenes: NormalizedScene[] = [];
    let packageTitle = "CSV Import";
    let packageContentType = "general";
    let packageTheme: string | null = null;
    let packageCta: string | null = null;

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (row.every(c => !c)) continue;

      const fields: Record<string, string> = {};
      row.forEach((cell, i) => {
        if (columnMap[i]) fields[columnMap[i]] = cell;
      });

      if (r === 1) {
        if (fields.title) packageTitle = fields.title;
        if (fields.category) packageContentType = fields.category;
        if (fields.theme) packageTheme = fields.theme;
        if (fields.cta) packageCta = fields.cta;
      }

      const text = fields.text || row[0] || "";
      if (!text) continue;

      const keywordsRaw = fields.keywords ?? "";
      const keywords = keywordsRaw ? keywordsRaw.split(/[,;|]/).map(k => k.trim()).filter(Boolean) : [];

      scenes.push({
        order: scenes.length,
        text,
        voiceScript: fields.voiceScript || text,
        cta: fields.cta ?? packageCta ?? null,
        duration: parseFloat(fields.duration || "6") || 6,
        animationPreset: fields.animationPreset ?? null,
        backgroundType: fields.backgroundType ?? null,
        subtitleMode: fields.subtitleMode ?? null,
        keywords,
        thumbnailHint: null,
      });
    }

    return {
      title: packageTitle,
      contentType: packageContentType,
      description: `Imported from CSV — ${scenes.length} scenes`,
      theme: packageTheme,
      cta: packageCta,
      scenes,
    };
  },
};
