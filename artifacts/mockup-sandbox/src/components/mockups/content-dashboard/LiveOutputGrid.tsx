import React from "react";
import { Plus, LayoutDashboard, Folder, HardDriveDownload, PlaySquare, Settings, Activity, Clock, Film } from "lucide-react";
import "./live-output.css";

const MOCK_PROJECTS = [
  {
    id: "p1",
    name: "Tech Startup Promo",
    type: "TikTok",
    updated: "2 hours ago",
    status: "Ready",
    scenes: 12,
    gradient: "from-cyan-400 to-purple-600",
  },
  {
    id: "p2",
    name: "Fitness App Ads",
    type: "Reels",
    updated: "5 hours ago",
    status: "Rendering",
    scenes: 8,
    gradient: "from-orange-400 to-red-600",
  },
  {
    id: "p3",
    name: "Real Estate Tours",
    type: "Shorts",
    updated: "1 day ago",
    status: "Draft",
    scenes: 15,
    gradient: "from-violet-400 to-indigo-600",
  },
  {
    id: "p4",
    name: "Cooking Tips",
    type: "TikTok",
    updated: "2 days ago",
    status: "Ready",
    scenes: 5,
    gradient: "from-rose-400 to-amber-500",
  },
];

export function LiveOutputGrid() {
  return (
    <div className="w-[1280px] h-[820px] overflow-hidden flex font-sans live-output-theme">
      {/* Sidebar */}
      <aside className="w-16 border-r border-white/5 flex flex-col items-center py-6 gap-8 bg-[#050508] z-10 shrink-0">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
          <Film className="w-4 h-4 text-white" />
        </div>
        <nav className="flex flex-col gap-6 w-full items-center">
          <button className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center transition-colors">
            <LayoutDashboard className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-xl text-white/40 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors">
            <Folder className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-xl text-white/40 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors">
            <HardDriveDownload className="w-5 h-5" />
          </button>
        </nav>
        <div className="mt-auto flex flex-col gap-6">
          <button className="w-10 h-10 rounded-xl text-white/40 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative bg-[#080810] flex flex-col">
        {/* Topbar */}
        <header className="h-20 px-8 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-medium tracking-tight text-white/90">Studio Output</h1>
          </div>
          <button className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-full font-medium text-sm hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]">
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </header>

        {/* Ambient HUD */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-4 text-xs font-mono text-white/60 shadow-xl z-20">
          <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-emerald-400" /> 4 Active Projects</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>12 Total Exports</span>
        </div>

        {/* Grid Container */}
        <div className="flex-1 overflow-y-auto px-8 pb-12 pt-4">
          <div className="grid grid-cols-4 gap-6 auto-rows-max">
            
            {/* New Project Card */}
            <button className="group relative flex flex-col gap-3 text-left w-full">
              <div className="aspect-[9/16] w-full rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-3 transition-all hover:bg-white/10 hover:border-white/20">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6 text-white/70" />
                </div>
                <span className="text-sm font-medium text-white/60">Create Project</span>
              </div>
            </button>

            {/* Project Cards */}
            {MOCK_PROJECTS.map((project) => (
              <div key={project.id} className="group relative flex flex-col gap-3 cursor-pointer">
                {/* 9:16 Thumbnail */}
                <div className="aspect-[9/16] w-full rounded-2xl relative overflow-hidden transition-all duration-300 shadow-lg group-hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] group-hover:-translate-y-1">
                  <div className={`absolute inset-0 bg-gradient-to-br ${project.gradient} opacity-80 group-hover:opacity-100 transition-opacity mix-blend-screen`} />
                  <div className="absolute inset-0 bg-noise opacity-20 mix-blend-overlay" />
                  
                  {/* Play Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-sm z-10">
                    <PlaySquare className="w-10 h-10 text-white drop-shadow-lg" />
                  </div>

                  {/* Gradient Overlay bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
                  
                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 w-full p-4 flex flex-col gap-2">
                    <span className="px-2 py-1 rounded bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold tracking-wider text-white w-fit uppercase">
                      {project.type}
                    </span>
                    <h3 className="text-white font-medium text-lg leading-tight line-clamp-2 drop-shadow-md">
                      {project.name}
                    </h3>
                  </div>
                </div>

                {/* Metadata Below Card */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${project.status === 'Ready' ? 'bg-emerald-400' : project.status === 'Rendering' ? 'bg-amber-400 animate-pulse' : 'bg-white/30'}`} />
                    <span className="text-xs text-white/50">{project.status}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/40">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {project.updated}</span>
                    <span className="flex items-center gap-1"><Film className="w-3 h-3" /> {project.scenes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
