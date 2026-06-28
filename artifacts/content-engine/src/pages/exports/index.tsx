import { useState } from "react";
import { Link } from "wouter";
import { useListExports, useListProjects } from "@workspace/api-client-react";
import { Download, Video, Search, FileVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export default function Exports() {
  const [search, setSearch] = useState("");
  const { data: exports, isLoading: exportsLoading } = useListExports();
  const { data: projects, isLoading: projectsLoading } = useListProjects();

  const filteredExports = exports?.filter(exp => {
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
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Download className="w-8 h-8 text-primary" />
            Exports Hub
          </h1>
          <p className="text-muted-foreground mt-1">Access all your rendered video files across all projects.</p>
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
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : filteredExports?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExports.map(exp => {
            const project = projects?.find(p => p.id === exp.projectId);
            const isReady = exp.status === "completed";

            return (
              <Card key={exp.id} className="bg-card/50 border-border/50 overflow-hidden flex flex-col group">
                <CardContent className="p-0 flex-1 flex flex-col">
                  <div className="p-4 border-b border-border/50 flex justify-between items-start bg-accent/20">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-background/80 capitalize">
                        {exp.platform.replace("_", " ")}
                      </Badge>
                      <span className="text-xs font-mono font-medium bg-background px-1.5 py-0.5 rounded text-muted-foreground uppercase border">
                        {exp.format}
                      </span>
                    </div>
                    <Badge
                      variant={isReady ? "default" : "secondary"}
                      className={
                        isReady
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : exp.status === "encoding" || exp.status === "processing"
                          ? "bg-primary/10 text-primary border-primary/20 animate-pulse"
                          : exp.status === "failed"
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : ""
                      }
                    >
                      {exp.status}
                    </Badge>
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    {project ? (
                      <Link href={`/projects/${project.id}`} className="hover:text-primary transition-colors flex-1">
                        <h3 className="font-semibold text-lg mb-1">{project.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{project.description || "No description"}</p>
                      </Link>
                    ) : (
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-muted-foreground mb-1">Unknown Project</h3>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{isReady ? formatBytes(exp.fileSize) : "—"}</span>
                      <span>{formatDistanceToNow(new Date(exp.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-accent/30 flex gap-2">
                    {isReady ? (
                      <Button
                        className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleDownload(exp.id)}
                      >
                        <Download className="w-4 h-4" />
                        Download MP4
                      </Button>
                    ) : (
                      <Button className="w-full gap-2" variant="secondary" disabled>
                        <Video className="w-4 h-4" />
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
  );
}
