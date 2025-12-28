
import React, { useState } from 'react';
import { ProjectData, NovelChapter, ScriptBlock, ScriptBlockType, AppLanguage, Character, PlotEvent } from '../../types';
import { GeminiService } from '../../services/geminiService';
import { 
  Plus, 
  Trash2, 
  Wand2, 
  ArrowRight, 
  BookText, 
  Users, 
  Clapperboard,
  Workflow,
  Zap,
  GitMerge,
  ChevronRight,
  RefreshCw,
  Activity,
  Flame
} from 'lucide-react';
import { getTranslation } from '../../utils/translations';

interface NovelAdaptationProps {
  data: ProjectData;
  update: (data: Partial<ProjectData>, saveHistory?: boolean) => void;
  language: AppLanguage;
}

type TabType = 'edit' | 'analysis' | 'structure_view';
type MetaView = 'script' | 'characters' | 'storylines' | 'events';

export const NovelAdaptationModule: React.FC<NovelAdaptationProps> = ({ data, update, language }) => {
  const t = getTranslation(language);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(
    data.novelChapters.length > 0 ? data.novelChapters[0].id : null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('edit');
  const [metaView, setMetaView] = useState<MetaView>('script');

  const activeChapter = data.novelChapters.find(c => c.id === activeChapterId);

  const addChapter = () => {
    const newChapter: NovelChapter = {
      id: crypto.randomUUID(),
      title: `新章节 ${data.novelChapters.length + 1}`,
      content: '',
      convertedBlocks: []
    };
    update({ novelChapters: [...data.novelChapters, newChapter] });
    setActiveChapterId(newChapter.id);
  };

  const updateChapter = (id: string, updates: Partial<NovelChapter>) => {
    const updatedChapters = data.novelChapters.map(c => 
      c.id === id ? { ...c, ...updates } : c
    );
    update({ novelChapters: updatedChapters });
  };

  const handleFullAnalysis = async () => {
    if (!activeChapter || !activeChapter.content.trim()) return;
    setIsAnalyzing(true);
    try {
      const [scriptBlocks, analysisResult] = await Promise.all([
        GeminiService.adaptNovelToScript(activeChapter.content, language),
        GeminiService.analyzeNovelText(activeChapter.content, language)
      ]);
      
      updateChapter(activeChapter.id, { 
        convertedBlocks: scriptBlocks,
        analysis: analysisResult 
      });
      setMetaView('events'); // Default to events for adaptation focus
    } catch (e) {
      alert("分析失败，请稍后重试。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const syncCharactersToProject = () => {
    if (!activeChapter?.analysis?.characters) return;
    const newChars: Character[] = activeChapter.analysis.characters.map(ac => ({
      id: crypto.randomUUID(),
      name: ac.name,
      role: ac.role,
      age: '未知',
      description: ac.trait,
      goal: '',
      conflict: '',
      arc: '',
      mapPosition: { x: Math.random() * 500, y: Math.random() * 500 }
    }));
    update({ characters: [...data.characters, ...newChars] });
    alert("人物已同步");
  };

  const syncEventsToProject = () => {
    if (!activeChapter?.analysis?.events) return;
    const newEvents: PlotEvent[] = activeChapter.analysis.events.map(ae => ({
      id: crypto.randomUUID(),
      title: ae.title,
      description: ae.description,
      tensionLevel: ae.tensionLevel || 5,
      plotline: 'main'
    }));
    update({ plotEvents: [...data.plotEvents, ...newEvents] });
    alert("事件编排已同步至主工作流");
  };

  const renderMetaPanel = () => {
    if (!activeChapter) return null;

    switch (metaView) {
      case 'characters':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-bold text-accent-400 uppercase tracking-widest flex items-center gap-2">
                <Users size={14}/> Extracted Personas
              </h4>
              <button 
                onClick={syncCharactersToProject}
                className="text-[9px] bg-accent-500/10 text-accent-400 border border-accent-500/30 px-2 py-1 rounded hover:bg-accent-500 hover:text-white transition-all uppercase font-bold"
              >
                同步人物
              </button>
            </div>
            
            {activeChapter.analysis?.characters ? (
              <div className="space-y-3">
                {activeChapter.analysis.characters.map((char: any, idx: number) => (
                  <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-accent-500/30 transition-all group">
                    <input 
                      value={char.name} 
                      onChange={(e) => {
                        const newChars = [...activeChapter.analysis!.characters];
                        newChars[idx].name = e.target.value;
                        updateChapter(activeChapter.id, { analysis: { ...activeChapter.analysis!, characters: newChars } });
                      }}
                      className="bg-transparent text-sm font-bold text-ink-100 mb-1 outline-none w-full focus:text-accent-400" 
                    />
                    <textarea 
                      value={char.trait}
                      onChange={(e) => {
                        const newChars = [...activeChapter.analysis!.characters];
                        newChars[idx].trait = e.target.value;
                        updateChapter(activeChapter.id, { analysis: { ...activeChapter.analysis!, characters: newChars } });
                      }}
                      className="w-full bg-transparent text-[10px] text-ink-500 leading-relaxed outline-none resize-none h-12"
                    />
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-12 opacity-20 text-[10px] uppercase font-mono tracking-widest">No data</div>}
          </div>
        );

      case 'events':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-bold text-orange-400 uppercase tracking-widest flex items-center gap-2">
                <Flame size={14}/> Extracted Events
              </h4>
              <button 
                onClick={syncEventsToProject}
                className="text-[9px] bg-orange-500/10 text-orange-400 border border-orange-500/30 px-2 py-1 rounded hover:bg-orange-500 hover:text-white transition-all uppercase font-bold"
              >
                同步事件
              </button>
            </div>

            {activeChapter.analysis?.events ? (
              <div className="space-y-3">
                {activeChapter.analysis.events.map((event: any, idx: number) => (
                  <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-orange-500/30 transition-all group relative">
                    <div className="flex justify-between items-start mb-2">
                      <input 
                        value={event.title}
                        onChange={(e) => {
                          const newEvents = [...activeChapter.analysis!.events];
                          newEvents[idx].title = e.target.value;
                          updateChapter(activeChapter.id, { analysis: { ...activeChapter.analysis!, events: newEvents } });
                        }}
                        className="bg-transparent text-sm font-bold text-ink-100 outline-none w-full mr-2 focus:text-orange-400"
                      />
                      <button 
                        onClick={() => {
                          const newEvents = activeChapter.analysis!.events.filter((_: any, i: number) => i !== idx);
                          updateChapter(activeChapter.id, { analysis: { ...activeChapter.analysis!, events: newEvents } });
                        }}
                        className="opacity-0 group-hover:opacity-100 text-ink-600 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <textarea 
                      value={event.description}
                      onChange={(e) => {
                        const newEvents = [...activeChapter.analysis!.events];
                        newEvents[idx].description = e.target.value;
                        updateChapter(activeChapter.id, { analysis: { ...activeChapter.analysis!, events: newEvents } });
                      }}
                      className="w-full bg-transparent text-[10px] text-ink-400 leading-relaxed outline-none resize-none h-12 mb-2"
                    />
                    <div className="flex items-center gap-2">
                      <Flame size={10} className="text-orange-500" />
                      <input 
                        type="range" min="1" max="10" 
                        value={event.tensionLevel || 5} 
                        onChange={(e) => {
                          const newEvents = [...activeChapter.analysis!.events];
                          newEvents[idx].tensionLevel = parseInt(e.target.value);
                          updateChapter(activeChapter.id, { analysis: { ...activeChapter.analysis!, events: newEvents } });
                        }}
                        className="flex-1 h-1 bg-ink-800 rounded-full appearance-none cursor-pointer accent-orange-500" 
                      />
                      <span className="text-[8px] font-mono text-ink-600">{event.tensionLevel || 5}/10</span>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => {
                    const newEvents = [...(activeChapter.analysis?.events || []), { title: '新事件', description: '', tensionLevel: 5 }];
                    updateChapter(activeChapter.id, { analysis: { ...activeChapter.analysis!, events: newEvents } });
                  }}
                  className="w-full py-3 border border-dashed border-white/5 rounded-2xl text-[10px] font-bold text-ink-700 hover:text-orange-500 hover:border-orange-500/30 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> Add Event Beat
                </button>
              </div>
            ) : <div className="text-center py-12 opacity-20 text-[10px] font-mono uppercase">Extracting...</div>}
          </div>
        );

      case 'storylines':
        return (
          <div className="space-y-6 animate-fadeIn">
            <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
              <GitMerge size={14}/> Plot Threads
            </h4>
            {activeChapter.analysis?.storylines ? (
              <div className="space-y-3">
                {activeChapter.analysis.storylines.map((line: string, idx: number) => (
                  <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-purple-500/30 transition-all">
                    <textarea 
                      value={line}
                      onChange={(e) => {
                        const newLines = [...activeChapter.analysis!.storylines];
                        newLines[idx] = e.target.value;
                        updateChapter(activeChapter.id, { analysis: { ...activeChapter.analysis!, storylines: newLines } });
                      }}
                      className="w-full bg-transparent text-xs text-ink-300 leading-relaxed outline-none resize-none h-20"
                    />
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-12 opacity-20 text-[10px] font-mono uppercase">No lines</div>}
          </div>
        );

      default: // script blocks
        return (
          <div className="space-y-4 animate-fadeIn">
            <h4 className="text-[10px] font-bold text-ink-500 uppercase tracking-widest flex items-center gap-2">
              <Clapperboard size={14}/> Adaptation Matrix Nodes
            </h4>
            {activeChapter.convertedBlocks.length > 0 ? (
              <div className="space-y-3">
                {activeChapter.convertedBlocks.map((b, i) => (
                  <div key={i} className={`p-4 rounded-2xl border border-white/5 text-xs ${b.type === ScriptBlockType.SCENE_HEADING ? 'bg-accent-500/10 text-accent-400 font-bold border-accent-500/20' : 'text-ink-400'}`}>
                     <div className="text-[8px] opacity-50 mb-1">{b.type}</div>
                     {b.content}
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-12 opacity-20 text-[10px] font-mono uppercase">Pending...</div>}
          </div>
        );
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-ink-950">
      {/* Left Sidebar */}
      <div className="w-64 bg-ink-900 border-r border-white/5 flex flex-col shrink-0">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-bold text-ink-100 flex items-center gap-2 uppercase tracking-tighter text-sm">
            <BookText size={18} className="text-accent-400" /> 原著库
          </h2>
          <button onClick={addChapter} className="p-1.5 hover:bg-white/5 rounded-lg text-accent-400 transition-colors bg-accent-500/10">
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {data.novelChapters.map(chapter => (
            <button 
              key={chapter.id}
              onClick={() => setActiveChapterId(chapter.id)}
              className={`w-full p-4 rounded-2xl text-left transition-all group relative overflow-hidden
                ${activeChapterId === chapter.id 
                  ? 'bg-accent-500/10 border border-accent-500/30 shadow-lg' 
                  : 'hover:bg-white/5 text-ink-500 border border-transparent'}`}
            >
              <div className={`font-bold truncate text-sm ${activeChapterId === chapter.id ? 'text-accent-400' : ''}`}>
                {chapter.title}
              </div>
              {activeChapterId === chapter.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-500 shadow-[0_0_10px_#10b981]"></div>}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {activeChapter ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-ink-950 transition-colors duration-500">
          <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-ink-900/30 backdrop-blur-md shrink-0 z-10">
             <div className="flex gap-8">
                <button 
                  onClick={() => setActiveTab('edit')} 
                  className={`text-sm font-bold pb-4 mt-4 transition-all relative
                    ${activeTab === 'edit' ? 'text-accent-400' : 'text-ink-600 hover:text-ink-400'}`}
                >
                  章节处理
                  {activeTab === 'edit' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-500 shadow-[0_0_10px_#10b981]"></div>}
                </button>
                <button 
                  onClick={() => setActiveTab('structure_view')} 
                  className={`text-sm font-bold pb-4 mt-4 transition-all relative
                    ${activeTab === 'structure_view' ? 'text-accent-400' : 'text-ink-600 hover:text-ink-400'}`}
                >
                  结构映射图
                  {activeTab === 'structure_view' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-500 shadow-[0_0_10px_#10b981]"></div>}
                </button>
             </div>
             
             {activeTab === 'edit' && (
               <button 
                  onClick={handleFullAnalysis} 
                  disabled={isAnalyzing || !activeChapter.content}
                  className="flex items-center gap-2 px-6 py-2 bg-accent-500 text-white rounded-xl text-xs font-bold hover:bg-accent-600 transition-all disabled:opacity-50 shadow-lg"
                >
                  {isAnalyzing ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />}
                  启动 AI 全维度分析
                </button>
             )}
          </div>

          <div className="flex-1 overflow-hidden">
             {activeTab === 'edit' ? (
               <div className="flex h-full p-8 gap-8">
                  <div className="flex-1 glass-card rounded-[40px] p-8 flex flex-col border-white/5 overflow-hidden shadow-2xl relative">
                     <div className="scan-line opacity-5"></div>
                     <textarea 
                        value={activeChapter.content} 
                        onChange={(e) => updateChapter(activeChapter.id, { content: e.target.value })}
                        className="flex-1 bg-transparent resize-none text-ink-100 leading-relaxed outline-none font-serif text-lg placeholder-ink-800"
                        placeholder="粘贴原著文本..."
                     />
                  </div>

                  <div className="w-[380px] flex flex-col gap-4">
                     <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                        <button onClick={() => setMetaView('script')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2 ${metaView === 'script' ? 'bg-accent-500 text-white' : 'text-ink-500'}`}><Clapperboard size={14}/> 剧本</button>
                        <button onClick={() => setMetaView('events')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2 ${metaView === 'events' ? 'bg-accent-500 text-white' : 'text-ink-500'}`}><Flame size={14}/> 事件</button>
                        <button onClick={() => setMetaView('characters')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2 ${metaView === 'characters' ? 'bg-accent-500 text-white' : 'text-ink-500'}`}><Users size={14}/> 人物</button>
                        <button onClick={() => setMetaView('storylines')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2 ${metaView === 'storylines' ? 'bg-accent-500 text-white' : 'text-ink-500'}`}><GitMerge size={14}/> 故事线</button>
                     </div>

                     <div className="flex-1 glass-card rounded-[40px] p-6 border-white/5 overflow-y-auto scrollbar-hide shadow-xl">
                        {renderMetaPanel()}
                     </div>

                     <button 
                        onClick={() => {
                           if (!activeChapter.convertedBlocks.length) return;
                           update({ script: [...data.script, ...activeChapter.convertedBlocks.map(b => ({ ...b, id: crypto.randomUUID() }))] });
                           alert("注入成功");
                        }}
                        className="w-full bg-white text-ink-950 py-4 rounded-[32px] font-bold text-xs uppercase tracking-widest hover:bg-accent-500 hover:text-white transition-all shadow-xl disabled:opacity-20"
                        disabled={!activeChapter.convertedBlocks.length}
                     >
                        注入剧本时间轴
                     </button>
                  </div>
               </div>
             ) : (
               <div className="h-full flex flex-col p-8 overflow-y-auto">
                  <div className="mb-8 flex items-center gap-4">
                     <Workflow className="text-accent-400" size={32} />
                     <h3 className="text-2xl font-serif font-bold text-ink-100">神经网络映射流</h3>
                  </div>
                  <div className="space-y-12 max-w-2xl mx-auto pb-24">
                     {(activeChapter.analysis?.events || []).map((event: any, i: number) => (
                        <div key={i} className="flex gap-8 items-start group">
                           <div className="flex flex-col items-center">
                              <div className="w-12 h-12 rounded-full bg-ink-900 border border-orange-500/50 flex items-center justify-center font-mono font-bold text-orange-400 text-lg shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                                 {i + 1}
                              </div>
                              <div className="w-px h-24 bg-gradient-to-b from-orange-500/50 to-transparent"></div>
                           </div>
                           <div className="flex-1 bg-white/5 border border-white/5 p-6 rounded-[32px] hover:border-orange-500/30 transition-all shadow-xl">
                              <div className="text-[9px] font-bold text-orange-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Activity size={12} /> Beat Momentum
                              </div>
                              <h4 className="text-lg font-bold text-ink-100 mb-2">{event.title}</h4>
                              <p className="text-xs text-ink-500 mb-4">{event.description}</p>
                              <div className="h-1 bg-ink-800 rounded-full overflow-hidden">
                                 <div className="h-full bg-orange-500 shadow-[0_0_8px_orange]" style={{ width: `${(event.tensionLevel || 5) * 10}%` }}></div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
             )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-ink-800">
           <Workflow size={80} className="opacity-10 animate-pulse" />
        </div>
      )}
    </div>
  );
};
