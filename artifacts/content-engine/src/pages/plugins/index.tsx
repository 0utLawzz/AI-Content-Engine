import { useGetPluginCategories, useListPlugins } from "@workspace/api-client-react";
import { Layers, Search, Code, Sparkles, Puzzle } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function Plugins() {
  const [search, setSearch] = useState("");
  const { data: categories, isLoading: categoriesLoading } = useGetPluginCategories();
  const { data: allPlugins, isLoading: pluginsLoading } = useListPlugins();

  const filteredPlugins = allPlugins?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.description.toLowerCase().includes(search.toLowerCase()) ||
    p.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Layers className="w-8 h-8 text-primary" />
            Plugin Library
          </h1>
          <p className="text-muted-foreground mt-1">Browse and discover content generation engines.</p>
        </div>
        
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search plugins, tags, or categories..." 
            className="pl-9 bg-card/50 border-border/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {(categoriesLoading || pluginsLoading) ? (
        <div className="space-y-8">
          <Skeleton className="h-10 w-[400px] rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        </div>
      ) : search ? (
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-foreground">Search Results</h2>
          {filteredPlugins?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlugins.map(plugin => (
                <PluginCard key={plugin.slug} plugin={plugin} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card/30 rounded-xl border border-dashed border-border/50">
              <Puzzle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-1 text-foreground">No plugins found</h3>
              <p className="text-muted-foreground">Try a different search term.</p>
            </div>
          )}
        </div>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-card/50 border border-border/50 p-1 rounded-lg w-full justify-start overflow-x-auto">
            <TabsTrigger value="all" className="rounded-md">All Plugins</TabsTrigger>
            {categories?.map(cat => (
              <TabsTrigger key={cat.category} value={cat.category} className="rounded-md capitalize">
                {cat.category.replace('_', ' ')}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allPlugins?.map(plugin => (
                <PluginCard key={plugin.slug} plugin={plugin} />
              ))}
            </div>
          </TabsContent>
          
          {categories?.map(cat => (
            <TabsContent key={cat.category} value={cat.category} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cat.plugins.map(plugin => (
                  <PluginCard key={plugin.slug} plugin={plugin} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}

function PluginCard({ plugin }: { plugin: any }) {
  return (
    <Card className="flex flex-col bg-card/50 border-border/50 hover:border-primary/30 transition-all hover:shadow-[0_4px_20px_rgba(153,51,255,0.05)] group">
      <CardHeader className="pb-3 flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-lg group-hover:text-primary transition-colors">{plugin.name}</CardTitle>
          <CardDescription className="font-mono text-xs mt-1 text-muted-foreground flex items-center gap-1">
            <Code className="w-3 h-3" /> {plugin.slug}
          </CardDescription>
        </div>
        {plugin.isPopular && (
          <Badge variant="secondary" className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border border-orange-500/20">
            <Sparkles className="w-3 h-3 mr-1" /> Popular
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground flex-1 mb-4">{plugin.description}</p>
        <div className="flex flex-wrap gap-2 mt-auto">
          {plugin.tags?.map((tag: string) => (
            <Badge key={tag} variant="outline" className="bg-accent/30 text-xs font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
