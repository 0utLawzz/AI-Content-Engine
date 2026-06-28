import React from 'react';
import { 
  MonitorPlay, 
  LayoutDashboard, 
  Folder, 
  Film, 
  Settings, 
  Plus, 
  Play,
  CheckCircle2,
  Clock,
  Activity,
  Maximize2
} from 'lucide-react';
import './StudioTimeline.css';

export function StudioTimeline() {
  const projects = [
    { id: 1, name: "Summer Sale 2024", type: "Promo", lastUpdated: "10m ago", duration: "00:00:15:00", track: 1, width: 240, color: "bg-blue-900/50 border-blue-500/50" },
    { id: 2, name: "Product Launch: Apex", type: "Teaser", lastUpdated: "1h ago", duration: "00:00:30:00", track: 2, width: 320, color: "bg-purple-900/50 border-purple-500/50" },
    { id: 3, name: "Weekly Q&A Shorts", type: "Social", lastUpdated: "3h ago", duration: "00:01:00:00", track: 1, width: 400, color: "bg-emerald-900/50 border-emerald-500/50" },
    { id: 4, name: "Testimonial Cut", type: "Interview", lastUpdated: "1d ago", duration: "00:00:45:00", track: 3, width: 280, color: "bg-orange-900/50 border-orange-500/50" },
  ];

  const renderQueue = [
    { id: 101, project: "Summer Sale 2024", task: "Encoding MP4 (1080x1920)", progress: 68, status: "rendering", timeRemaining: "02:14" },
    { id: 102, project: "Product Launch: Apex", task: "Generating Subtitles", progress: 100, status: "completed", timeRemaining: "--" },
    { id: 103, project: "Weekly Q&A Shorts", task: "Waiting for resources", progress: 0, status: "queued", timeRemaining: "Pending" },
  ];

  return (
    <div className="w-[1280px] h-[820px] overflow-hidden flex flex-col font-sans text-white studio-timeline" style={{ backgroundColor: 'var(--bg-dark)' }}>
      {/* Top HUD Strip */}
      <div className="h-12 border-b border-[#27272a] flex items-center px-4 justify-between bg-[#161619]">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-500" />
            <span className="font-mono text-xs text-amber-500 font-semibold tracking-wider">STUDIO CONSOLE</span>
          </div>
          
          {/* Metrics */}
          <div className="flex items-center gap-6 border-l border-[#27272a] pl-6">
            <div className="flex flex-col">
              <span className="font-mono text-lg leading-tight">24</span>
              <span className="text-[9px] uppercase tracking-wider text-[#8b8b93]">Total Projects</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-lg leading-tight text-amber-400">3</span>
              <span className="text-[9px] uppercase tracking-wider text-[#8b8b93]">Active</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-lg leading-tight">12</span>
              <span className="text-[9px] uppercase tracking-wider text-[#8b8b93]">Bulk Jobs</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-lg leading-tight text-blue-400">1,402</span>
              <span className="text-[9px] uppercase tracking-wider text-[#8b8b93]">Total Exports</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-1.5 text-xs font-semibold rounded-sm flex items-center gap-2 transition-colors">
            <Plus className="w-3 h-3" />
            NEW PROJECT
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Rail */}
        <div className="w-14 border-r border-[#27272a] flex flex-col items-center py-4 bg-[#0a0a0c] justify-between">
          <div className="flex flex-col gap-6">
            <button className="p-2 text-white/40 hover:text-white transition-colors relative group">
              <LayoutDashboard className="w-5 h-5" />
              <div className="absolute left-full ml-2 px-2 py-1 bg-[#27272a] text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">Dashboard</div>
            </button>
            <button className="p-2 text-amber-500 relative group">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-500 rounded-r"></div>
              <Folder className="w-5 h-5" />
            </button>
            <button className="p-2 text-white/40 hover:text-white transition-colors relative group">
              <Film className="w-5 h-5" />
            </button>
          </div>
          <button className="p-2 text-white/40 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Center Workspace */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Viewport Area (Top Half) */}
          <div className="flex-1 p-6 flex gap-6 bg-[#0d0d0f]">
            {/* Main Preview / Recent Projects grid */}
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">Active Projects</h2>
                <button className="text-xs text-white/50 hover:text-white flex items-center gap-1">
                  <Maximize2 className="w-3 h-3" /> View All
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 flex-1">
                {projects.slice(0,2).map(p => (
                  <div key={p.id} className="border border-[#27272a] rounded-md bg-[#161619] p-4 flex flex-col justify-between group hover:border-amber-500/50 transition-colors cursor-pointer relative overflow-hidden">
                    {/* Fake preview image background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-black/40 z-0"></div>
                    
                    <div className="relative z-10 flex justify-between items-start">
                      <span className="text-xs font-mono bg-black/50 px-2 py-1 rounded text-white/70 border border-white/10">{p.type}</span>
                      <span className="text-xs text-white/40 font-mono">{p.lastUpdated}</span>
                    </div>
                    
                    <div className="relative z-10 mt-12">
                      <h3 className="font-medium text-lg text-white group-hover:text-amber-400 transition-colors truncate">{p.name}</h3>
                      <div className="flex items-center gap-3 mt-2 text-xs text-white/50 font-mono">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {p.duration}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel: Render Queue */}
            <div className="w-80 flex flex-col gap-4 border-l border-[#27272a] pl-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 flex items-center gap-2">
                Render Queue
                <span className="bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded text-[10px]">1 ACTIVE</span>
              </h2>
              
              <div className="flex flex-col gap-3">
                {renderQueue.map(render => (
                  <div key={render.id} className={`p-3 rounded-md border ${
                    render.status === 'rendering' ? 'border-amber-500/30 bg-amber-500/5' : 
                    render.status === 'completed' ? 'border-[#27272a] bg-[#161619]/50' : 
                    'border-[#27272a] bg-transparent opacity-60'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-white truncate w-48">{render.project}</span>
                        <span className="text-[10px] text-white/50">{render.task}</span>
                      </div>
                      {render.status === 'rendering' && <Play className="w-3 h-3 text-amber-500 animate-pulse" />}
                      {render.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                      {render.status === 'queued' && <Clock className="w-3 h-3 text-white/40" />}
                    </div>
                    
                    {render.status === 'rendering' ? (
                      <div className="mt-3">
                        <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-white/10">
                          <div 
                            className="h-full bg-amber-500 render-progress-stripes" 
                            style={{ width: `${render.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1.5">
                          <span className="font-mono text-[9px] text-amber-500">{render.progress}%</span>
                          <span className="font-mono text-[9px] text-white/40">ETC {render.timeRemaining}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-[10px] font-mono text-white/30 uppercase">{render.status}</span>
                        {render.status === 'completed' && <span className="font-mono text-[9px] text-emerald-500">DONE</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline Area (Bottom Half) */}
          <div className="h-64 border-t border-[#27272a] bg-[#161619] flex flex-col">
            {/* Timeline Header (Timecode ruler) */}
            <div className="h-6 border-b border-[#27272a] flex">
              <div className="w-48 border-r border-[#27272a] bg-[#0a0a0c] flex items-center px-3">
                <span className="text-[10px] uppercase text-white/40 font-mono tracking-wider">Tracks</span>
              </div>
              <div className="flex-1 relative overflow-hidden bg-[#0d0d0f] opacity-50">
                {/* Fake ruler markings */}
                <div className="absolute inset-0 flex">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="flex-1 border-l border-white/10 flex flex-col justify-end pb-1 pl-1">
                      <span className="text-[8px] font-mono text-white/30">00:0{i}:00</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline Tracks */}
            <div className="flex-1 overflow-y-auto relative">
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px)',
                backgroundSize: '50px 100%'
              }}></div>
              
              {[1, 2, 3].map(track => (
                <div key={track} className="h-16 flex border-b border-[#27272a]/50 group relative">
                  {/* Track Header */}
                  <div className="w-48 bg-[#0a0a0c] border-r border-[#27272a] flex items-center px-3 z-10 shrink-0">
                    <span className="text-xs text-white/60 font-mono">V{track}</span>
                  </div>
                  
                  {/* Track Content */}
                  <div className="flex-1 relative flex items-center px-4 pt-2 pb-2">
                    {projects.filter(p => p.track === track).map(project => (
                      <div 
                        key={project.id}
                        className={`absolute h-10 border rounded-sm flex flex-col justify-center px-2 shadow-lg timeline-clip-pattern ${project.color}`}
                        style={{ width: `${project.width}px`, left: `${project.id * 80 + (track * 40)}px` }}
                      >
                        <span className="text-[10px] font-medium text-white truncate drop-shadow-md">{project.name}</span>
                        {/* Fake waveform block */}
                        <div className="absolute bottom-1 left-2 right-2 h-2 flex items-end gap-[1px] opacity-30">
                          {Array.from({ length: Math.floor(project.width / 4) }).map((_, i) => (
                            <div key={i} className="w-1 bg-white" style={{ height: `${Math.max(20, Math.random() * 100)}%` }}></div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="h-8 border-t border-[#27272a] bg-[#0a0a0c] flex items-center justify-between px-4">
        <div className="flex items-center gap-4 text-[10px] font-mono text-[#8b8b93]">
          <span className="flex items-center gap-1"><MonitorPlay className="w-3 h-3" /> System Ready</span>
          <span className="text-[#27272a]">|</span>
          <span>{projects.length} Projects</span>
          <span className="text-[#27272a]">|</span>
          <span>1 Active Render</span>
        </div>
        <div className="font-mono text-xs text-amber-500">
          00:00:00:00
        </div>
      </div>
    </div>
  );
}
