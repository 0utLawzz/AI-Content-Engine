import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateProject, useListPlugins } from "@workspace/api-client-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Sparkles, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().optional(),
  contentType: z.string().min(1, "Please select a content type"),
});

export default function NewProject() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: plugins, isLoading: pluginsLoading } = useListPlugins();
  const createProject = useCreateProject();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      contentType: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createProject.mutate(
      { data: values },
      {
        onSuccess: (project) => {
          toast({
            title: "Project created",
            description: "Your new project has been initialized.",
          });
          setLocation(`/projects/${project.id}`);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Failed to create project",
            description: "There was an error creating your project. Please try again.",
          });
        },
      }
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/projects")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">New Project</h1>
          <p className="text-muted-foreground mt-1">Start a new video generation workflow.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border-border/50 bg-card/50 backdrop-blur shadow-sm">
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>Basic information to identify your project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Daily Tech Tips, Motivational Shorts" className="bg-background/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What kind of content will this project generate?" 
                        className="bg-background/50 resize-none" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-primary" />
                Select Content Type
              </CardTitle>
              <CardDescription>Choose the plugin engine that will generate your content.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                      {pluginsLoading ? (
                        [1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)
                      ) : plugins?.map((plugin) => (
                        <div
                          key={plugin.slug}
                          className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                            field.value === plugin.slug
                              ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(153,51,255,0.15)]"
                              : "border-border/50 bg-background/50 hover:border-primary/50 hover:bg-accent"
                          }`}
                          onClick={() => field.onChange(plugin.slug)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-foreground leading-tight">{plugin.name}</h3>
                            {plugin.isPopular && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-orange-500/20 text-orange-500 hover:bg-orange-500/20 border-orange-500/20">
                                POPULAR
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground flex-1 mb-3 line-clamp-2">{plugin.description}</p>
                          <div className="flex gap-1 flex-wrap mt-auto">
                            {plugin.tags?.slice(0, 2).map(tag => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-accent text-muted-foreground font-mono">
                                {tag}
                              </span>
                            ))}
                          </div>
                          {field.value === plugin.slug && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-background">
                              <Sparkles className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <FormMessage className="mt-4" />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="ghost" onClick={() => setLocation("/projects")}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProject.isPending} className="min-w-[120px]">
              {createProject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Project"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
