
import React, { useState } from 'react';
import { ProjectData, PlotEvent, AppLanguage, ScriptBlock, ScriptBlockType } from '../../types';
import { GeminiService } from '../../services/geminiService';
import { MoreHorizontal, Plus, Wand2, Activity, RefreshCcw, GripHorizontal, FileText, Info, Layers, GitBranch, Zap } from 'lucide-react';
import { getTranslation } from '../../utils/translations';

interface PlotProps {
  data: ProjectData;
  update: (data: Partial<ProjectData>) => void;
  language: AppLanguage;
}

export const PlotModule: React.FC<PlotProps> = ({ data, update, language }) => {
  const t = getTranslation(language);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);

  const plotlines = [
    { id: 'main', label: '主线剧情', color: 'border-accent-500 text-accent-400 bg-accent-500/5' },
    { id: 'subA', label: '支线 A', color: 'border-purple-500 text-purple-400 bg-purple-500/5' },
    { id: 'subB', label: '支线 B', color: 'border-amber-500 text-amber-400 bg-amber-500/5' },
    { id: 'arc', label: '人物成长', color: 'border-blue-500 text-blue-400 bg-blue-500/5' }
  ];

  const renderEventCard = (event: PlotEvent) => {
    const linkedSection = event.actId ? data.outline.find(s => s.id === event.actId) : null;

    return (
      <div 
          key={event.id} 
          className="relative group transition-all duration-300 mb-3 animate-fadeIn"
          draggable
          onDragStart={(e) => { setDraggedEventId(event.id); e.dataTransfer.effectAllowed = 'move'; }}
      >
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-accent-500/50 p-4 transition-all shadow-xl group-hover:bg-white/10">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
               <GripHorizontal size={14} className="text-ink-700 group-hover:text-accent-500 transition-colors" />
               <input value={event.title} onChange={(e) => update({ plotEvents: data.plotEvents.map(ev => ev.id === event.id ? { ...ev, title: e.target.value } : ev) })} className="font-bold text-ink-100 text-xs w-full bg-transparent outline-none focus:text-accent-400 truncate" />
            </div>
            {linkedSection && (
                <div className="relative group/tip ml-2">
                  <Info size={14} className="text-accent-500/50 hover:text-accent-500 cursor-help transition-all" />
                  <div className="absolute bottom-full right-0 mb-3 w-64 p-4 glass-card bg-ink-900/90 border border-white/10 rounded-[20px] shadow-2xl opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-300 z-50">
                    <div className="text-[10px] font-bold text-accent-400 uppercase tracking-widest mb-2 border-b border-white/5 pb-2">{linkedSection.title}</div>
                    <div className="text-[11px] text-ink-300 leading-relaxed line-clamp-4 italic">"{linkedSection.content}"</div>
                  </div>
                </div>
            )}
          </div>

          <div className="flex items-center gap-2">
             <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
               <div className={`h-full bg-accent-500 shadow-[0_0_8px_#10b981]`} style={{ width: `${event.tensionLevel * 10}%` }}></div>
             </div>
             <span className="text-[10px] font-mono font-bold text-accent-500">TENSION {event.tensionLevel}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-ink-950">
      <div className="h-16 border-b border-white/5 px-8 flex items-center justify-between bg-ink-900/30 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-serif font-bold text-ink-100 flex items-center gap-3">
             <GitBranch className="text-accent-400" /> {t.plot.title}
          </h2>
          <div className="h-6 w-px bg-white/10"></div>
          <span className="text-[10px] font-mono text-ink-500 uppercase tracking-[0.2em]">{t.plot.timelineView}</span>
        </div>

        <div className="flex gap-4">
          <button onClick={() => {}} className="flex items-center gap-2 px-5 py-2 bg-white/5 border border-white/10 text-ink-300 rounded-xl hover:bg-white/10 transition-all font-bold text-xs">
            <RefreshCcw size={14} /> {t.plot.syncFromOutline}
          </button>
          <button onClick={() => setIsGenerating(true)} className="flex items-center gap-2 px-5 py-2 bg-accent-500 text-white rounded-xl hover:bg-accent-400 transition-all font-bold text-xs shadow-lg shadow-accent-950/20">
            <Zap size={14} className={isGenerating ? "animate-spin" : ""} /> {t.plot.aiGenEvents}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-transparent p-8">
        <div className="inline-flex flex-col min-w-full">
          {/* Timeline Header */}
          <div className="flex mb-6">
            <div className="w-56 sticky left-0 z-10 bg-ink-950 p-4 shrink-0 flex items-center font-mono font-bold text-[10px] uppercase text-ink-600 tracking-[0.3em] border-r border-white/5">
                Matrix / Root
            </div>
            {data.outline.map((act, idx) => (
              <div key={act.id} className="w-80 shrink-0 p-6 bg-white/5 border border-white/10 text-white flex flex-col items-center justify-center gap-1 mx-3 rounded-2xl shadow-xl relative group hover:border-accent-500/30 transition-all">
                  <span className="text-[10px] font-mono font-black text-accent-500 uppercase tracking-widest">CHAPTER 0{idx + 1}</span>
                  <span className="text-sm font-bold truncate w-full text-center uppercase">{act.title}</span>
                  <div className="absolute -bottom-px left-8 right-8 h-px bg-accent-500 shadow-[0_0_10px_#10b981]"></div>
              </div>
            ))}
          </div>

          {/* Plots */}
          {plotlines.map(plotline => (
            <div key={plotline.id} className="flex mb-4 group/row">
              <div className={`w-56 sticky left-0 z-10 p-5 shrink-0 flex flex-col justify-center border-l-4 rounded-l-2xl ${plotline.color} border-white/5 backdrop-blur-xl shadow-2xl`}>
                  <span className="text-xs font-bold uppercase tracking-widest">{plotline.label}</span>
                  <button className="mt-3 text-[10px] opacity-30 hover:opacity-100 flex items-center gap-2 transition-all uppercase"><Plus size={10} /> Add Beat</button>
              </div>
              {data.outline.map(act => (
                <div 
                  key={`${plotline.id}-${act.id}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!draggedEventId) return;
                    update({ plotEvents: data.plotEvents.map(evt => evt.id === draggedEventId ? { ...evt, actId: act.id, plotline: plotline.id } : evt) });
                  }}
                  className="w-80 shrink-0 mx-3 bg-white/[0.02] border border-dashed border-white/5 rounded-2xl p-4 min-h-[180px] flex flex-col gap-2 transition-all group-hover/row:bg-white/[0.04] hover:border-accent-500/20"
                >
                  {data.plotEvents
                    .filter(e => e.actId === act.id && (e.plotline || 'main') === plotline.id)
                    .map(event => renderEventCard(event))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
