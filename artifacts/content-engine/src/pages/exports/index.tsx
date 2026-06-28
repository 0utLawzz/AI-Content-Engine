import { useState } from "react";
import { Link } from "wouter";
import { useListExports, useListProjects } from "@workspace/api-client-react";
import { Download, Video, Search, FileVideo, Play, X, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface ExportRecord {
  id: number;
  projectId: number;
  format: string;
  platform: string;
  status: string;
  fileUrl?: string | null;
  fileSize?: number | null;
  createdAt: string;
  completedAt?: string | null;
}

function VideoPreviewModal({ exportId, projectName, onClose }: {
  exportId: number;
  projectName: string;
  onClose: () => void;
}) {
  const downloadUrl = `/api/exports/${exportId}/download`;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-card rounded-2xl border border-border/50 shadow-2xl max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div>
            <p className="font-semibold text-sm text-foreground">{projectName}</p>
            <p className="text-xs text-muted-foreground">Export #{exportId} · MP4</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              download
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video player */}
        <div className="bg-black flex items-center justify-center" style={{ minHeight: 400 }}>
          <video
            src={downloadUrl}
            controls
            autoPlay
            className="w-full max-h-[70vh] object-contain"
            style={{ display: "block" }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
}

export default function Exports() {
  const [search, setSearch] = useState("");
  const [previewExport, setPreviewExport] = useState<{ id: number; name: string } | null>(null);

  const { data: exports, isLoading: exportsLoading } = useListExports();
  const { data: projects, isLoading: projectsLoading } = useListProjects();

  const filteredExports = (exports as ExportRecord[] | undefined)?.filter(exp => {
    if (!search) return true;
    const project = projects?.find(p => p.id === exp.projectId);
    return (
      project?.name.toLowerCase().includes(search.toLowerCase()) ||
      exp.platform.toLowerCase().includes(search.toLowerCase()) ||
      exp.format.toLowerCase().includes(search.toLowerCase())
    );
  });

  function formatBytes(bytes?: number | null) {
    if (!bytes) return "Unknown size";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function handleDownload(exportId: number) {
    window.location.href = `/api/exports/${exportId}/download`;
  }

  return (
    <>
      {previewExport && (
        <VideoPreviewModal
          exportId={previewExport.id}
          projectName={previewExport.name}
          onClose={() => setPreviewExport(null)}
        />
      )}

      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Download className="w-8 h-8 text-primary" />
              Exports Hub
            </h1>
            <p className="text-muted-foreground mt-1">
              Access all your rendered video files across all projects.
            </p>
          </div>

          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by project, platform..."
              className="pl-9 bg-card/50 border-border/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {(exportsLoading || projectsLoading) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : filteredExports?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExports.map(exp => {
              const project = projects?.find(p => p.id === exp.projectId);
              const isReady = exp.status === "completed";
              const projectName = project?.name ?? "Unknown Project";

              return (
                <Card key={exp.id} className="bg-card/50 border-border/50 overflow-hidden flex flex-col group">
                  <CardContent className="p-0 flex-1 flex flex-col">

                    {/* Thumbnail / preview area */}
                    <div
                      className={`relative flex items-center justify-center bg-black/60 border-b border-border/40 ${isReady ? "cursor-pointer" : ""}`}
                      style={{ height: 140 }}
                      onClick={() => isReady && setPreviewExport({ id: exp.id, name: projectName })}
                    >
                      {isReady ? (
                        <>
                          <video
                            src={`/api/exports/${exp.id}/download`}
                            className="w-full h-full object-contain"
                            muted
                            preload="metadata"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                            </div>
                          </div>
                          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Maximize2 className="w-3.5 h-3.5 text-white/70" />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Video className={`w-8 h-8 ${exp.status !== "failed" ? "animate-pulse text-primary" : "text-destructive"}`} />
                          <span className="text-xs font-mono uppercase tracking-wider">
                            {exp.status === "failed" ? "Failed" : "Rendering…"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="bg-background/80 capitalize text-xs">
                            {exp.platform.replace("_", " ")}
                          </Badge>
                          <span className="text-[10px] font-mono bg-background px-1.5 py-0.5 rounded text-muted-foreground uppercase border">
                            {exp.format}
                          </span>
                        </div>
                        <Badge
                          variant={isReady ? "default" : "secondary"}
                          className={
                            isReady
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shrink-0"
                              : exp.status === "encoding" || exp.status === "processing"
                              ? "bg-primary/10 text-primary border-primary/20 animate-pulse shrink-0"
                              : exp.status === "failed"
                              ? "bg-destructive/10 text-destructive border-destructive/20 shrink-0"
                              : "shrink-0"
                          }
                        >
                          {exp.status}
                        </Badge>
                      </div>

                      {project ? (
                        <Link href={`/projects/${project.id}`} className="hover:text-primary transition-colors">
                          <p className="font-semibold text-sm leading-snug line-clamp-1">{projectName}</p>
                        </Link>
                      ) : (
                        <p className="font-semibold text-sm text-muted-foreground">{projectName}</p>
                      )}

                      <div className="mt-auto pt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{isReady ? formatBytes(exp.fileSize) : "—"}</span>
                        <span>{formatDistanceToNow(new Date(exp.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-3 pb-3 flex gap-2">
                      {isReady ? (
                        <>
                          <Button
                            className="flex-1 gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleDownload(exp.id)}
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 gap-1.5 h-8 text-xs"
                            onClick={() => setPreviewExport({ id: exp.id, name: projectName })}
                          >
                            <Play className="w-3.5 h-3.5" />
                            Preview
                          </Button>
                        </>
                      ) : (
                        <Button className="w-full gap-2 h-8 text-xs" variant="secondary" disabled>
                          <Video className="w-3.5 h-3.5" />
                          {exp.status === "failed" ? "Render Failed" : "Rendering…"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-card/30 rounded-xl border border-dashed border-border/50">
            <FileVideo className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-1 text-foreground">No exports found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {search
                ? "No exports match your search."
                : "Rendered videos will appear here. Open a project and click Render Video."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
