import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetProject, 
  useGetProjectConfiguration, 
  useUpdateProjectConfiguration,
  useGetProjectScenes,
  useGenerateScenes,
  useCreateExport
} from "@workspace/api-client-react";
import { 
  ArrowLeft, Settings, Video, Download, RefreshCw, Sparkles, Wand2, Music, Clapperboard, Type, Palette, Paintbrush, Film, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import type { ContentConfig } from "@workspace/api-client-react/src/generated/api.schemas";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id || "0", 10);
  const { toast } = useToast();

  const { data: project, isLoading: projectLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: ["project", projectId] }
  });
  
  const { data: configRecord, isLoading: configLoading } = useGetProjectConfiguration(projectId, {
    query: { enabled: !!projectId, queryKey: ["projectConfig", projectId] }
  });

  const { data: scenes, isLoading: scenesLoading, refetch: refetchScenes } = useGetProjectScenes(projectId, {
    query: { enabled: !!projectId, queryKey: ["projectScenes", projectId] }
  });

  const updateConfig = useUpdateProjectConfiguration();
  const generateScenes = useGenerateScenes();
  const createExport = useCreateExport();

  // Local state for configuration to enable optimistic UI and debounced saves
  const [localConfig, setLocalConfig] = useState<ContentConfig | null>(null);
  const initializedRef = useRef<number | null>(null);

  useEffect(() => {
    if (configRecord && initializedRef.current !== projectId) {
      setLocalConfig(configRecord.config);
      initializedRef.current = projectId;
    }
  }, [configRecord, projectId]);

  // Debounced save
  const mutateFnRef = useRef(updateConfig.mutate);
  mutateFnRef.current = updateConfig.mutate;

  const saveConfig = useCallback((newConfig: ContentConfig) => {
    mutateFnRef.current(
      { id: projectId, data: { config: newConfig } },
      {
        onError: () => toast({ variant: "destructive", title: "Failed to save configuration" })
      }
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
          refetchScenes();
        },
        onError: () => toast({ variant: "destructive", title: "Generation failed" })
      }
    );
  };

  const handleExport = () => {
    createExport.mutate(
      { data: { projectId, format: "mp4", platform: "instagram_reels" } },
      {
        onSuccess: () => toast({ title: "Export queued", description: "Your video is being rendered." }),
        onError: () => toast({ variant: "destructive", title: "Export failed" })
      }
    );
  };

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
              <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="uppercase text-[10px] px-1.5 tracking-wider">
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
          <Button variant="outline" className="gap-2" onClick={() => window.open(`/api/projects/${projectId}/preview`, '_blank')}>
            <Video className="w-4 h-4" /> Preview
          </Button>
          <Button className="gap-2 shadow-[0_0_15px_rgba(153,51,255,0.2)]" onClick={handleExport} disabled={createExport.isPending}>
            {createExport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Render Video
          </Button>
        </div>
      </div>

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
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {['luxury', 'modern', 'corporate', 'minimal', 'energetic', 'kids', 'cinematic', 'dark', 'neon'].map(t => (
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
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select background" />
                    </SelectTrigger>
                    <SelectContent>
                      {['static', 'gradient', 'particles', 'video', 'animated_shapes', 'glassmorphism', '3d_space'].map(t => (
                        <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Aspect Ratio</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['9:16', '16:9', '1:1', '4:5'].map(ratio => (
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
                    value={localConfig.voice?.provider || "elevenlabs"} 
                    onValueChange={(val: any) => handleConfigChange(c => ({ ...c, voice: { ...c.voice, provider: val } }))}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['browser', 'openai', 'elevenlabs', 'google', 'azure'].map(t => (
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
                          <SelectTrigger className="bg-background h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
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
                          <span className="text-xs font-mono">{localConfig.music?.volume || 0.2}</span>
                        </div>
                        <Slider 
                          value={[localConfig.music?.volume || 0.2]} 
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
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select movement" />
                    </SelectTrigger>
                    <SelectContent>
                      {['push_in', 'push_out', 'pan_left', 'pan_right', 'orbit', 'parallax', 'zoom', 'shake'].map(t => (
                        <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Default camera motion applied to all generated scenes.</p>
                </div>
                
                <div className="space-y-3">
                  <Label>Animation Preset</Label>
                  <Select 
                    value={localConfig.animation || "cinematic"} 
                    onValueChange={(val: any) => handleConfigChange(c => ({ ...c, animation: val }))}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select animation" />
                    </SelectTrigger>
                    <SelectContent>
                       {['luxury', 'modern', 'corporate', 'minimal', 'energetic', 'kids', 'cinematic', 'dark', 'neon'].map(t => (
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
                      value={localConfig.subtitle?.mode || "word_highlight"} 
                      onValueChange={(val: any) => handleConfigChange(c => ({ ...c, subtitle: { ...c.subtitle, mode: val } }))}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['sentence', 'word_highlight', 'karaoke', 'animated'].map(t => (
                          <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
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
                      branding: { ...c.branding, tagline: e.target.value } 
                    }))}
                    className="bg-background"
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Right Column: Scenes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" /> Storyboard
            </h2>
            <Button variant="outline" size="sm" onClick={handleGenerateScenes} disabled={generateScenes.isPending} className="gap-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              {generateScenes.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Auto-Generate
            </Button>
          </div>

          <div className="space-y-4">
            {scenesLoading ? (
              [1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
            ) : scenes?.length ? (
              scenes.map((scene, i) => (
                <Card key={scene.id} className="bg-card/50 border-border/50 overflow-hidden relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 group-hover:bg-primary transition-colors"></div>
                  <CardContent className="p-0 flex">
                    <div className="w-24 md:w-32 bg-accent/30 flex flex-col items-center justify-center border-r border-border/50 p-2 shrink-0">
                      <span className="text-xs font-mono text-muted-foreground mb-1">SCENE</span>
                      <span className="text-2xl font-bold text-foreground/50">{String(scene.order).padStart(2, '0')}</span>
                      <span className="text-[10px] mt-2 px-1.5 py-0.5 bg-background rounded-sm text-muted-foreground border">{scene.duration}s</span>
                    </div>
                    <div className="p-4 md:p-5 flex-1 space-y-3 min-w-0">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Visual Prompt</Label>
                        <p className="text-sm font-medium text-foreground">{scene.text}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Voiceover Script</Label>
                        <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3 py-1 bg-accent/10 rounded-r-md">"{scene.voiceScript}"</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
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
