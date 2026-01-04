
import React, { useState, useEffect } from 'react';
import { ProjectData, PlotEvent, AppLanguage, Character, CharacterRelationship, ScriptBlock, ScriptBlockType, PlotlineDefinition } from '../../types';
import { GeminiService } from '../../services/geminiService';
import { 
  Plus, 
  Wand2, 
  GripHorizontal, 
  GitBranch, 
  Zap, 
  Network, 
  LayoutGrid, 
  Trash2, 
  RefreshCcw, 
  Info,
  Flame,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Loader2,
  Heart,
  X
} from 'lucide-react';
import { getTranslation } from '../../utils/translations';

interface PlotProps {
  data: ProjectData;
  update: (data: Partial<ProjectData>) => void;
  language: AppLanguage;
}

type PlotView = 'matrix' | 'relationships';

const DEFAULT_PLOTLINES: PlotlineDefinition[] = [
    { id: 'main', label: '主线剧情 (Main)', color: 'border-accent-500 text-accent-400 bg-accent-500/5', isRemovable: false },
    { id: 'subA', label: '角色冲突 (Conflict)', color: 'border-purple-500 text-purple-400 bg-purple-500/5', isRemovable: false },
    { id: 'subB', label: '背景伏笔 (Secrets)', color: 'border-amber-500 text-amber-400 bg-amber-500/5', isRemovable: false },
    { id: 'arc', label: '人物弧光 (Growth)', color: 'border-blue-500 text-blue-400 bg-blue-500/5', isRemovable: false }
];

const RANDOM_COLORS = [
    'border-pink-500 text-pink-400 bg-pink-500/5',
    'border-teal-500 text-teal-400 bg-teal-500/5',
    'border-indigo-500 text-indigo-400 bg-indigo-500/5',
    'border-rose-500 text-rose-400 bg-rose-500/5',
];

