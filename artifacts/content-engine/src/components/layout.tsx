import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, FolderKanban, PlaySquare, Layers, Download, Plus, Video, Sparkles, Box, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/plugins", label: "Plugins", icon: Layers },
    { href: "/bulk", label: "Bulk Gen", icon: Box },
    { href: "/exports", label: "Exports", icon: Download },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary">
            <Video className="w-6 h-6" />
            <span className="font-bold tracking-tight text-lg text-foreground">ContentEngine</span>
          </div>
        </div>
        
        <div className="p-4 flex-grow flex flex-col gap-1 overflow-y-auto">
          <Link href="/projects/new" className="mb-4">
            <Button className="w-full justify-start gap-2 shadow-[0_0_15px_rgba(153,51,255,0.2)]">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </Link>
          
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2 mt-4">Menu</div>
          
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}>
                  <item.icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground cursor-pointer rounded-md hover:bg-accent transition-colors">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background flex flex-col relative">
        {/* Subtle top glow */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-primary/5 pointer-events-none blur-3xl rounded-full translate-y-[-50%]" />
        
        <div className="flex-1 p-8 z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
