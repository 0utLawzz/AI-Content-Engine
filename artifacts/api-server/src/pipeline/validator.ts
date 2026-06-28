import type { ContentPackage, ValidationIssue, ValidationResult, NormalizedScene } from "./interfaces";

const VALID_THEMES = ["luxury","modern","corporate","minimal","energetic","kids","cinematic","dark","neon"];
const VALID_BG = ["static","gradient","particles","video","animated_shapes","glassmorphism","3d_space"];
const VALID_SUBTITLE = ["sentence","word_highlight","karaoke","animated"];

function validateScene(scene: Partial<NormalizedScene>, index: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const row = index + 1;

  if (!scene.text?.trim()) {
    issues.push({ severity: "error", field: `scenes[${index}].text`, message: "Scene text is required", row });
  } else if (scene.text.length > 300) {
    issues.push({ severity: "warning", field: `scenes[${index}].text`, message: "Scene text exceeds 300 characters — may be truncated on screen", row });
  }

  if (!scene.voiceScript?.trim()) {
    issues.push({ severity: "warning", field: `scenes[${index}].voiceScript`, message: "No voice script — text will be used as fallback", row });
  }

  if (!scene.duration || scene.duration <= 0) {
    issues.push({ severity: "warning", field: `scenes[${index}].duration`, message: "Invalid duration — defaulting to 6s", row });
  } else if (scene.duration > 60) {
    issues.push({ severity: "warning", field: `scenes[${index}].duration`, message: "Duration over 60s is not recommended for short-form content", row });
  }

  if (scene.backgroundType && !VALID_BG.includes(scene.backgroundType)) {
    issues.push({ severity: "warning", field: `scenes[${index}].backgroundType`, message: `Unknown background type '${scene.backgroundType}' — will use 'gradient'`, row });
  }

  if (scene.subtitleMode && !VALID_SUBTITLE.includes(scene.subtitleMode)) {
    issues.push({ severity: "warning", field: `scenes[${index}].subtitleMode`, message: `Unknown subtitle mode '${scene.subtitleMode}' — will use 'sentence'`, row });
  }

  return issues;
}

function repairScene(scene: Partial<NormalizedScene>, index: number): NormalizedScene {
  return {
    order: scene.order ?? index,
    text: scene.text?.trim() || `Scene ${index + 1}`,
    voiceScript: scene.voiceScript?.trim() || scene.text?.trim() || `Scene ${index + 1}`,
    cta: scene.cta ?? null,
    duration: (scene.duration && scene.duration > 0) ? Math.min(scene.duration, 60) : 6,
    animationPreset: scene.animationPreset ?? null,
    backgroundType: (scene.backgroundType && VALID_BG.includes(scene.backgroundType)) ? scene.backgroundType : "gradient",
    subtitleMode: (scene.subtitleMode && VALID_SUBTITLE.includes(scene.subtitleMode)) ? scene.subtitleMode : "sentence",
    keywords: scene.keywords ?? [],
    thumbnailHint: scene.thumbnailHint ?? null,
  };
}

export function validatePackage(pkg: Partial<ContentPackage>): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!pkg.title?.trim()) {
    issues.push({ severity: "error", field: "title", message: "Package title is required" });
  }
  if (!pkg.contentType?.trim()) {
    issues.push({ severity: "warning", field: "contentType", message: "No content type specified — will default to 'general'" });
  }
  if (pkg.theme && !VALID_THEMES.includes(pkg.theme)) {
    issues.push({ severity: "warning", field: "theme", message: `Unknown theme '${pkg.theme}' — will use 'modern'` });
  }
  if (!pkg.scenes || pkg.scenes.length === 0) {
    issues.push({ severity: "error", field: "scenes", message: "Package must contain at least one scene" });
  } else if (pkg.scenes.length > 50) {
    issues.push({ severity: "warning", field: "scenes", message: `${pkg.scenes.length} scenes is large — consider splitting into multiple projects` });
  }

  const sceneIssues = (pkg.scenes ?? []).flatMap((s, i) => validateScene(s, i));
  issues.push(...sceneIssues);

  const repairedScenes = (pkg.scenes ?? []).map((s, i) => repairScene(s, i));
  const estimatedDuration = repairedScenes.reduce((sum, s) => sum + s.duration, 0);

  const repairedPackage: ContentPackage = {
    title: pkg.title?.trim() || "Untitled Package",
    contentType: pkg.contentType?.trim() || "general",
    description: pkg.description ?? null,
    theme: (pkg.theme && VALID_THEMES.includes(pkg.theme)) ? pkg.theme : (pkg.theme ? "modern" : null),
    voice: pkg.voice ?? null,
    music: pkg.music ?? null,
    cta: pkg.cta ?? null,
    brand: pkg.brand ?? null,
    scenes: repairedScenes,
  };

  return {
    valid: !issues.some(i => i.severity === "error"),
    issues,
    package: repairedPackage,
    stats: {
      sceneCount: repairedScenes.length,
      estimatedDuration,
      warnings: issues.filter(i => i.severity === "warning").length,
      errors: issues.filter(i => i.severity === "error").length,
    },
  };
}
