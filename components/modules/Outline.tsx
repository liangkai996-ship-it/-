
import React, { useState } from 'react';
import { ProjectData, OutlineScene, AppLanguage, ScriptFormat, OutlineSection, Character, PlotEvent, ScriptBlockType, ScriptBlock } from '../../types';
import { GeminiService } from '../../services/geminiService';
import { 
  Lightbulb, RefreshCw, Wand2, Plus, Trash2, 
  List, Columns, BookOpen, Layers, Tag, 
  ChevronDown, ChevronUp, Sparkles, AlertCircle,
  Activity, Zap, FileText, Loader2, UserPlus,
  Flame, Target, ArrowRightCircle, LayoutTemplate, Users, UserCheck, GripHorizontal, Heart,
  Clapperboard, Monitor, Film
} from 'lucide-react';

interface OutlineProps {
  data: ProjectData;
  update: (data: Partial<ProjectData>) => void;
  language: AppLanguage;
}

export const OutlineModule: React.FC<OutlineProps> = ({ data, update, language }) => {
  const [expandingTotal, setExpandingTotal] = useState(false);
  const [generatingTotal, setGeneratingTotal] = useState(false);
  
  // Phase 1: Characters Extraction
  const [extractingChars, setExtractingChars] = useState(false);
  
  // Phase 2: Episode Generation (Batching)
  const [generatingBreakdown, setGeneratingBreakdown] = useState(false);
  const [breakdownProgress, setBreakdownProgress] = useState(0); // 0-100
  const [breakdownStatus, setBreakdownStatus] = useState("");

  const [generatingScriptId, setGeneratingScriptId] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<{ current: number, total: number, step: string } | null>(null);
  const [targetCount, setTargetCount] = useState<number>(data.scriptFormat === ScriptFormat.LIVE_ACTION_SHORT ? 80 : 30);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // 辅助错误处理函数
  const handleApiError = (e: any, action: string) => {
    console.error(e);
    const msg = e.toString();
    if (msg.includes('429') || msg.includes('Quota') || msg.includes('Resource Exhausted')) {
      alert(`⚠️ ${action}失败：API 配额已耗尽 (429 Error)。\n\n原因：Google 免费版 API 有每分钟请求限制。\n建议：\n1. 请休息几分钟再试\n2. 或更换为 Pay-as-you-go 的 API Key`);
    } else {
      alert(`⚠️ ${action}遇到问题：${msg}\n请检查网络连接或 API Key 设置。`);
    }
  };

  // 自动提取人物逻辑
  const autoExtractCharacters = async (outlineText: string) => {
    if (!outlineText) return;
    setExtractingChars(true);
    try {
      const result = await GeminiService.extractCharactersFromOutline(outlineText, language);
      
      const newChars: Character[] = (result.characters || []).map((c: any) => ({
        id: crypto.randomUUID(),
        name: c.name,
        role: c.role || "主要角色",
        importance: 5,
        description: c.description,
        age: c.age || "未知",
        origins: c.origins || { family: '', genes: '', background: '' },
        stages: c.stages || { setup: '', struggle: '', resolution: '' },
        mapPosition: { x: Math.random() * 600, y: Math.random() * 400 }
      }));

      const newRels = (result.relationships || []).map((r: any) => {
         const s = newChars.find(c => c.name === r.source);
         const t = newChars.find(c => c.name === r.target);
         return s && t ? { id: crypto.randomUUID(), sourceId: s.id, targetId: t.id, label: r.label, bidirectional: true } : null;
      }).filter((r:any) => r);

      // 更新 Project Data，自动同步人物
      update({ 
          totalOutline: outlineText, 
          characters: newChars, 
          relationships: newRels 
      });
      
      alert("✅ 故事总纲已生成。\n✅ 已自动完成 AI 人物深度侧写与关系图谱构建！");

    } catch (e) {
      console.error("Auto extraction failed", e);
      // 即使人物提取失败，也要保存大纲
      update({ totalOutline: outlineText });
    } finally {
      setExtractingChars(false);
    }
  };

  const handleExpandLoglineToOutline = async () => {
    if (!data.logline) { alert("请先输入一句话故事梗概。"); return; }
    setExpandingTotal(true);
    try {
        const result = await GeminiService.expandLoglineToOutline(data.logline, data.scriptFormat || ScriptFormat.SHORT_VIDEO, language);
        await autoExtractCharacters(result);
    } catch (e) {
        handleApiError(e, "扩写总纲");
        setExpandingTotal(false); 
    } finally { 
        setExpandingTotal(false); 
    }
  };

  const handleGenerateTotalOutline = async () => {
    setGeneratingTotal(true);
    try {
        const context = `标题: ${data.title}\n梗概: ${data.logline}\n类型: ${data.genre}`;
        const total = await GeminiService.generateTotalOutline(context, language, data.scriptFormat);
        await autoExtractCharacters(total);
    } catch (e) {
        handleApiError(e, "生成故事总纲");
        setGeneratingTotal(false);
    } finally { 
        setGeneratingTotal(false); 
    }
  };

  // 手动提取（如果自动失败或需要重试）
  const handleExtractCharacters = async () => {
    if (!data.totalOutline) { alert("请先生成左侧的故事总纲。"); return; }
    if (data.characters.length > 0 && !confirm("人物库中已有数据。重新提取将覆盖现有内容，是否继续？")) return;
    await autoExtractCharacters(data.totalOutline);
  };

  // 步骤 2：批量生成分集 (Batch Generation) - Strict Count
  const handleGenerateBreakdown = async () => {
    if (!data.totalOutline) { alert("请先生成左侧的故事总纲。"); return; }
    if (data.characters.length === 0) { 
        alert("请先点击【提取人物档案】并确认角色信息，再进行分集拆解。"); 
        return; 
    }
    // Only prompt if clearing, otherwise we append/fill
    const isContinuing = data.outline.length > 0 && data.outline.length < targetCount;
    if (data.outline.length > 0 && !isContinuing && !confirm("此操作将重置当前所有分集大纲，是否继续？")) return;
    
    setGeneratingBreakdown(true);
    setBreakdownProgress(0);
    setBreakdownStatus("启动分集引擎...");
    
    const BATCH_SIZE = 5; 
    // Start from next available episode or 1
    const startFrom = isContinuing ? data.outline.length + 1 : 1;
    let allEpisodes: OutlineSection[] = isContinuing ? [...data.outline] : [];
    let allEvents: PlotEvent[] = isContinuing ? [...data.plotEvents] : [];

    try {
        // 循环分批生成，直到达到 targetCount
        for (let i = startFrom; i <= targetCount; i += BATCH_SIZE) {
            const count = Math.min(BATCH_SIZE, targetCount - i + 1);
            if (count <= 0) break;

            setBreakdownStatus(`正在撰写第 ${i} - ${i + count - 1} 集 (共 ${targetCount} 集)...`);
            
            const batchEpisodesData = await GeminiService.generateEpisodeBatch(
                data.totalOutline,
                data.scriptFormat || ScriptFormat.LIVE_ACTION_SHORT,
                i,
                count,
                language,
                targetCount // Strict total param
            );

            if (batchEpisodesData && batchEpisodesData.length > 0) {
                const formattedBatch: OutlineSection[] = batchEpisodesData.map((ep: any) => {
                    const episodeId = crypto.randomUUID();
                    if (ep.events && Array.isArray(ep.events)) {
                        ep.events.forEach((evt: any) => {
                            let plotlineId = 'main';
                            // Map AI categories to plotline IDs
                            switch(evt.category) {
                                case 'conflict': plotlineId = 'subA'; break; // 角色冲突
                                case 'reveal': plotlineId = 'subB'; break;   // 背景伏笔
                                case 'arc': plotlineId = 'arc'; break;       // 人物弧光
                                default: plotlineId = 'main';
                            }

                            allEvents.push({
                                id: crypto.randomUUID(),
                                actId: episodeId,
                                title: evt.title,
                                description: evt.description,
                                tension: evt.tension || 5,
                                plotline: plotlineId, 
                                emotions: evt.emotions // Capture emotional beat directive for this event
                            });
                        });
                    }

                    return {
                        id: episodeId,
                        title: ep.title,
                        content: ep.content,
                        emotionalArc: ep.emotionalArc, // Store emotional analysis
                        visualKeywords: ep.visualKeywords,
                        scenes: [] 
                    };
                });
                
                allEpisodes = [...allEpisodes, ...formattedBatch];
                // Update state incrementally
                update({ outline: allEpisodes, plotEvents: allEvents });
            }

            setBreakdownProgress(Math.min(100, Math.round(((i + count - 1) / targetCount) * 100)));
            await new Promise(r => setTimeout(r, 1000)); 
        }
        
        update({ outline: allEpisodes, plotEvents: allEvents });
        setBreakdownStatus("分集矩阵与事件同步完成！");

    } catch (e) {
        handleApiError(e, "分集生成流程");
    } finally { 
        setGeneratingBreakdown(false); 
        setBreakdownProgress(0);
    }
  };

  const handleAddEvent = (actId: string) => {
    const newEvent: PlotEvent = {
        id: crypto.randomUUID(),
        actId: actId,
        title: '新事件',
        description: '描述事件内容...',
        tension: 5,
        plotline: 'main'
    };
    update({ plotEvents: [...data.plotEvents, newEvent] });
  };

  const handleDeleteEvent = (eventId: string) => {
      update({ plotEvents: data.plotEvents.filter(e => e.id !== eventId) });
  };

  const handleUpdateEvent = (eventId: string, field: keyof PlotEvent, value: any) => {
      update({ plotEvents: data.plotEvents.map(e => e.id === eventId ? { ...e, [field]: value } : e) });
  };

  const handleGenerateFullScript = async (section: OutlineSection) => {
    setGeneratingScriptId(section.id);
    setGenerationProgress({ current: 0, total: 1, step: '正在根据人物情绪生成正文...' });

    try {
      const scriptBlocks = await GeminiService.generateFullEpisodeScript(
        section, 
        data, 
        language
      );
      
      update({ script: [...data.script, ...scriptBlocks] });
      alert(`《${section.title}》正文已生成。`);

    } catch (e) {
      handleApiError(e, "剧本正文生成");
    } finally {
      setGeneratingScriptId(null);
      setGenerationProgress(null);
    }
  };

  const getSectionLabel = (index: number, format?: ScriptFormat) => {
     return `第 ${index + 1} 集`;
  };

  return (
    <div className="h-full flex flex-col bg-ink-950 text-ink-100 overflow-hidden">
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
         
         {/* 左侧面板：故事总纲 */}
         <div className="w-full xl:w-[450px] flex flex-col border-r border-ink-800 bg-ink-900/50 shrink-0">
             <div className="p-8 border-b border-ink-800">
                <div className="flex items-center justify-between mb-4">
                    <div className="text-accent-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={16} /> 核心梗概 (Logline)
                    </div>
                </div>
                <textarea 
                   value={data.logline}
                   onChange={(e) => update({ logline: e.target.value })}
                   className="w-full p-6 text-sm text-ink-100 bg-ink-950 border border-ink-800 rounded-[24px] focus:border-accent-500 outline-none transition-all resize-none h-28 font-serif leading-relaxed"
                   placeholder="一句话讲完故事..."
                />
                <button 
                  onClick={handleExpandLoglineToOutline} 
                  disabled={expandingTotal || !data.logline} 
                  className="w-full mt-6 flex items-center justify-center gap-2 bg-accent-500 text-white py-4 rounded-[16px] text-xs font-black uppercase tracking-widest hover:bg-accent-600 transition-all shadow-xl disabled:opacity-30"
                >
                   {expandingTotal ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                   {expandingTotal ? "世界观构建 & 人物分析中..." : "AI 智能扩写总纲 & 提取人物"}
                </button>
             </div>

             <div className="p-6 border-b border-ink-800 flex items-center justify-between">
                <div className="font-bold text-ink-200 text-xs flex items-center gap-2 uppercase tracking-widest">
                   <BookOpen size={16} className="text-accent-500" /> 深度故事总纲 (Master Outline)
                </div>
                <button onClick={handleGenerateTotalOutline} disabled={generatingTotal} className="text-[10px] text-accent-500 hover:text-ink-100 transition-all">
                   <RefreshCw size={12} className={generatingTotal ? "animate-spin" : ""} /> 重塑总纲
                </button>
             </div>
             
             <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-ink-950/30">
                 <textarea 
                    value={data.totalOutline || ''}
                    onChange={(e) => update({ totalOutline: e.target.value })}
                    className="w-full h-full min-h-[400px] bg-transparent outline-none text-ink-100 leading-loose text-base placeholder:text-ink-600 font-serif resize-none"
                    placeholder="在此编写或生成故事总纲..."
                 />
             </div>

             <div className="p-8 border-t border-ink-800 bg-ink-900/50">
                {/* 格式选择器 */}
                <div className="mb-4 bg-ink-950 border border-ink-800 rounded-2xl p-1 flex">
                    {[
                      { id: ScriptFormat.LIVE_ACTION_SHORT, label: '真人短剧', icon: Clapperboard },
                      { id: ScriptFormat.COMIC_DRAMA, label: '漫剧', icon: Monitor },
                      { id: ScriptFormat.TV_SERIES, label: '网剧/TV', icon: Film },
                    ].map(fmt => (
                      <button
                        key={fmt.id}
                        onClick={() => update({ scriptFormat: fmt.id })}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold transition-all ${data.scriptFormat === fmt.id ? 'bg-ink-800 text-white shadow-sm' : 'text-ink-500 hover:text-ink-200'}`}
                      >
                        <fmt.icon size={12} /> {fmt.label}
                      </button>
                    ))}
                </div>

                {/* 生成控制区 */}
                <div className="flex gap-2 items-center">
                   <div className="flex-1 bg-ink-950 border border-ink-800 rounded-2xl flex items-center px-4 py-3 shadow-inner">
                      <span className="text-[10px] font-black text-ink-600 mr-2 uppercase whitespace-nowrap">总集数</span>
                      <input type="number" min="1" max="200" value={targetCount} onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)} className="w-full text-sm font-bold text-accent-500 outline-none bg-transparent text-right" />
                   </div>
                   <button 
                     onClick={handleGenerateBreakdown} 
                     disabled={generatingBreakdown || !data.totalOutline} 
                     className="flex-[2] bg-accent-500 text-white px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-accent-600 transition-all shadow-xl disabled:opacity-20 active:scale-95 flex items-center justify-center gap-2"
                   >
                      {generatingBreakdown ? <Loader2 size={16} className="animate-spin" /> : <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px]">+</div>}
                      {generatingBreakdown ? "AI 批量生成中..." : "生成分集 (每5集)"}
                   </button>
                </div>
                {generatingBreakdown && (
                   <div className="mt-4 animate-fadeIn">
                      <div className="flex justify-between items-center mb-1">
                         <span className="text-[9px] font-mono text-accent-500">{breakdownStatus}</span>
                         <span className="text-[9px] font-bold text-ink-500">{breakdownProgress}%</span>
                      </div>
                      <div className="h-1 bg-ink-800 rounded-full overflow-hidden">
                         <div className="h-full bg-accent-500 transition-all duration-300 shadow-[0_0_10px_#6366f1]" style={{ width: `${breakdownProgress}%` }}></div>
                      </div>
                   </div>
                )}
             </div>
         </div>

         {/* 右侧面板：分集列表 */}
         <div className="flex-1 flex flex-col overflow-hidden bg-ink-950">
             <div className="h-16 border-b border-ink-800 bg-ink-900/60 backdrop-blur-3xl flex items-center justify-between px-10 shrink-0">
                <div className="flex items-center gap-4">
                   <div className="p-2 bg-accent-500/10 rounded-xl text-accent-500 border border-accent-500/20">
                      <Flame size={18} />
                   </div>
                   <h2 className="text-xl font-serif font-bold text-ink-100 tracking-tight">分集节奏矩阵</h2>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                {data.outline.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-20">
                     {generatingBreakdown ? (
                        <>
                           <Loader2 size={60} className="mb-6 text-accent-500 animate-spin" />
                           <p className="text-sm font-black uppercase tracking-[0.5em] text-center text-ink-500 mb-2">正在构建故事结构...</p>
                           <p className="text-xs text-ink-600">{breakdownStatus}</p>
                        </>
                     ) : (
                        <>
                           <Target size={80} className="mb-6 text-ink-700 opacity-50" />
                           <p className="text-sm font-black uppercase tracking-[0.5em] text-center text-ink-500 mb-12">暂无数据，请在左侧设定总集数并生成</p>
                        </>
                     )}
                  </div>
                ) : (
                  <div className="max-w-5xl mx-auto space-y-8 pb-40">
                    {data.outline.map((section, index) => {
                        const isExpanded = expandedSections.has(section.id);
                        const isGenerating = generatingScriptId === section.id;
                        const linkedEvents = data.plotEvents.filter(e => e.actId === section.id);
                        
                        return (
                        <div key={section.id} className={`glass-card rounded-[32px] overflow-hidden border-ink-800 transition-all duration-300 hover:border-accent-500/30 ${isExpanded ? 'bg-ink-900/30' : ''}`}>
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="bg-accent-500 text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest shadow-md">
                                            {getSectionLabel(index)}
                                        </div>
                                        <input 
                                          value={section.title} 
                                          onChange={(e) => update({ outline: data.outline.map(s => s.id === section.id ? { ...s, title: e.target.value } : s) })} 
                                          className="font-bold text-xl text-ink-100 bg-transparent outline-none w-full font-serif" 
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                       <button 
                                          onClick={() => handleGenerateFullScript(section)}
                                          disabled={isGenerating}
                                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isGenerating ? 'bg-ink-800 text-ink-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-xl'}`}
                                       >
                                          {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                                          {isGenerating ? "正在生成..." : "生成本集剧本"}
                                       </button>
                                       <button onClick={() => update({ outline: data.outline.filter(s => s.id !== section.id) })} className="text-ink-500 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                                    </div>
                                </div>

                                {/* Content & Emotion */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                    <div className="bg-ink-950 p-4 rounded-2xl border border-ink-800">
                                        <div className="text-[9px] font-black text-ink-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Activity size={10} /> 剧情概要</div>
                                        <textarea 
                                            value={section.content}
                                            onChange={(e) => update({ outline: data.outline.map(s => s.id === section.id ? { ...s, content: e.target.value } : s) })}
                                            className="w-full bg-transparent text-sm text-ink-200 resize-none h-24 outline-none font-serif leading-relaxed"
                                        />
                                    </div>
                                    <div className="bg-ink-950 p-4 rounded-2xl border border-ink-800">
                                        <div className="text-[9px] font-black text-pink-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Heart size={10} /> 人物情绪分析 (Emotional Arc)</div>
                                        <textarea 
                                            value={section.emotionalArc || ''}
                                            onChange={(e) => update({ outline: data.outline.map(s => s.id === section.id ? { ...s, emotionalArc: e.target.value } : s) })}
                                            className="w-full bg-transparent text-sm text-ink-200 resize-none h-24 outline-none font-serif leading-relaxed placeholder:text-ink-700"
                                            placeholder="AI 将自动分析本集人物心理变化..."
                                        />
                                    </div>
                                </div>

                                <button 
                                  onClick={() => setExpandedSections(prev => { const next = new Set(prev); if(next.has(section.id)) next.delete(section.id); else next.add(section.id); return next; })} 
                                  className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-bold text-ink-500 hover:text-accent-500 transition-colors bg-ink-950/50 rounded-xl"
                                >
                                    {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                    {isExpanded ? '收起事件' : `展开 ${linkedEvents.length} 个事件`}
                                </button>
                            </div>
                            
                            {isExpanded && (
                                <div className="px-8 pb-8 bg-ink-950/30 border-t border-ink-800">
                                    <div className="pt-6 space-y-3">
                                      {linkedEvents.map((evt, eIdx) => (
                                          <div key={evt.id} className="flex gap-4 items-center bg-ink-950 p-3 rounded-xl border border-ink-800">
                                              <div className="w-6 h-6 rounded-full bg-ink-800 flex items-center justify-center text-[10px] font-bold text-ink-400">{eIdx + 1}</div>
                                              <div className="flex-1 flex gap-2 items-center">
                                                  {/* Show category badge */}
                                                  {evt.plotline && evt.plotline !== 'main' && (
                                                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${evt.plotline === 'subA' ? 'bg-purple-500/20 text-purple-400' : evt.plotline === 'subB' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                          {evt.plotline === 'subA' ? '冲突' : evt.plotline === 'subB' ? '伏笔' : '弧光'}
                                                      </span>
                                                  )}
                                                  <input value={evt.title} onChange={(e) => handleUpdateEvent(evt.id, 'title', e.target.value)} className="text-xs font-bold text-ink-200 bg-transparent outline-none flex-1" />
                                              </div>
                                              <button onClick={() => handleDeleteEvent(evt.id)} className="text-ink-600 hover:text-red-500"><Trash2 size={12} /></button>
                                          </div>
                                      ))}
                                      <button onClick={() => handleAddEvent(section.id)} className="w-full py-3 border border-dashed border-ink-700 rounded-xl text-[10px] text-ink-500 hover:text-accent-500 hover:border-accent-500/30 transition-all">+ 添加事件</button>
                                    </div>
                                </div>
                            )}
                        </div>
                        );})}
                    </div>
                )}
             </div>
         </div>
      </div>
    </div>
  );
};
