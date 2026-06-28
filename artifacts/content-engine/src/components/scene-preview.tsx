import { useEffect, useRef, useState } from "react";
import type { ContentConfig } from "@workspace/api-client-react/src/generated/api.schemas";

interface Scene {
  id: number;
  text: string;
  voiceScript: string;
  cta?: string | null;
  duration: number;
  animationPreset?: string | null;
  backgroundType?: string | null;
  subtitleMode?: string | null;
}

interface ScenePreviewProps {
  scene: Scene;
  config: ContentConfig;
  isPlaying?: boolean;
  onPlayToggle?: () => void;
}

const THEME_PALETTES: Record<string, { bg: string; accent: string; text: string; sub: string }> = {
  luxury:     { bg: "linear-gradient(135deg,#0a0a0a 0%,#1a1400 100%)", accent: "#D4AF37", text: "#fff8e1", sub: "#D4AF37" },
  modern:     { bg: "linear-gradient(135deg,#0f0a1a 0%,#1a0d36 100%)", accent: "#7c3aed", text: "#f3f0ff", sub: "#a78bfa" },
  corporate:  { bg: "linear-gradient(135deg,#0a0f1a 0%,#0d1b2a 100%)", accent: "#3b82f6", text: "#e0f0ff", sub: "#60a5fa" },
  minimal:    { bg: "linear-gradient(135deg,#f8f8f8 0%,#ececec 100%)",  accent: "#222",    text: "#111",    sub: "#555" },
  energetic:  { bg: "linear-gradient(135deg,#1a0500 0%,#2d0a00 100%)", accent: "#f97316", text: "#fff7ed", sub: "#fb923c" },
  kids:       { bg: "linear-gradient(135deg,#1a003a 0%,#003a1a 100%)", accent: "#f472b6", text: "#fff",    sub: "#34d399" },
  cinematic:  { bg: "linear-gradient(135deg,#0a0700 0%,#1a1200 100%)", accent: "#f59e0b", text: "#fef9ee", sub: "#fbbf24" },
  dark:       { bg: "linear-gradient(135deg,#030303 0%,#0a0a0a 100%)", accent: "#fff",    text: "#fff",    sub: "#aaa" },
  neon:       { bg: "linear-gradient(135deg,#000b00 0%,#000f10 100%)", accent: "#00ff88", text: "#e0fff4", sub: "#00e5ff" },
};

const ASPECT_RATIOS: Record<string, { w: number; h: number }> = {
  "9:16": { w: 135, h: 240 },
  "16:9": { w: 240, h: 135 },
  "1:1":  { w: 200, h: 200 },
  "4:5":  { w: 192, h: 240 },
};

const CAMERA_ANIMATIONS: Record<string, string> = {
  push_in:   "cameraScaleUp 8s ease-out infinite alternate",
  push_out:  "cameraScaleDown 8s ease-out infinite alternate",
  pan_left:  "cameraPanLeft 8s ease-in-out infinite alternate",
  pan_right: "cameraPanRight 8s ease-in-out infinite alternate",
  zoom:      "cameraZoom 6s ease-in-out infinite alternate",
  parallax:  "cameraParallax 10s ease-in-out infinite alternate",
  orbit:     "cameraOrbit 12s linear infinite",
  shake:     "cameraShake 0.3s ease-in-out infinite",
};

