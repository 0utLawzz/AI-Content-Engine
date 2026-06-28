import { Link } from "wouter";
import { useGetProjectStats, useGetRecentProjects } from "@workspace/api-client-react";
import { FolderKanban, Plus, Clock, PlayCircle, BarChart3, Box, ArrowRight, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetProjectStats();
  const { data: recentProjects, isLoading: recentLoading } = useGetRecentProjects();

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your video generation engine.</p>
        </div>
        <Link href="/projects/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Project
          </Button>
        </Link>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-border/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-3xl font-bold font-mono">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <PlayCircle className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-3xl font-bold font-mono">{stats.byStatus.active || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Box className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Bulk Jobs</p>
                <p className="text-3xl font-bold font-mono">{stats.totalBulkJobs}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-orange-500" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Exports</p>
                <p className="text-3xl font-bold font-mono">{stats.totalExports}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Recent Projects
            </h2>
            <Link href="/projects">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                View all <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          {recentLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : recentProjects?.length ? (
            <div className="space-y-3">
              {recentProjects.map(project => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="cursor-pointer hover:border-primary/50 transition-colors group">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-16 h-16 rounded bg-accent flex-shrink-0 overflow-hidden flex items-center justify-center border border-border">
                        {project.thumbnail ? (
                          <img src={project.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Video className="w-6 h-6 text-muted-foreground opacity-50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate text-foreground group-hover:text-primary transition-colors">{project.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{project.description || 'No description'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs bg-accent/50 border-border">
                            {project.contentType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Badge 
                          variant={project.status === 'active' ? 'default' : 'secondary'}
                          className={project.status === 'active' ? 'bg-primary/20 text-primary border-primary/20 hover:bg-primary/30' : ''}
                        >
                          {project.status}
                        </Badge>
                        {project.sceneCount !== undefined && (
                          <span className="text-xs font-mono text-muted-foreground">{project.sceneCount} scenes</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="border-dashed bg-transparent">
              <CardContent className="p-12 text-center flex flex-col items-center">
                <Video className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-1">No projects yet</h3>
                <p className="text-muted-foreground mb-4">Create your first content generation project.</p>
                <Link href="/projects/new">
                  <Button>Get Started</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Content Distribution</h2>
          <Card>
            <CardContent className="p-6">
              {statsLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : stats && stats.byContentType.length > 0 ? (
                <div className="space-y-4">
                  {stats.byContentType.map((item, i) => (
                    <div key={item.contentType} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{item.contentType.replace('_', ' ')}</span>
                        <span className="font-mono text-muted-foreground">{item.count}</span>
                      </div>
                      <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${Math.max(5, (item.count / stats.total) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Not enough data to display
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
