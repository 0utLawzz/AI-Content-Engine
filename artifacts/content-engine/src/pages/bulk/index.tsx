import { useState } from "react";
import { Link } from "wouter";
import { useListBulkJobs, useCreateBulkJob, useCancelBulkJob, useListProjects } from "@workspace/api-client-react";
import { Box, Plus, Search, FileJson, Play, XCircle, AlertCircle, CheckCircle2, Loader2, PlayCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

const createJobSchema = z.object({
  name: z.string().min(1, "Name is required"),
  projectId: z.coerce.number().min(1, "Project is required"),
  inputSource: z.enum(["csv", "json", "manual"]),
  rawItems: z.string().min(10, "Please provide valid JSON input data"),
});

export default function BulkGenerator() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { data: jobs, isLoading: jobsLoading, refetch } = useListBulkJobs();
  const { data: projects, isLoading: projectsLoading } = useListProjects();
  const createJob = useCreateBulkJob();
  const cancelJob = useCancelBulkJob();

  const form = useForm<z.infer<typeof createJobSchema>>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      name: "",
      projectId: undefined,
      inputSource: "json",
      rawItems: '[\n  {\n    "text": "Item 1 text",\n    "topic": "Topic A"\n  },\n  {\n    "text": "Item 2 text",\n    "topic": "Topic B"\n  }\n]',
    },
  });

  function onSubmit(values: z.infer<typeof createJobSchema>) {
    try {
      const parsedItems = JSON.parse(values.rawItems);
      if (!Array.isArray(parsedItems)) throw new Error("Must be a JSON array");
      
      createJob.mutate(
        { 
          data: {
            name: values.name,
            projectId: values.projectId,
            inputSource: values.inputSource,
            items: parsedItems
          }
        },
        {
          onSuccess: () => {
            toast({ title: "Bulk job created", description: "Your job has been queued." });
            setOpen(false);
            form.reset();
            refetch();
          },
          onError: () => {
            toast({ variant: "destructive", title: "Error", description: "Failed to create bulk job." });
          }
        }
      );
    } catch (err) {
      form.setError("rawItems", { message: "Invalid JSON array format." });
    }
  }

  function handleCancel(id: number) {
    cancelJob.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Job cancelled" });
        refetch();
      }
    });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Box className="w-8 h-8 text-primary" />
            Bulk Generator
          </h1>
          <p className="text-muted-foreground mt-1">Generate hundreds of videos automatically from data.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Bulk Job
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] border-border bg-card">
            <DialogHeader>
              <DialogTitle>Create Bulk Job</DialogTitle>
              <DialogDescription>Start a high-volume generation run across a project.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Q3 Motivational Quotes Batch" className="bg-background/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Project</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger className="bg-background/50">
                              <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projectsLoading ? (
                              <div className="p-2 text-sm text-muted-foreground">Loading...</div>
                            ) : projects?.map(p => (
                              <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="inputSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Input Format</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background/50">
                              <SelectValue placeholder="Format" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="json">JSON Array</SelectItem>
                            <SelectItem value="csv" disabled>CSV Upload (Coming Soon)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="rawItems"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex justify-between items-center">
                        <span>Data Payload</span>
                        <span className="text-xs text-muted-foreground font-mono">[{`{text, topic?}`}]</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          className="font-mono text-xs bg-background/80 h-48" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createJob.isPending}>
                    {createJob.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    Start Processing
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {jobsLoading ? (
          [1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : jobs?.length ? (
          jobs.map(job => {
            const project = projects?.find(p => p.id === job.projectId);
            const progress = (job.completedItems / job.totalItems) * 100 || 0;
            
            return (
              <Card key={job.id} className="bg-card/50 border-border/50">
                <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex-1 w-full min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-foreground truncate">{job.name}</h3>
                      <Badge variant="outline" className={`
                        ${job.status === 'completed' ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : ''}
                        ${job.status === 'running' ? 'text-primary border-primary/30 bg-primary/10' : ''}
                        ${job.status === 'failed' ? 'text-destructive border-destructive/30 bg-destructive/10' : ''}
                        ${job.status === 'cancelled' ? 'text-muted-foreground' : ''}
                      `}>
                        {job.status === 'running' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                        {job.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      {project && (
                        <Link href={`/projects/${project.id}`}>
                          <span className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
                            <Box className="w-4 h-4" /> {project.name}
                          </span>
                        </Link>
                      )}
                      <span className="flex items-center gap-1">
                        <FileJson className="w-4 h-4" /> {job.inputSource}
                      </span>
                      <span>Started {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</span>
                    </div>

                    <div className="space-y-2 max-w-2xl">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-foreground">
                          {job.completedItems} / {job.totalItems} Items Processed
                        </span>
                        {job.failedItems ? (
                          <span className="text-destructive flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {job.failedItems} failed
                          </span>
                        ) : (
                          <span>{Math.round(progress)}%</span>
                        )}
                      </div>
                      <Progress value={progress} className={`h-2 ${job.status === 'failed' ? 'bg-destructive/20' : ''}`} />
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 flex items-center gap-3">
                    {job.status === 'running' || job.status === 'pending' ? (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleCancel(job.id)}
                        disabled={cancelJob.isPending}
                      >
                        <XCircle className="w-5 h-5" />
                      </Button>
                    ) : job.status === 'completed' ? (
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-20 bg-card/30 rounded-xl border border-dashed border-border/50">
            <Box className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-1 text-foreground">No bulk jobs</h3>
            <p className="text-muted-foreground mb-4">You haven't run any high-volume generation jobs yet.</p>
            <Button onClick={() => setOpen(true)}>Create Bulk Job</Button>
          </div>
        )}
      </div>
    </div>
  );
}