export const PlotModule: React.FC<PlotProps> = ({ data, update, language }) => {
  const t = getTranslation(language);
  const [activeView, setActiveView] = useState<PlotView>('matrix');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInferringRel, setIsInferringRel] = useState(false);
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);

  // Initialize plotlines if they don't exist
  useEffect(() => {
      if (!data.definedPlotlines || data.definedPlotlines.length === 0) {
          update({ definedPlotlines: DEFAULT_PLOTLINES });
      }
  }, []);

  const plotlines = data.definedPlotlines || DEFAULT_PLOTLINES;

  const handleAiInferRelationships = async () => {
    if (data.plotEvents.length === 0 || data.characters.length === 0) {
      alert("请先添加剧情事件和人物。");
      return;
    }
    setIsInferringRel(true);
    try {
      const inferred = await GeminiService.inferCharacterRelationships(data.characters, data.plotEvents, language);
      if (inferred.length > 0) {
        update({ relationships: [...data.relationships, ...inferred] });
        alert(`AI 成功推理出 ${inferred.length} 条新关系。`);
      }
    } catch (e) {
      alert("关系推理失败");
    } finally {
      setIsInferringRel(false);
    }
  };

  const handleAddEvent = (plotlineId: string, actId?: string) => {
    // BUG FIX: If actId is undefined (clicking the row header button), default to the first available Act/Episode.
    const targetActId = actId || (data.outline.length > 0 ? data.outline[0].id : null);
    
    if (!targetActId) {
        alert("请先在「故事大纲」板块中生成或添加至少一集/一幕，以便为事件分配时间点。");
        return;
    }

    const newEvent: PlotEvent = {
        id: crypto.randomUUID(),
        actId: targetActId,
        title: '新事件节点',
        description: '',
        tension: 5,
        plotline: plotlineId,
        emotions: ''
    };
    update({ plotEvents: [...data.plotEvents, newEvent] });
  };

  const handleAddPlotline = () => {
      const randomColor = RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];
      const newPlotline: PlotlineDefinition = {
          id: crypto.randomUUID(),
          label: '新支线剧情',
          color: randomColor,
          isRemovable: true
      };
      update({ definedPlotlines: [...plotlines, newPlotline] });
  };

  const handleDeletePlotline = (id: string) => {
      if (!confirm("确定删除此支线吗？该支线下的所有事件将被移除。")) return;
      
      const newPlotlines = plotlines.filter(p => p.id !== id);
      const newEvents = data.plotEvents.filter(e => e.plotline !== id);
      
      update({ 
          definedPlotlines: newPlotlines,
          plotEvents: newEvents
      });
  };

  const updateCharacter = (id: string, updates: Partial<Character>) => {
    update({ characters: data.characters.map(c => c.id === id ? { ...c, ...updates } : c) });
  };

  const RelationshipGraph = () => {
    return (
      <div className="relative w-full h-[calc(100vh-16rem)] bg-ink-950 overflow-hidden rounded-[40px] border border-white/5 shadow-2xl group/graph">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="rgba(16, 185, 129, 0.4)" />
            </marker>
          </defs>
          {data.relationships.map(rel => {
            const source = data.characters.find(c => c.id === rel.sourceId);
            const target = data.characters.find(c => c.id === rel.targetId);
            if (!source || !target) return null;
            return (
              <g key={rel.id} className="animate-fadeIn">
                <line 
                  x1={source.mapPosition.x} y1={source.mapPosition.y} 
                  x2={target.mapPosition.x} y2={target.mapPosition.y} 
                  stroke="rgba(16, 185, 129, 0.3)" 
                  strokeWidth="2" 
                  strokeDasharray="5,5"
                  className="transition-all"
                />
                <circle cx={(source.mapPosition.x + target.mapPosition.x)/2} cy={(source.mapPosition.y + target.mapPosition.y)/2} r="14" fill="#020617" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1" />
                <text 
                  x={(source.mapPosition.x + target.mapPosition.x)/2} 
                  y={(source.mapPosition.y + target.mapPosition.y)/2 + 4}
                  fill="#10b981" fontSize="9" className="font-bold select-none uppercase tracking-tighter" textAnchor="middle"
                >
                  {rel.label}
                </text>
              </g>
            );
          })}
        </svg>
        {data.characters.map(char => (
          <div 
            key={char.id}
            className={`absolute w-32 h-32 rounded-full glass-card flex flex-col items-center justify-center p-4 cursor-move transition-all border-2 group/node
              ${selectedCharId === char.id ? 'border-accent-500 scale-110 shadow-accent-500/20 z-10' : 'border-white/10 hover:border-white/30 z-0'}`}
            style={{ left: char.mapPosition.x - 64, top: char.mapPosition.y - 64 }}
            onClick={() => setSelectedCharId(char.id)}
            onMouseDown={(e) => {
              if (e.button !== 0) return;
              const startX = e.clientX;
              const startY = e.clientY;
              const initialPos = { ...char.mapPosition };
              const onMouseMove = (moveE: MouseEvent) => {
                updateCharacter(char.id, { mapPosition: { x: initialPos.x + (moveE.clientX - startX), y: initialPos.y + (moveE.clientY - startY) } });
              };
              const onMouseUp = () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
              window.addEventListener('mousemove', onMouseMove);
              window.addEventListener('mouseup', onMouseUp);
            }}
          >
            <div className="w-12 h-12 bg-white/5 rounded-full mb-2 flex items-center justify-center text-accent-500 font-bold border border-accent-500/10 shadow-inner group-hover/node:bg-accent-500 group-hover/node:text-white transition-all">
              {char.name[0]}
            </div>
            <div className="text-[10px] font-black text-ink-100 uppercase tracking-tighter truncate w-full text-center">{char.name}</div>
            <div className="text-[8px] text-ink-500 uppercase font-mono">{char.role}</div>
            
            {selectedCharId === char.id && (
              <div className="absolute -top-4 -right-4 flex gap-2 animate-fadeIn">
                 <button 
                  onClick={(e) => { e.stopPropagation(); update({ characters: data.characters.filter(c => c.id !== char.id) }); }}
                  className="bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-all"
                 >
                   <Trash2 size={12} />
                 </button>
              </div>
            )}
          </div>
        ))}
        
        <div className="absolute bottom-10 left-10 flex items-center gap-6 bg-ink-900/80 backdrop-blur-xl px-10 py-4 rounded-full border border-white/5 shadow-2xl">
           <div className="flex items-center gap-3">
             <button 
                onClick={handleAiInferRelationships} 
                disabled={isInferringRel}
                className="flex items-center gap-2 px-6 py-2 bg-accent-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-accent-400 transition-all disabled:opacity-50"
             >
               {isInferringRel ? <Loader2 size={14} className="animate-spin" /> : <BrainCircuit size={14} />}
               {isInferringRel ? '正在神经推理...' : 'AI 关系自动推理'}
             </button>
           </div>
           <div className="w-px h-4 bg-white/10"></div>
           <span className="text-[10px] text-ink-500 uppercase font-black tracking-widest">拖拽头像调整布局 • 点击连线编辑关系</span>
        </div>
      </div>
    );
  };

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
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
               <GripHorizontal size={14} className="text-ink-700 group-hover:text-accent-500 transition-colors" />
               <input 
                 value={event.title} 
                 onChange={(e) => update({ plotEvents: data.plotEvents.map(ev => ev.id === event.id ? { ...ev, title: e.target.value } : ev) })} 
                 className="font-bold text-ink-100 text-xs w-full bg-transparent outline-none focus:text-accent-400 truncate placeholder:text-ink-600"
                 placeholder="事件标题" 
               />
            </div>
            <button 
                onClick={() => update({ plotEvents: data.plotEvents.filter(e => e.id !== event.id) })} 
                className="text-ink-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Trash2 size={12} />
            </button>
          </div>

          <textarea 
             value={event.description} 
             onChange={(e) => update({ plotEvents: data.plotEvents.map(ev => ev.id === event.id ? { ...ev, description: e.target.value } : ev) })}
             className="w-full bg-transparent text-[10px] text-ink-300 outline-none resize-none h-10 mb-2 placeholder:text-ink-700"
             placeholder="事件详情..."
          />

          {/* New Emotion Field */}
          <div className="flex items-center gap-2 bg-ink-950/30 rounded-lg p-1.5 mb-2 border border-white/5">
             <Heart size={10} className="text-pink-500 shrink-0" />
             <input 
                value={event.emotions || ''}
                onChange={(e) => update({ plotEvents: data.plotEvents.map(ev => ev.id === event.id ? { ...ev, emotions: e.target.value } : ev) })}
                className="bg-transparent text-[9px] text-pink-200 w-full outline-none placeholder:text-ink-700"
                placeholder="人物情绪 (用于生成对话)"
             />
          </div>

          <div className="flex items-center gap-2 mt-2">
             <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden group/bar relative">
                <input 
                    type="range" 
                    min="1" max="10" 
                    value={event.tension} 
                    onChange={(e) => update({ plotEvents: data.plotEvents.map(ev => ev.id === event.id ? { ...ev, tension: parseInt(e.target.value) } : ev) })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
               <div className={`h-full bg-accent-500 shadow-[0_0_8px_#10b981] transition-all`} style={{ width: `${event.tension * 10}%` }}></div>
             </div>
             <span className="text-[9px] font-mono font-bold text-accent-500">{event.tension}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-ink-950">
      <div className="h-16 border-b border-white/5 px-8 flex items-center justify-between bg-ink-900/30 backdrop-blur-md z-20 transition-all">
        <div className="flex items-center gap-6">
          <h2 className="text-xl font-serif font-bold text-ink-100 flex items-center gap-3">
             <GitBranch className="text-accent-400" /> {t.plot.title}
          </h2>
          
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
             <button 
              onClick={() => setActiveView('matrix')}
              className={`flex items-center gap-2 px-5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                ${activeView === 'matrix' ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/20' : 'text-ink-500 hover:text-ink-100'}`}
             >
               <LayoutGrid size={14} /> 事件矩阵
             </button>
             <button 
              onClick={() => setActiveView('relationships')}
              className={`flex items-center gap-2 px-5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                ${activeView === 'relationships' ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/20' : 'text-ink-500 hover:text-ink-100'}`}
             >
               <Network size={14} /> 人物关系图
             </button>
          </div>
        </div>

        <div className="flex gap-4">
          {activeView === 'matrix' ? (
            <>
              <button onClick={handleAddPlotline} className="flex items-center gap-2 px-5 py-2 bg-white/5 border border-white/10 text-ink-300 rounded-xl hover:bg-white/10 transition-all font-bold text-xs">
                <Plus size={14} /> 新增支线
              </button>
              <button onClick={() => setIsGenerating(true)} className="flex items-center gap-2 px-5 py-2 bg-accent-500 text-white rounded-xl hover:bg-accent-400 transition-all font-bold text-xs shadow-lg shadow-accent-950/20">
                <Zap size={14} className={isGenerating ? "animate-spin" : ""} /> {t.plot.aiGenEvents}
              </button>
            </>
          ) : (
            <button 
              onClick={() => setSelectedCharId(null)}
              className="flex items-center gap-2 px-5 py-2 bg-white/5 border border-white/10 text-ink-300 rounded-xl hover:bg-white/10 transition-all font-bold text-xs"
            >
              重置图表
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-transparent p-8">
        {activeView === 'relationships' ? (
          <div className="h-full animate-fadeIn">
             <RelationshipGraph />
             <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {data.relationships.map(rel => {
                   const s = data.characters.find(c => c.id === rel.sourceId);
                   const t = data.characters.find(c => c.id === rel.targetId);
                   return (
                     <div key={rel.id} className="glass-card p-6 rounded-[32px] border-white/5 group hover:border-accent-500/30 transition-all">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-accent-500 uppercase tracking-widest">{s?.name}</span>
                              <ChevronRight size={10} className="text-ink-700" />
                              <span className="text-[10px] font-bold text-ink-100 uppercase tracking-widest">{t?.name}</span>
                           </div>
                           <button onClick={() => update({ relationships: data.relationships.filter(r => r.id !== rel.id) })} className="opacity-0 group-hover:opacity-100 text-red-500 hover:scale-110 transition-all"><Trash2 size={14}/></button>
                        </div>
                        <input 
                          value={rel.label} 
                          onChange={(e) => update({ relationships: data.relationships.map(r => r.id === rel.id ? { ...r, label: e.target.value } : r) })}
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs text-ink-100 outline-none focus:border-accent-500/50"
                          placeholder="描述关系..."
                        />
                     </div>
                   );
                })}
             </div>
          </div>
        ) : (
          <div className="inline-flex flex-col min-w-full animate-fadeIn">
            <div className="flex mb-6">
              <div className="w-56 sticky left-0 z-10 bg-ink-950 p-4 shrink-0 flex items-center font-mono font-bold text-[10px] uppercase text-ink-600 tracking-[0.3em] border-r border-white/5">
                  矩阵轴 / 根目录
              </div>
              {data.outline.length === 0 && (
                  <div className="p-6 text-ink-500 text-xs flex items-center gap-2">
                      <Info size={14}/> 请先在「故事大纲」中生成或添加分集。
                  </div>
              )}
              {data.outline.map((act, idx) => (
                <div key={act.id} className="w-80 shrink-0 p-6 bg-white/5 border border-white/10 text-white flex flex-col items-center justify-center gap-1 mx-3 rounded-2xl shadow-xl relative group hover:border-accent-500/30 transition-all">
                    <span className="text-[10px] font-mono font-black text-accent-500 uppercase tracking-widest">第 0{idx + 1} 集/幕</span>
                    <span className="text-sm font-bold truncate w-full text-center uppercase">{act.title}</span>
                    <div className="absolute -bottom-px left-8 right-8 h-px bg-accent-500 shadow-[0_0_10px_#10b981]"></div>
                </div>
              ))}
            </div>

            {plotlines.map(plotline => (
              <div key={plotline.id} className="flex mb-4 group/row">
                <div className={`w-56 sticky left-0 z-10 p-5 shrink-0 flex flex-col justify-center border-l-4 rounded-l-2xl ${plotline.color} border-white/5 backdrop-blur-xl shadow-2xl relative group/header`}>
                    <div className="flex justify-between items-start">
                        <input 
                            value={plotline.label} 
                            onChange={(e) => update({ definedPlotlines: plotlines.map(p => p.id === plotline.id ? { ...p, label: e.target.value } : p) })}
                            className="text-xs font-bold uppercase tracking-widest bg-transparent outline-none w-full"
                        />
                        {plotline.isRemovable && (
                            <button onClick={() => handleDeletePlotline(plotline.id)} className="text-ink-600 hover:text-red-500 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                <X size={12} />
                            </button>
                        )}
                    </div>
                    <button 
                        onClick={() => handleAddEvent(plotline.id)}
                        className="mt-3 text-[10px] opacity-30 hover:opacity-100 flex items-center gap-2 transition-all uppercase cursor-pointer"
                    >
                        <Plus size={10} /> 添加节拍
                    </button>
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
                    
                    <button 
                        onClick={() => handleAddEvent(plotline.id, act.id)}
                        className="w-full py-2 flex items-center justify-center opacity-0 group-hover/row:opacity-50 hover:!opacity-100 transition-opacity text-ink-600 hover:text-accent-500"
                    >
                        <Plus size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