function Background({ type, palette, animate }: { type: string; palette: typeof THEME_PALETTES.modern; animate: boolean }) {
  if (type === "particles") {
    return (
      <div className="absolute inset-0 overflow-hidden" style={{ background: palette.bg }}>
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-60"
            style={{
              width: `${2 + (i % 4)}px`,
              height: `${2 + (i % 4)}px`,
              backgroundColor: palette.accent,
              left: `${(i * 37 + 7) % 100}%`,
              top: `${(i * 53 + 13) % 100}%`,
              animation: animate ? `particleFloat ${3 + (i % 4)}s ease-in-out ${(i * 0.3)}s infinite alternate` : "none",
              opacity: 0.3 + (i % 5) * 0.1,
            }}
          />
        ))}
      </div>
    );
  }

  if (type === "animated_shapes") {
    return (
      <div className="absolute inset-0 overflow-hidden" style={{ background: palette.bg }}>
        {[
          { size: 60, x: 10, y: 20, delay: 0 },
          { size: 40, x: 70, y: 60, delay: 1.5 },
          { size: 80, x: 40, y: 75, delay: 0.8 },
          { size: 30, x: 85, y: 15, delay: 2 },
        ].map((shape, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${shape.size}px`,
              height: `${shape.size}px`,
              border: `2px solid ${palette.accent}`,
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              opacity: 0.12,
              animation: animate ? `shapeFloat ${5 + i}s ease-in-out ${shape.delay}s infinite alternate` : "none",
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
        {[
          { size: 50, x: 25, y: 45, delay: 0.5, rotation: 45 },
          { size: 35, x: 75, y: 30, delay: 1.2, rotation: 30 },
        ].map((shape, i) => (
          <div
            key={`sq${i}`}
            className="absolute"
            style={{
              width: `${shape.size}px`,
              height: `${shape.size}px`,
              border: `2px solid ${palette.accent}`,
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              opacity: 0.1,
              transform: `translate(-50%, -50%) rotate(${shape.rotation}deg)`,
              animation: animate ? `shapeRotate ${8 + i * 2}s linear ${shape.delay}s infinite` : "none",
            }}
          />
        ))}
      </div>
    );
  }

  if (type === "glassmorphism") {
    return (
      <div className="absolute inset-0 overflow-hidden" style={{ background: palette.bg }}>
        {[
          { size: 120, x: 20, y: 30, color: palette.accent },
          { size: 90, x: 70, y: 60, color: palette.sub },
          { size: 70, x: 50, y: 10, color: palette.accent },
        ].map((blob, i) => (
          <div
            key={i}
            className="absolute rounded-full blur-2xl"
            style={{
              width: `${blob.size}px`,
              height: `${blob.size}px`,
              backgroundColor: blob.color,
              left: `${blob.x}%`,
              top: `${blob.y}%`,
              opacity: 0.25,
              animation: animate ? `blobFloat ${6 + i * 2}s ease-in-out ${i * 1.5}s infinite alternate` : "none",
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
        <div className="absolute inset-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.08)" }} />
      </div>
    );
  }

  if (type === "3d_space") {
    return (
      <div className="absolute inset-0 overflow-hidden" style={{ background: "linear-gradient(180deg,#000005 0%,#000010 100%)" }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${1 + (i % 2)}px`,
              height: `${1 + (i % 2)}px`,
              left: `${(i * 29 + 3) % 100}%`,
              top: `${(i * 47 + 7) % 100}%`,
              opacity: 0.1 + (i % 8) * 0.08,
              animation: animate ? `starTwinkle ${2 + (i % 3)}s ease-in-out ${(i * 0.15) % 3}s infinite alternate` : "none",
            }}
          />
        ))}
        <div className="absolute bottom-0 left-0 right-0 h-24 opacity-20" style={{ background: `linear-gradient(to top, ${palette.accent}40, transparent)` }} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0" style={{ background: type === "static" ? palette.bg.split(",")[0].replace("linear-gradient(135deg", "").replace("(", "") : palette.bg }} />
  );
}

