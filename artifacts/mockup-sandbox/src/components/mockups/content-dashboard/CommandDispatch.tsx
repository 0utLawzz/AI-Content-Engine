import React, { useState, useEffect } from 'react';
import { Terminal, Command, Clock, Search, MoreHorizontal, User, Zap, CircleDashed, CheckCircle2, XCircle } from 'lucide-react';
import './_group.css';

const MOCK_PROJECTS = [
  { id: 1, name: 'Spring Campaign', type: 'Promo', status: 'completed', updated: '2m ago' },
  { id: 2, name: 'Q4 Promos', type: 'Social', status: 'rendering', updated: '15m ago' },
  { id: 3, name: 'Holiday Pack', type: 'Ad', status: 'draft', updated: '1h ago' },
  { id: 4, name: 'Product Launch', type: 'Tutorial', status: 'failed', updated: '2h ago' },
];

const MOCK_ACTIVITY = [
  { id: 1, time: '14:32', action: 'Export completed', target: 'Spring Campaign' },
  { id: 2, time: '14:28', action: 'Render started', target: 'Q4 Promos' },
  { id: 3, time: '14:20', action: 'Project created', target: 'Holiday Pack' },
  { id: 4, time: '13:45', action: 'Settings updated', target: 'Global Profile' },
  { id: 5, time: '12:10', action: 'Export failed', target: 'Product Launch' },
  { id: 6, time: '11:05', action: 'Render completed', target: 'Summer Sale' },
  { id: 7, time: '10:30', action: 'Project archived', target: 'Winter Promo' },
];

export function CommandDispatch() {
  const [command, setCommand] = useState('');

  return (
    <div className="w-[1280px] h-[820px] overflow-hidden text-zinc-100 noise-bg font-sans selection:bg-purple-500/30">
      
      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Terminal size={18} className="text-zinc-400" />
          <span className="font-semibold tracking-tight">CONTENT ENGINE</span>
        </div>
        
        <div className="font-mono text-xs text-zinc-400 tracking-wider">
          <span className="text-zinc-300">4</span> PROJECTS <span className="mx-2 opacity-50">·</span> <span className="text-purple-400">2</span> ACTIVE <span className="mx-2 opacity-50">·</span> <span className="text-zinc-300">12</span> EXPORTS
        </div>
        
        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
          <User size={14} className="text-zinc-400" />
        </div>
      </div>

      <div className="relative z-10 flex h-[calc(820px-65px)]">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-12">
          
          {/* Command Input Area */}
          <div className="w-full max-w-3xl mx-auto mt-16 mb-24">
            <div className="relative flex items-center bg-zinc-900/50 border border-white/10 rounded-xl glow-focus transition-all duration-300 backdrop-blur-md">
              <Zap size={20} className="absolute left-5 text-purple-400" />
              <input
                type="text"
                placeholder="Create new project..."
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="w-full bg-transparent border-none outline-none py-5 pl-14 pr-24 text-xl placeholder:text-zinc-600 text-white"
                autoFocus
              />
              <div className="absolute right-4 flex items-center gap-1.5">
                <kbd className="inline-flex h-7 items-center gap-1 rounded bg-zinc-800 px-2 font-mono text-[11px] font-medium text-zinc-400 border border-zinc-700">
                  <Command size={10} /> N
                </kbd>
                <kbd className="inline-flex h-7 items-center rounded bg-purple-500/20 text-purple-400 px-2 font-mono text-[11px] font-medium border border-purple-500/30">
                  ↵
                </kbd>
              </div>
            </div>
          </div>

          {/* Recent Projects Table */}
          <div className="w-full max-w-5xl mx-auto flex-1">
            <h2 className="text-xs font-mono tracking-widest text-zinc-500 mb-6 uppercase">Recent Projects</h2>
            
            <div className="border border-white/10 rounded-lg bg-black/20 backdrop-blur-sm overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="text-xs font-mono text-zinc-500 bg-white/5 border-b border-white/10 uppercase">
                  <tr>
                    <th className="px-6 py-4 font-normal">Project Name</th>
                    <th className="px-6 py-4 font-normal">Type</th>
                    <th className="px-6 py-4 font-normal">Status</th>
                    <th className="px-6 py-4 font-normal">Updated</th>
                    <th className="px-6 py-4 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {MOCK_PROJECTS.map((project) => (
                    <tr key={project.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 font-medium text-zinc-200">
                        {project.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {project.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs font-medium">
                          {project.status === 'completed' && <CheckCircle2 size={14} className="text-emerald-500" />}
                          {project.status === 'rendering' && <CircleDashed size={14} className="text-purple-400 animate-spin" />}
                          {project.status === 'failed' && <XCircle size={14} className="text-red-500" />}
                          {project.status === 'draft' && <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 ml-1 mr-0.5" />}
                          <span className="capitalize text-zinc-400">{project.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-500">
                        {project.updated}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded opacity-0 group-hover:opacity-100 transition-all">
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="w-80 border-l border-white/10 bg-black/40 backdrop-blur-sm p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <Clock size={14} className="text-zinc-500" />
            <h2 className="text-xs font-mono tracking-widest text-zinc-500 uppercase">Activity</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {MOCK_ACTIVITY.map((activity, index) => (
              <div key={activity.id} className="relative pl-6">
                {/* Timeline line */}
                {index !== MOCK_ACTIVITY.length - 1 && (
                  <div className="absolute left-1.5 top-4 bottom-[-16px] w-px bg-white/10" />
                )}
                {/* Timeline dot */}
                <div className="absolute left-[3px] top-1.5 w-1.5 h-1.5 rounded-full bg-zinc-600 ring-4 ring-[#0c0c0c]" />
                
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[11px] text-zinc-500 shrink-0">{activity.time}</span>
                    <span className="text-sm font-medium text-zinc-300">{activity.action}</span>
                  </div>
                  <span className="text-xs text-zinc-500 truncate">{activity.target}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
