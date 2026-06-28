export interface NormalizedScene {
  order: number;
  text: string;
  voiceScript: string;
  cta?: string | null;
  duration: number;
  animationPreset?: string | null;
  backgroundType?: string | null;
  subtitleMode?: string | null;
  keywords?: string[];
  thumbnailHint?: string | null;
}

export interface ContentPackage {
  title: string;
  contentType: string;
  description?: string | null;
  theme?: string | null;
  voice?: string | null;
  music?: string | null;
  cta?: string | null;
  brand?: string | null;
  scenes: NormalizedScene[];
}

export interface ValidationIssue {
  severity: "error" | "warning" | "info";
  field: string;
  message: string;
  row?: number | null;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  package: ContentPackage;
  stats: {
    sceneCount: number;
    estimatedDuration: number;
    warnings: number;
    errors: number;
  };
}

export interface ContentAdapter {
  name: string;
  parse(input: string): Promise<ContentPackage>;
}

export interface AIProvider {
  name: string;
  generate(opts: AIGenerateOptions): Promise<NormalizedScene[]>;
}

export interface AIGenerateOptions {
  topic: string;
  style?: string;
  tone?: string;
  count: number;
  pluginSlug?: string | null;
}