function SubtitleText({ text, mode, accent, textColor, animate }: { text: string; mode: string; accent: string; textColor: string; animate: boolean }) {
  const words = text.split(" ");
  const [activeWord, setActiveWord] = useState(0);

  useEffect(() => {
    if (!animate || mode !== "word_highlight") return;
    setActiveWord(0);
    const interval = setInterval(() => {
      setActiveWord(prev => {
        if (prev >= words.length - 1) { clearInterval(interval); return prev; }
        return prev + 1;
      });
    }, 350);
    return () => clearInterval(interval);
  }, [animate, text, mode, words.length]);

  if (mode === "word_highlight") {
    return (
      <p className="text-center font-bold leading-snug" style={{ color: textColor, fontSize: "10px", textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
        {words.map((word, i) => (
          <span key={i} style={{ color: i === activeWord ? accent : textColor, transition: "color 0.2s", marginRight: "3px" }}>{word}</span>
        ))}
      </p>
    );
  }

  if (mode === "karaoke") {
    return (
      <div className="w-full" style={{ background: "rgba(0,0,0,0.6)", padding: "4px 6px" }}>
        <div className="relative overflow-hidden">
          <p className="text-center font-bold" style={{ color: "rgba(255,255,255,0.4)", fontSize: "9px" }}>{text}</p>
          {animate && (
            <div className="absolute inset-0 overflow-hidden" style={{ animation: "karaokeReveal 3s linear forwards" }}>
              <p className="text-center font-bold" style={{ color: accent, fontSize: "9px" }}>{text}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (mode === "animated") {
    return (
      <p
        className="text-center font-bold leading-snug"
        style={{
          color: textColor,
          fontSize: "9.5px",
          textShadow: `0 0 12px ${accent}80, 0 1px 6px rgba(0,0,0,0.8)`,
          animation: animate ? "animatedText 2s ease-out" : "none",
        }}
      >
        {text}
      </p>
    );
  }

  return (
    <p
      className="text-center font-bold leading-snug"
      style={{
        color: textColor,
        fontSize: "9.5px",
        textShadow: "0 1px 6px rgba(0,0,0,0.8)",
        animation: animate ? "sentenceFadeIn 0.6s ease-out" : "none",
      }}
    >
      {text}
    </p>
  );
}

export function ScenePreview({ scene, config, isPlaying = false, onPlayToggle }: ScenePreviewProps) {
  const palette = THEME_PALETTES[config.theme ?? "modern"] ?? THEME_PALETTES.modern;
  const dims = ASPECT_RATIOS[config.aspectRatio ?? "9:16"] ?? ASPECT_RATIOS["9:16"];
  const bgType = scene.backgroundType ?? config.background ?? "gradient";
  const subtitleMode = scene.subtitleMode ?? config.subtitle?.mode ?? "sentence";
  const camera = config.camera ?? "push_in";
  const cameraAnim = isPlaying ? (CAMERA_ANIMATIONS[camera] ?? CAMERA_ANIMATIONS.push_in) : "none";
  const subtitleEnabled = config.subtitle?.enabled !== false;

  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      setProgress(0);
      startRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    const duration = (scene.duration ?? 6) * 1000;
    const tick = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const elapsed = now - startRef.current;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else { startRef.current = null; }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying, scene.duration, scene.id]);

  return (
    <>
      <style>{`
        @keyframes cameraScaleUp { from { transform: scale(1); } to { transform: scale(1.08); } }
        @keyframes cameraScaleDown { from { transform: scale(1.08); } to { transform: scale(1); } }
        @keyframes cameraPanLeft { from { transform: translateX(0); } to { transform: translateX(-5%); } }
        @keyframes cameraPanRight { from { transform: translateX(0); } to { transform: translateX(5%); } }
        @keyframes cameraZoom { from { transform: scale(1); } to { transform: scale(1.12); } }
        @keyframes cameraParallax { from { transform: translate(0,0); } to { transform: translate(-4%,2%); } }
        @keyframes cameraOrbit { from { transform: rotate(0deg) scale(1.05); } to { transform: rotate(360deg) scale(1.05); } }
        @keyframes cameraShake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-1px); } 75% { transform: translateX(1px); } }
        @keyframes particleFloat { from { transform: translateY(0); } to { transform: translateY(-12px); } }
        @keyframes shapeFloat { from { transform: translate(-50%,-50%) scale(1); } to { transform: translate(-50%,-50%) scale(1.1); } }
        @keyframes shapeRotate { from { transform: translate(-50%,-50%) rotate(0deg); } to { transform: translate(-50%,-50%) rotate(360deg); } }
        @keyframes blobFloat { from { transform: translate(-50%,-50%) scale(1); } to { transform: translate(-50%,-50%) scale(1.15); } }
        @keyframes starTwinkle { from { opacity: 0.1; } to { opacity: 0.8; } }
        @keyframes sentenceFadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        @keyframes animatedText { 0% { opacity:0; letter-spacing:8px; } 100% { opacity:1; letter-spacing:0; } }
        @keyframes karaokeReveal { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0% 0 0); } }
        @keyframes ctaSlide { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes progressFill { from { width: 0%; } to { width: 100%; } }
      `}</style>

      <div
        className="relative rounded-xl overflow-hidden cursor-pointer select-none group"
        style={{ width: `${dims.w}px`, height: `${dims.h}px`, flexShrink: 0 }}
        onClick={onPlayToggle}
        title={isPlaying ? "Pause preview" : "Play preview"}
      >
        {/* Background layer — camera motion applied here */}
        <div className="absolute inset-0 overflow-hidden" style={{ animation: cameraAnim }}>
          <Background type={bgType} palette={palette} animate={isPlaying} />
        </div>

        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)" }} />

        {/* Top gradient for branding area */}
        <div className="absolute inset-x-0 top-0 h-12 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)" }} />

        {/* Branding / watermark */}
        {config.branding?.tagline && (
          <div className="absolute top-2 right-2 text-right">
            <span className="text-[7px] font-semibold tracking-wider" style={{ color: palette.accent, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
              {config.branding.tagline}
            </span>
          </div>
        )}

        {/* Scene number badge */}
        <div className="absolute top-2 left-2">
          <span className="text-[7px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${palette.accent}30`, color: palette.accent, border: `1px solid ${palette.accent}40` }}>
            {String(scene.id).padStart(2, "0")}
          </span>
        </div>

        {/* Center quote text */}
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <p
            className="text-center font-black leading-tight tracking-tight"
            style={{
              color: palette.text,
              fontSize: "11px",
              textShadow: "0 2px 12px rgba(0,0,0,0.9)",
              animation: isPlaying ? "sentenceFadeIn 0.8s ease-out" : "none",
            }}
          >
            {scene.text}
          </p>
        </div>

        {/* Accent line */}
        <div
          className="absolute left-4 right-4 h-px"
          style={{
            top: "calc(50% + 28px)",
            background: `linear-gradient(to right, transparent, ${palette.accent}, transparent)`,
            opacity: 0.6,
          }}
        />

        {/* Bottom subtitle area */}
        {subtitleEnabled && (
          <div className="absolute inset-x-0 bottom-10 px-3">
            <SubtitleText
              text={scene.voiceScript.length > 60 ? scene.voiceScript.slice(0, 57) + "…" : scene.voiceScript}
              mode={subtitleMode}
              accent={palette.accent}
              textColor={palette.text}
              animate={isPlaying}
            />
          </div>
        )}

        {/* CTA */}
        {scene.cta && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center">
            <span
              className="text-[7px] font-bold px-2 py-0.5 rounded-full tracking-wide"
              style={{
                background: palette.accent,
                color: "#000",
                animation: isPlaying ? "ctaSlide 0.6s 1.2s ease-out both" : "none",
              }}
            >
              {scene.cta}
            </span>
          </div>
        )}

        {/* Progress bar */}
        <div className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div
            className="h-full transition-none"
            style={{ width: `${progress * 100}%`, background: `linear-gradient(to right, ${palette.accent}, ${palette.sub})` }}
          />
        </div>

        {/* Play/pause overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: "rgba(0,0,0,0.3)" }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", border: `1px solid ${palette.accent}60` }}>
            {isPlaying ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill={palette.accent}>
                <rect x="1" y="1" width="3" height="8" rx="1"/>
                <rect x="6" y="1" width="3" height="8" rx="1"/>
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" fill={palette.accent}>
                <polygon points="2,1 9,5 2,9"/>
              </svg>
            )}
          </div>
        </div>

        {/* Camera movement label */}
        {isPlaying && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2">
            <span className="text-[6px] uppercase tracking-widest font-mono" style={{ color: `${palette.accent}80` }}>
              {camera.replace("_", " ")}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
