import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, Link } from "wouter";
import {
  useGetProject,
  useGetProjectConfiguration,
  useUpdateProjectConfiguration,
  useGetProjectScenes,
  useGenerateScenes,
  useCreateExport,
  useGetExport,
} from "@workspace/api-client-react";
import {
  ArrowLeft, Settings, Video, Download, Sparkles, Wand2, Music,
  Clapperboard, Type, Palette, Film, Loader2, CheckCircle, XCircle,
  Clock, Cpu, Zap, TerminalSquare, ChevronDown, ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScenePreview } from "@/components/scene-preview";
import type { ContentConfig } from "@workspace/api-client-react/src/generated/api.schemas";

const RENDER_STAGES = ["pending", "processing", "encoding", "completed", "failed"] as const;
type RenderStage = typeof RENDER_STAGES[number];

const STAGE_LABELS: Record<RenderStage, string> = {
  pending:    "Queued",
  processing: "Preparing",
  encoding:   "Encoding",
  completed:  "Completed",
  failed:     "Failed",
};

const STAGE_PROGRESS: Record<RenderStage, number> = {
  pending:    5,
  processing: 25,
  encoding:   65,
  completed:  100,
  failed:     100,
};

function StageIcon({ stage }: { stage: RenderStage }) {
  if (stage === "completed") return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  if (stage === "failed")    return <XCircle    className="w-4 h-4 text-destructive" />;
  if (stage === "encoding")  return <Cpu        className="w-4 h-4 text-primary animate-pulse" />;
  if (stage === "processing") return <Zap       className="w-4 h-4 text-yellow-500 animate-pulse" />;
  return <Clock className="w-4 h-4 text-muted-foreground" />;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id || "0", 10);
  const { toast } = useToast();

  const { data: project, isLoading: projectLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: ["project", projectId] },
  });
  const { data: configRecord, isLoading: configLoading } = useGetProjectConfiguration(projectId, {
    query: { enabled: !!projectId, queryKey: ["projectConfig", projectId] },
  });
  const { data: scenes, isLoading: scenesLoading, refetch: refetchScenes } = useGetProjectScenes(projectId, {
    query: { enabled: !!projectId, queryKey: ["projectScenes", projectId] },
  });

  const updateConfig    = useUpdateProjectConfiguration();
  const generateScenes  = useGenerateScenes();
  const createExport    = useCreateExport();

  const [localConfig, setLocalConfig]     = useState<ContentConfig | null>(null);
  const initializedRef                    = useRef<number | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<number | null>(null);
  const [playingSceneId,  setPlayingSceneId]  = useState<number | null>(null);

  // Render tracking
  const [activeExportId, setActiveExportId] = useState<number | null>(null);
  const [renderLogs,     setRenderLogs]     = useState<string[]>([]);
  const [logsExpanded,   setLogsExpanded]   = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const isRenderActive = activeExportId !== null;

  const { data: activeExport, refetch: refetchExport } = useGetExport(activeExportId ?? 0, {
    query: {
      enabled: isRenderActive,
      queryKey: ["export", activeExportId],
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === "completed" || status === "failed") return false;
        return 1500;
      },
    },
  });

  // Poll logs while render is running
  useEffect(() => {
    if (!isRenderActive) return;
    const status = activeExport?.status;
    if (status === "completed" || status === "failed") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/exports/${activeExportId}/logs`);
        if (res.ok) {
          const data = await res.json() as { logs: string[] };
          setRenderLogs(data.logs ?? []);
        }
      } catch {
        // ignore
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isRenderActive, activeExportId, activeExport?.status]);

  // Fetch final logs once done
  useEffect(() => {
    const status = activeExport?.status;
    if ((status === "completed" || status === "failed") && activeExportId) {
      fetch(`/api/exports/${activeExportId}/logs`)
        .then(r => r.json())
        .then((data: { logs: string[] }) => setRenderLogs(data.logs ?? []))
        .catch(() => {});
    }
  }, [activeExport?.status, activeExportId]);

  // Auto-scroll logs
  useEffect(() => {
    if (logsExpanded) {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [renderLogs, logsExpanded]);

  useEffect(() => {
    if (configRecord && initializedRef.current !== projectId) {
      setLocalConfig(configRecord.config);
      initializedRef.current = projectId;
    }
  }, [configRecord, projectId]);

  useEffect(() => {
    if (scenes && scenes.length > 0 && selectedSceneId === null) {
      setSelectedSceneId(scenes[0].id);
    }
  }, [scenes, selectedSceneId]);

  const mutateFnRef = useRef(updateConfig.mutate);
  mutateFnRef.current = updateConfig.mutate;

  const saveConfig = useCallback((newConfig: ContentConfig) => {
    mutateFnRef.current(
      { id: projectId, data: { config: newConfig } },
      { onError: () => toast({ variant: "destructive", title: "Failed to save configuration" }) }
    );
  }, [projectId, toast]);

  const handleConfigChange = (updater: (prev: ContentConfig) => ContentConfig) => {
    if (!localConfig) return;
    const newConfig = updater(localConfig);
    setLocalConfig(newConfig);
    saveConfig(newConfig);
  };

  const handleGenerateScenes = () => {
    generateScenes.mutate(
      { id: projectId, data: { count: 5 } },
      {
        onSuccess: () => {
          toast({ title: "Scenes generated successfully" });
          setSelectedSceneId(null);
          setPlayingSceneId(null);
          refetchScenes();
        },
        onError: () => toast({ variant: "destructive", title: "Generation failed" }),
      }
    );
  };

  const handleExport = () => {
    setRenderLogs([]);
    setLogsExpanded(false);
    createExport.mutate(
      { data: { projectId, format: "mp4", platform: "instagram_reels" } },
      {
        onSuccess: (exp) => {
          setActiveExportId(exp.id);
          toast({ title: "Render started", description: "Your video is being rendered." });
        },
        onError: () => toast({ variant: "destructive", title: "Failed to start render" }),
      }
    );
  };

  const handleDownload = () => {
    if (!activeExportId) return;
    window.location.href = `/api/exports/${activeExportId}/download`;
  };

  const handlePlayToggle = (sceneId: number) => {
    setPlayingSceneId(prev => (prev === sceneId ? null : sceneId));
  };

  const selectedScene = scenes?.find(s => s.id === selectedSceneId) ?? scenes?.[0] ?? null;
  const renderStatus  = (activeExport?.status ?? (activeExportId ? "pending" : null)) as RenderStage | null;
  const isRenderDone  = renderStatus === "completed" || renderStatus === "failed";

  if (projectLoading || configLoading) {
    return <div className="p-8"><Skeleton className="h-64 w-full rounded-xl" /></div>;
  }

  if (!project || !localConfig) {
    return <div className="p-8 text-center text-muted-foreground">Project not found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/50 p-6 rounded-xl border border-border/50 backdrop-blur">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.name}</h1>
              <Badge variant={project.status === "active" ? "default" : "secondary"} className="uppercase text-[10px] px-1.5 tracking-wider">
                {project.status}
              </Badge>
              <Badge variant="outline" className="uppercase text-[10px] px-1.5 tracking-wider bg-primary/5 text-primary border-primary/20">
                {project.contentType}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">{project.description || "No description"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {renderStatus === "completed" && (
            <Button variant="outline" className="gap-2 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10" onClick={handleDownload}>
              <Download className="w-4 h-4" />
              Download MP4
            </Button>
          )}
          <Button
            className="gap-2 shadow-[0_0_15px_rgba(153,51,255,0.2)]"
            onClick={handleExport}
            disabled={createExport.isPending || (isRenderActive && !isRenderDone)}
          >
            {(createExport.isPending || (isRenderActive && !isRenderDone))
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Video className="w-4 h-4" />}
            {isRenderActive && !isRenderDone ? "Rendering…" : "Render Video"}
          </Button>
        </div>
      </div>

      {/* Render Status Panel */}
      {isRenderActive && renderStatus && (
        <div className={`rounded-xl border p-5 space-y-4 ${
          renderStatus === "completed" ? "bg-emerald-500/5 border-emerald-500/30" :
          renderStatus === "failed"    ? "bg-destructive/5 border-destructive/30" :
          "bg-card/50 border-border/50"
        }`}>
          {/* Stage pipeline */}
          <div className="flex items-center gap-2 flex-wrap">
            <StageIcon stage={renderStatus} />
            <span className="font-semibold text-sm text-foreground">
              {renderStatus === "completed"
                ? "Render complete — file ready to download"
                : renderStatus === "failed"
                ? "Render failed — check logs below"
                : `Rendering… ${STAGE_LABELS[renderStatus]}`}
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <Progress
              value={STAGE_PROGRESS[renderStatus]}
              className={`h-2 ${renderStatus === "failed" ? "[&>div]:bg-destructive" : renderStatus === "completed" ? "[&>div]:bg-emerald-500" : ""}`}
            />
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground uppercase">
              {(["pending", "processing", "encoding", "completed"] as const).map((stage) => {
                const current  = RENDER_STAGES.indexOf(renderStatus);
                const thisStage = RENDER_STAGES.indexOf(stage);
                const isPast    = current > thisStage && renderStatus !== "failed";
                const isActive  = stage === renderStatus && renderStatus !== "failed";
                return (
                  <span key={stage} className={
                    isPast  ? "text-emerald-500" :
                    isActive ? "text-primary font-bold" : ""
                  }>
                    {STAGE_LABELS[stage]}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Logs toggle */}
          <div>
            <button
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setLogsExpanded(v => !v)}
            >
              <TerminalSquare className="w-3.5 h-3.5" />
              {logsExpanded ? "Hide" : "Show"} render logs ({renderLogs.length} lines)
              {logsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {logsExpanded && (
              <div className="mt-3 bg-black/80 rounded-lg border border-border/30 p-3 max-h-56 overflow-y-auto font-mono text-[11px] space-y-0.5">
                {renderLogs.length === 0
                  ? <span className="text-muted-foreground">Waiting for logs…</span>
                  : renderLogs.map((line, i) => {
                      const isError = line.toLowerCase().includes("error") || line.toLowerCase().includes("failed");
                      return (
                        <div key={i} className={`leading-relaxed ${isError ? "text-red-400" : "text-green-300/90"}`}>
                          {line}
                        </div>
                      );
                    })
                }
                <div ref={logsEndRef} />
              </div>
            )}
          </div>

          {renderStatus === "completed" && (
            <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleDownload}>
              <Download className="w-4 h-4" />
              Download MP4 File
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 px-1">
            <Settings className="w-5 h-5 text-primary" /> Configuration
          </h2>

          <Tabs defaultValue="visuals" className="w-full">
            <TabsList className="w-full bg-card border border-border grid grid-cols-4 h-auto p-1">
              <TabsTrigger value="visuals" className="flex flex-col gap-1 py-2 data-[state=active]:bg-accent">
                <Palette className="w-4 h-4" /> <span className="text-[10px] uppercase">Visuals</span>
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex flex-col gap-1 py-2 data-[state=active]:bg-accent">
                <Music className="w-4 h-4" /> <span className="text-[10px] uppercase">Audio</span>
              </TabsTrigger>
              <TabsTrigger value="camera" className="flex flex-col gap-1 py-2 data-[state=active]:bg-accent">
                <Clapperboard className="w-4 h-4" /> <span className="text-[10px] uppercase">Camera</span>
              </TabsTrigger>
              <TabsTrigger value="text" className="flex flex-col gap-1 py-2 data-[state=active]:bg-accent">
                <Type className="w-4 h-4" /> <span className="text-[10px] uppercase">Text</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 bg-card rounded-xl border border-border p-5">
              <TabsContent value="visuals" className="m-0 space-y-6">
                <div className="space-y-3">
                  <Label>Theme Aesthetic</Label>
                  <Select
                    value={localConfig.theme}
                    onValueChange={(val: any) => handleConfigChange(c => ({ ...c, theme: val }))}
                  >
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["luxury","modern","corporate","minimal","energetic","kids","cinematic","dark","neon"].map(t => (
                        <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Background Type</Label>
                  <Select
                    value={localConfig.background}
                    onValueChange={(val: any) => handleConfigChange(c => ({ ...c, background: val }))}
                  >
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["static","gradient","particles","video","animated_shapes","glassmorphism","3d_space"].map(t => (
                        <SelectItem key={t} value={t} className="capitalize">{t.replace("_"," ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Aspect Ratio</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["9:16","16:9","1:1","4:5"].map(ratio => (
                      <Button
                        key={ratio}
                        variant={localConfig.aspectRatio === ratio ? "default" : "outline"}
                        className={`text-xs ${localConfig.aspectRatio === ratio ? "bg-primary text-primary-foreground" : "bg-background"}`}
                        onClick={() => handleConfigChange(c => ({ ...c, aspectRatio: ratio as any }))}
                      >
                        {ratio}
                      </Button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="audio" className="m-0 space-y-6">
                <div className="space-y-3">
                  <Label>Voice Provider</Label>
                  <Select
                    value={localConfig.voice?.provider || "browser"}
                    onValueChange={(val: any) => handleConfigChange(c => ({ ...c, voice: { ...c.voice, provider: val } }))}
                  >
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["browser","openai","elevenlabs","google","azure"].map(t => (
                        <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <Label>Background Music</Label>
                    <Switch
                      checked={localConfig.music?.enabled !== false}
                      onCheckedChange={(checked) => handleConfigChange(c => ({ ...c, music: { ...c.music, enabled: checked } }))}
                    />
                  </div>
                  {localConfig.music?.enabled !== false && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Music Mood</Label>
                        <Select
                          value={localConfig.music?.mood || "epic"}
                          onValueChange={(val) => handleConfigChange(c => ({ ...c, music: { ...c.music, mood: val } }))}
                        >
                          <SelectTrigger className="bg-background h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="epic">Epic & Cinematic</SelectItem>
                            <SelectItem value="chill">Lo-Fi Chill</SelectItem>
                            <SelectItem value="energetic">Upbeat & Energetic</SelectItem>
                            <SelectItem value="ambient">Ambient Corporate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <Label className="text-xs text-muted-foreground">Volume</Label>
                          <span className="text-xs font-mono">{localConfig.music?.volume ?? 0.3}</span>
                        </div>
                        <Slider
                          value={[localConfig.music?.volume ?? 0.3]}
                          max={1}
                          step={0.05}
                          onValueChange={([val]) => handleConfigChange(c => ({ ...c, music: { ...c.music, volume: val } }))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="camera" className="m-0 space-y-6">
                <div className="space-y-3">
                  <Label>Global Camera Movement</Label>
                  <Select
                    value={localConfig.camera || "push_in"}
                    onValueChange={(val: any) => handleConfigChange(c => ({ ...c, camera: val }))}
                  >
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["push_in","push_out","pan_left","pan_right","orbit","parallax","zoom","shake"].map(t => (
                        <SelectItem key={t} value={t} className="capitalize">{t.replace("_"," ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Default camera motion applied to all generated scenes.</p>
                </div>

                <div className="space-y-3">
                  <Label>Animation Preset</Label>
                  <Select
                    value={localConfig.animation || "modern"}
                    onValueChange={(val: any) => handleConfigChange(c => ({ ...c, animation: val }))}
                  >
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["luxury","modern","corporate","minimal","energetic","kids","cinematic","dark","neon"].map(t => (
                        <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="text" className="m-0 space-y-6">
                <div className="flex items-center justify-between">
                  <Label>Burn-in Subtitles</Label>
                  <Switch
                    checked={localConfig.subtitle?.enabled !== false}
                    onCheckedChange={(checked) => handleConfigChange(c => ({ ...c, subtitle: { ...c.subtitle, enabled: checked } }))}
                  />
                </div>

                {localConfig.subtitle?.enabled !== false && (
                  <div className="space-y-3 pt-2">
                    <Label>Subtitle Style</Label>
                    <Select
                      value={localConfig.subtitle?.mode || "sentence"}
                      onValueChange={(val: any) => handleConfigChange(c => ({ ...c, subtitle: { ...c.subtitle, mode: val } }))}
                    >
                      <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["sentence","word_highlight","karaoke","animated"].map(t => (
                          <SelectItem key={t} value={t} className="capitalize">{t.replace("_"," ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-border/50">
                  <Label>Watermark / Tagline</Label>
                  <Input
                    placeholder="@yourhandle"
                    value={localConfig.branding?.tagline || ""}
                    onChange={(e) => handleConfigChange(c => ({
                      ...c,
                      branding: { ...c.branding, tagline: e.target.value },
                    }))}
                    className="bg-background"
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Live Preview Panel */}
          {selectedScene && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" /> Live Preview
                </h3>
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                  {localConfig.aspectRatio ?? "9:16"} · {localConfig.theme ?? "modern"}
                </span>
              </div>
              <div className="bg-card rounded-xl border border-border/50 p-4 flex flex-col items-center gap-3">
                <ScenePreview
                  scene={selectedScene}
                  config={localConfig}
                  isPlaying={playingSceneId === selectedScene.id}
                  onPlayToggle={() => handlePlayToggle(selectedScene.id)}
                />
                <p className="text-[10px] text-muted-foreground text-center">
                  {playingSceneId === selectedScene.id ? "Playing — click to pause" : "Click preview to play animation"}
                </p>
                <div className="flex gap-2 flex-wrap justify-center">
                  {[
                    { label: localConfig.background?.replace("_", " ") ?? "gradient", icon: "BG" },
                    { label: localConfig.camera?.replace("_", " ") ?? "push in",      icon: "CAM" },
                    { label: localConfig.subtitle?.mode?.replace("_", " ") ?? "sentence", icon: "SUB" },
                  ].map(tag => (
                    <span key={tag.icon} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-accent/30 text-muted-foreground border border-border/30">
                      {tag.icon}: {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Scenes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" /> Storyboard
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateScenes}
              disabled={generateScenes.isPending}
              className="gap-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
            >
              {generateScenes.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Auto-Generate
            </Button>
          </div>

          <div className="space-y-3">
            {scenesLoading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-36 w-full rounded-xl" />)
            ) : scenes?.length ? (
              scenes.map((scene) => {
                const isSelected = selectedSceneId === scene.id;
                const isPlaying  = playingSceneId  === scene.id;
                return (
                  <Card
                    key={scene.id}
                    className={`overflow-hidden relative group cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "bg-card border-primary/40 shadow-[0_0_20px_rgba(124,58,237,0.12)]"
                        : "bg-card/50 border-border/50 hover:border-border hover:bg-card/80"
                    }`}
                    onClick={() => setSelectedSceneId(scene.id)}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${isSelected ? "bg-primary" : "bg-primary/20 group-hover:bg-primary/40"}`} />
                    <CardContent className="p-0 flex">
                      <div className="shrink-0 p-3 pl-4 flex items-center">
                        <div
                          className="relative overflow-hidden rounded-lg"
                          style={{ width: "54px", height: "96px" }}
                          onClick={(e) => { e.stopPropagation(); setSelectedSceneId(scene.id); handlePlayToggle(scene.id); }}
                        >
                          <ScenePreview
                            scene={scene}
                            config={localConfig}
                            isPlaying={isPlaying}
                            onPlayToggle={() => { setSelectedSceneId(scene.id); handlePlayToggle(scene.id); }}
                          />
                        </div>
                      </div>

                      <div className="p-4 flex-1 space-y-2 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">SCENE {String(scene.order).padStart(2, "0")}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-background rounded-sm text-muted-foreground border border-border/50 font-mono">{scene.duration?.toFixed(1)}s</span>
                          {isSelected && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">SELECTED</span>}
                        </div>
                        <p className="text-sm font-semibold text-foreground leading-snug">{scene.text}</p>
                        <p className="text-xs text-muted-foreground italic border-l-2 border-primary/20 pl-2 leading-snug">
                          "{scene.voiceScript.length > 80 ? scene.voiceScript.slice(0, 77) + "…" : scene.voiceScript}"
                        </p>
                        {scene.cta && (
                          <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                            CTA: {scene.cta}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="border-dashed bg-card/30">
                <CardContent className="p-16 text-center flex flex-col items-center">
                  <Wand2 className="w-12 h-12 text-primary/40 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Empty Storyboard</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">Let the AI engine generate a full sequence of scenes based on your project configuration.</p>
                  <Button onClick={handleGenerateScenes} disabled={generateScenes.isPending} className="gap-2">
                    {generateScenes.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generate Scenes Now
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
