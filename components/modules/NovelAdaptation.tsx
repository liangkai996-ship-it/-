
import React, { useState, useRef, useEffect } from 'react';
import { ProjectData, AppLanguage, NovelUploadChunk, NovelDeepAnalysis, ScriptBlockType, ScriptFormat, AdaptationEpisode, ScriptBlock, AnalysisCharacter, AppNotification, OutlineSection, PlotEvent } from '../../types';
import { GeminiService } from '../../services/geminiService';
import { 
  Upload, Trash2, FileUp, Dna, 
  TrendingUp, Star, MessageCircle,
  Hash, ArrowRight, Loader2, Sparkles, FileText,
  User, Globe, Box, Check, Plus, Scissors, X, ChevronLeft, Layout,
  Layers, Clapperboard, Monitor, Film, Zap, Heart,
  Activity, Save, PenTool, BookOpen, UserCircle2, Tag,
  CheckCircle2, XCircle, GitMerge, RefreshCw
} from 'lucide-react';
import { ScriptEditor } from './ScriptEditor';
import { PlotModule } from './Plot';

interface NovelAdaptationProps {
  data: ProjectData;
  update: (data: Partial<ProjectData>) => void;
  language: AppLanguage;
  addNotification: (title: string, type: 'info' | 'success' | 'error' | 'loading', message?: string) => void;
}

// Revised Workflow Tabs
type TabMode = 'upload' | 'analysis' | 'plan' | 'matrix' | 'script';

// --- Sub-Component: Chunk Upload View (Step A) ---
const ChunkUploadView = ({ 
  data, 
  update, 
  onNextStep
}: { 
  data: ProjectData, 
  update: (d: Partial<ProjectData>) => void, 
  onNextStep: () => void
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chunks = data.novelUploadChunks || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const fileReaders = files.map(file => {
        return new Promise<{ name: string, content: string }>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                resolve({
                    name: file.name,
                    content: event.target?.result as string || ""
                });
            };
            reader.readAsText(file);
        });
    });

    const results = await Promise.all(fileReaders);
    
    const newChunksToAdd: NovelUploadChunk[] = [];
    const CHUNK_SIZE = 100000; 

    results.forEach(({ name, content }) => {
        if (!content) return;
        const isDuplicate = chunks.some(c => c.fileName === name || (c.fileName.startsWith(name) && c.wordCount === content.length));
        if (isDuplicate) return; 

        if (content.length <= CHUNK_SIZE) {
            newChunksToAdd.push({
                id: crypto.randomUUID(),
                fileName: name,
                content: content,
                wordCount: content.length,
                uploadTime: Date.now()
            });
        } else {
            const totalParts = Math.ceil(content.length / CHUNK_SIZE);
            for (let i = 0; i < content.length; i += CHUNK_SIZE) {
                const partIndex = Math.floor(i / CHUNK_SIZE) + 1;
                const chunkContent = content.slice(i, i + CHUNK_SIZE);
                newChunksToAdd.push({
                    id: crypto.randomUUID(),
                    fileName: `${name} (Part ${partIndex}/${totalParts})`,
                    content: chunkContent,
                    wordCount: chunkContent.length,
                    uploadTime: Date.now() + i
                });
            }
        }
    });

    if (newChunksToAdd.length === 0) return;

    const finalChunks = [...chunks, ...newChunksToAdd];
    const fullText = finalChunks.map(c => c.content).join("\n\n");
    
    update({ 
        novelUploadChunks: finalChunks,
        novelFullText: fullText
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeChunk = (id: string) => {
     const newChunks = chunks.filter(c => c.id !== id);
     update({ 
        novelUploadChunks: newChunks,
        novelFullText: newChunks.map(c => c.content).join("\n\n")
     });
  };

  const clearAllChunks = () => {
    if(confirm("确定要清空所有已上传的内容吗？")) {
        update({ novelUploadChunks: [], novelFullText: "" });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-10 animate-fadeIn flex flex-col items-center">
       <div className="max-w-4xl w-full">
          <div className="text-center mb-10">
             <h2 className="text-3xl font-serif font-bold text-ink-100 mb-2">步骤 A：原著全本投喂</h2>
             <p className="text-ink-500 flex items-center justify-center gap-2">
                <Scissors size={14} /> 支持百万字长篇上传，系统将自动进行<span className="text-accent-500 font-bold">智能分段处理</span>
             </p>
          </div>

          <div 
             onClick={() => fileInputRef.current?.click()}
             className="border-2 border-dashed border-ink-800 hover:border-accent-500 hover:bg-accent-500/5 rounded-[32px] p-10 text-center cursor-pointer transition-all mb-8 group relative overflow-hidden"
          >
             <div className="w-16 h-16 rounded-full bg-ink-900 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform relative z-10">
                <FileUp size={24} className="text-ink-400 group-hover:text-accent-500" />
             </div>
             <h3 className="text-lg font-bold text-ink-200 mb-1 relative z-10">点击上传小说文本 (.txt)</h3>
             <p className="text-xs text-ink-500 relative z-10">无需手动切分，AI 自动完成分卷阅读</p>
             <input type="file" ref={fileInputRef} className="hidden" accept=".txt" multiple onChange={handleFileUpload} />
          </div>

          {chunks.length > 0 && (
             <div className="mb-10">
                <div className="flex justify-between items-center mb-4 px-2">
                   <div className="text-[10px] font-black text-ink-500 uppercase tracking-widest">
                      阅读队列 ({chunks.length} 个分卷)
                   </div>
                   <button onClick={clearAllChunks} className="text-[10px] text-red-500 hover:text-red-400 flex items-center gap-1">
                      <Trash2 size={12} /> 清空列表
                   </button>
                </div>
                
                <div className="bg-ink-900/50 rounded-2xl border border-ink-800 overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
                   {chunks.map((chunk, index) => (
                      <div key={chunk.id} className="p-4 border-b border-ink-800/50 flex items-center justify-between hover:bg-white/5 transition-colors group">
                         <div className="flex items-center gap-4">
                            <div className="w-6 h-6 rounded-lg bg-ink-800 flex items-center justify-center text-[10px] font-bold text-ink-400">
                               {index + 1}
                            </div>
                            <div>
                               <div className="text-sm font-bold text-ink-200">{chunk.fileName}</div>
                               <div className="text-[10px] text-ink-500 font-mono">
                                  {(chunk.wordCount / 10000).toFixed(2)}万字
                               </div>
                            </div>
                         </div>
                         <button onClick={() => removeChunk(chunk.id)} className="text-ink-700 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X size={16} />
                         </button>
                      </div>
                   ))}
                </div>
             </div>
          )}

          <div className="flex justify-end pt-6 border-t border-ink-800">
             <button 
               onClick={onNextStep}
               disabled={chunks.length === 0}
               className="px-8 py-4 bg-ink-100 text-ink-950 rounded-2xl font-bold uppercase tracking-widest shadow-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-3 transition-all w-full md:w-auto justify-center"
             >
                下一步：深度研报 <ArrowRight size={18} />
             </button>
          </div>
       </div>
    </div>
  );
};

// --- Sub-Component: Analysis Report View (Step B - Editable with Cards) ---
const AnalysisReportView = ({ 
    data, 
    update,
    language,
    onNextStep
}: { 
    data: ProjectData, 
    update: (d: Partial<ProjectData>) => void,
    language: AppLanguage,
    onNextStep: () => void
}) => {
  const [activeTab, setActiveTab] = useState<'world' | 'plot' | 'char'>('plot');
  const [isGenerating, setIsGenerating] = useState(false);

  const report = data.novelDeepAnalysis || { worldView: '', mainPlot: '', characterProfiles: '', characterCards: [] };

  const handleGenerateReport = async () => {
     if (!data.novelUploadChunks || data.novelUploadChunks.length === 0) {
         alert("请先上传小说文件");
         return;
     }
     
     setIsGenerating(true);
     try {
        const result = await GeminiService.deepAnalyzeNovelFullReport(data.novelUploadChunks, language);
        update({ novelDeepAnalysis: result });
     } catch (e) {
        alert("生成报告失败，请重试");
     } finally {
        setIsGenerating(false);
     }
  };

  const updateReport = (field: keyof NovelDeepAnalysis, value: string) => {
      update({ novelDeepAnalysis: { ...report, [field]: value } });
  };

  const updateCharacterCard = (idx: number, updates: Partial<AnalysisCharacter>) => {
      if (!report.characterCards) return;
      const newCards = [...report.characterCards];
      newCards[idx] = { ...newCards[idx], ...updates };
      update({ novelDeepAnalysis: { ...report, characterCards: newCards } });
  };

  const addCharacterCard = () => {
      const newCard: AnalysisCharacter = {
          id: crypto.randomUUID(), name: '新角色', tagline: '', archetype: '', description: '', traits: [], relationship: ''
      };
      update({ novelDeepAnalysis: { ...report, characterCards: [...(report.characterCards || []), newCard] } });
  };

  const deleteCharacterCard = (idx: number) => {
      if (!report.characterCards) return;
      const newCards = report.characterCards.filter((_, i) => i !== idx);
      update({ novelDeepAnalysis: { ...report, characterCards: newCards } });
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-ink-950 animate-fadeIn h-full">
       <div className="h-16 border-b border-ink-800 flex items-center justify-between px-8 bg-ink-900/80 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-6">
             <div className="flex bg-ink-950 p-1.5 rounded-xl border border-ink-800 shadow-lg">
                {[
                  { id: 'plot', label: '主线脉络 (3500字)', icon: TrendingUp },
                  { id: 'char', label: '人物档案卡', icon: User },
                  { id: 'world', label: '世界观/设定', icon: Globe },
                ].map(tab => (
                   <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-accent-600 text-white shadow-md' : 'text-ink-500 hover:text-ink-200 hover:bg-white/5'}`}
                   >
                      <tab.icon size={14} /> {tab.label}
                   </button>
                ))}
             </div>
          </div>
          
          <div className="flex gap-4">
            <button 
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="flex items-center gap-2 px-6 py-2.5 bg-ink-800 text-ink-200 border border-ink-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-ink-700 hover:text-white transition-all shadow-sm"
            >
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {isGenerating ? "AI 正在阅读分析..." : (report.mainPlot ? "重新生成研报" : "生成深度研报")}
            </button>
            <button 
               onClick={onNextStep}
               className="px-6 py-2.5 bg-ink-100 text-ink-950 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white transition-all shadow-lg flex items-center gap-2"
            >
               下一步：改编全案 <ArrowRight size={14} />
            </button>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-ink-950 relative">
          <div className="max-w-7xl mx-auto py-12 px-10">
             {activeTab === 'char' ? (
                 // Character Cards Grid View
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {report.characterCards?.map((char, idx) => (
                        <div key={idx} className="group relative glass-card rounded-[32px] p-6 border border-white/5 hover:border-accent-500/30 transition-all bg-gradient-to-br from-white/[0.02] to-transparent">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-ink-800 flex items-center justify-center text-accent-500 font-bold text-xl border border-white/5 shadow-inner">
                                        {char.name[0]}
                                    </div>
                                    <div>
                                        <input 
                                            value={char.name} 
                                            onChange={(e) => updateCharacterCard(idx, { name: e.target.value })}
                                            className="bg-transparent text-lg font-bold text-white w-full outline-none"
                                        />
                                        <input 
                                            value={char.archetype} 
                                            onChange={(e) => updateCharacterCard(idx, { archetype: e.target.value })}
                                            className="bg-transparent text-[10px] text-ink-500 uppercase w-full outline-none"
                                            placeholder="原型 (如: 霸总)"
                                        />
                                    </div>
                                </div>
                                <button onClick={() => deleteCharacterCard(idx)} className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-600 hover:text-red-500"><Trash2 size={16} /></button>
                            </div>
                            
                            <div className="mb-4">
                                <div className="text-[9px] font-black text-ink-600 uppercase mb-1">TAGLINE</div>
                                <input 
                                    value={char.tagline} 
                                    onChange={(e) => updateCharacterCard(idx, { tagline: e.target.value })}
                                    className="w-full bg-ink-950/30 rounded-lg px-3 py-2 text-xs text-accent-400 font-bold border border-white/5 outline-none focus:border-accent-500/50"
                                />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-[9px] font-black text-ink-600 uppercase mb-1">DESCRIPTION</div>
                                    <textarea 
                                        value={char.description}
                                        onChange={(e) => updateCharacterCard(idx, { description: e.target.value })}
                                        className="w-full bg-transparent text-xs text-ink-300 outline-none resize-none h-20 leading-relaxed custom-scrollbar"
                                    />
                                </div>
                                <div>
                                    <div className="text-[9px] font-black text-ink-600 uppercase mb-1">RELATIONSHIP</div>
                                    <input 
                                        value={char.relationship}
                                        onChange={(e) => updateCharacterCard(idx, { relationship: e.target.value })}
                                        className="w-full bg-transparent text-xs text-ink-300 outline-none border-b border-white/5 pb-1 focus:border-accent-500/50"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {char.traits?.map((trait, tIdx) => (
                                        <span key={tIdx} className="px-2 py-1 rounded-md bg-ink-800 text-[9px] text-ink-400 border border-white/5">{trait}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                    <button onClick={addCharacterCard} className="glass-card rounded-[32px] p-6 border border-dashed border-ink-800 flex flex-col items-center justify-center gap-2 hover:border-accent-500/50 text-ink-500 hover:text-accent-500 transition-all min-h-[300px]">
                        <Plus size={32} />
                        <span className="text-xs font-bold uppercase tracking-widest">添加角色卡</span>
                    </button>
                 </div>
             ) : (
                 // Text Area View for Plot / World
                <div className="glass-card p-12 rounded-[40px] border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent shadow-2xl flex flex-col min-h-[600px]">
                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4 shrink-0">
                        <div className="text-[10px] font-black text-accent-500 uppercase tracking-[0.4em] flex items-center gap-3">
                            <Box size={14} /> 
                            {activeTab === 'plot' && "Storyline Detail Analysis (Editable)"}
                            {activeTab === 'world' && "World Building & Mechanics (Editable)"}
                        </div>
                        <div className="text-[10px] text-ink-500 font-mono">支持 Markdown 编辑</div>
                    </div>

                    <textarea
                        className="flex-1 w-full bg-transparent resize-none outline-none text-ink-200 font-serif leading-loose text-lg placeholder:text-ink-700 p-2 border border-transparent focus:border-ink-800 rounded-xl transition-all h-[500px]"
                        placeholder={isGenerating ? "AI 正在思考中..." : "点击此处可直接编辑 AI 生成的分析报告..."}
                        value={activeTab === 'plot' ? report.mainPlot : report.worldView}
                        onChange={(e) => updateReport(activeTab === 'plot' ? 'mainPlot' : 'worldView', e.target.value)}
                    />
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

// --- Sub-Component: Adaptation Plan View (Step C - Interactive) ---
const AdaptationPlanView = ({ 
  data, 
  update, 
  language,
  onGenerateScript,
  addNotification
}: { 
  data: ProjectData, 
  update: (d: Partial<ProjectData>) => void,
  language: AppLanguage,
  onGenerateScript: (episode: AdaptationEpisode) => Promise<boolean>,
  addNotification: (title: string, type: 'info' | 'success' | 'error' | 'loading', message?: string) => void;
}) => {
  const [format, setFormat] = useState<ScriptFormat>(ScriptFormat.LIVE_ACTION_SHORT);
  const [episodeCount, setEpisodeCount] = useState<number>(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingEpId, setGeneratingEpId] = useState<string | null>(null);
  
  // Track mount status to safely update local state after async ops
  const isMounted = useRef(true);
  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);
  
  // Flag to indicate format selected, so we can show the container
  const [hasFormatSelected, setHasFormatSelected] = useState(false);

  const handleFormatSelect = (fmt: ScriptFormat) => {
      setFormat(fmt);
      setHasFormatSelected(true);
  };

  const syncPlanToMatrix = (episodes: AdaptationEpisode[]) => {
      // Logic to sync Adaptation Plan to Outline/Matrix
      const newOutline: OutlineSection[] = episodes.map(ep => ({
          id: ep.id,
          title: ep.title,
          content: ep.summary,
          scenes: [], 
          emotionalArc: ep.emotions.join(' '),
          visualKeywords: ''
      }));

      // Flatten events for Matrix
      const newPlotEvents: PlotEvent[] = [];
      episodes.forEach(ep => {
          ep.events.forEach((evtStr, index) => {
              newPlotEvents.push({
                  id: crypto.randomUUID(),
                  actId: ep.id,
                  title: evtStr.length > 20 ? evtStr.substring(0, 20) + '...' : evtStr,
                  description: evtStr,
                  tension: 5,
                  plotline: 'main', // Default all Adaptation events to 'main' for now
                  emotions: ''
              });
          });
      });

      update({ outline: newOutline, plotEvents: newPlotEvents });
      addNotification("数据已同步", "info", "改编全案已自动同步至「事件矩阵」。");
  };

  const handleGeneratePlan = async (isContinuation: boolean = false) => {
    if (!data.novelDeepAnalysis || !data.novelDeepAnalysis.mainPlot) {
      alert("请先在「深度研报」中生成或填写内容");
      return;
    }
    
    setIsGenerating(true);
    addNotification("改编全案生成中", "loading", "AI 正在后台构思剧情结构，您可以自由切换页面，完成后会收到通知。");

    try {
      const currentEpisodes = data.novelAdaptationPlan || [];
      const startEpisode = isContinuation ? currentEpisodes.length + 1 : 1;
      
      const BATCH_SIZE = 5; 
      const remainingEpisodes = episodeCount - (startEpisode - 1);
      const batchSize = Math.min(BATCH_SIZE, remainingEpisodes);

      if (batchSize <= 0) {
          addNotification("生成已完成", "info", `已达到预期的 ${episodeCount} 集，无需继续生成。`);
          if (isMounted.current) setIsGenerating(false);
          return;
      }
      
      let context = "";
      if (isContinuation && currentEpisodes.length > 0) {
          const lastEp = currentEpisodes[currentEpisodes.length - 1];
          context = `第 ${lastEp.episodeNumber} 集剧情：${lastEp.summary}`;
      }

      const newEpisodes = await GeminiService.generateNovelAdaptationPlanBatch(
          data.novelDeepAnalysis, 
          format, 
          language, 
          startEpisode,
          batchSize,
          context,
          episodeCount 
      );
      
      let finalEpisodes = [];
      if (isContinuation) {
          finalEpisodes = [...currentEpisodes, ...newEpisodes];
      } else {
          finalEpisodes = newEpisodes;
      }
      
      // Update plan AND sync to Matrix automatically
      update({ novelAdaptationPlan: finalEpisodes });
      syncPlanToMatrix(finalEpisodes);

      addNotification("改编全案生成成功", "success", `已生成 ${newEpisodes.length} 集大纲，并同步至事件矩阵。`);

    } catch (e) {
      addNotification("生成失败", "error", "请检查网络或 API Key 设置");
    } finally {
      if (isMounted.current) setIsGenerating(false);
    }
  };

  const updateEpisode = (id: string, updates: Partial<AdaptationEpisode>) => {
      const newPlan = data.novelAdaptationPlan?.map(ep => ep.id === id ? { ...ep, ...updates } : ep) || [];
      update({ novelAdaptationPlan: newPlan });
  };

  const removeEpisode = (id: string) => {
      if(!confirm("确定删除此集吗？")) return;
      update({ novelAdaptationPlan: data.novelAdaptationPlan?.filter(e => e.id !== id) });
  };

  const handleSingleScriptGen = async (ep: AdaptationEpisode) => {
    setGeneratingEpId(ep.id);
    addNotification(`正在生成第 ${ep.episodeNumber} 集剧本`, "loading", "您可以离开此页面，AI 将在后台完成写作。");
    
    // We wrap the passed handler to ensure we catch errors and handle notifications properly here
    const success = await onGenerateScript(ep);
    
    if (success) {
        addNotification("剧本生成成功", "success", `第 ${ep.episodeNumber} 集《${ep.title}》已完成。`);
    } else {
        addNotification("剧本生成失败", "error", `第 ${ep.episodeNumber} 集生成遇到问题。`);
    }

    if (isMounted.current) setGeneratingEpId(null);
  };

  // Determine if we should show the "Generate Next" button
  const currentTotal = data.novelAdaptationPlan?.length || 0;
  const showGenerateNext = currentTotal > 0 && currentTotal < episodeCount;

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-ink-950 animate-fadeIn h-full">
       {/* Toolbar */}
       <div className="h-24 border-b border-ink-800 flex flex-col justify-center px-8 bg-ink-900/80 backdrop-blur-xl shrink-0 gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="flex bg-ink-950 p-1 rounded-xl border border-ink-800">
                {[
                    { id: ScriptFormat.LIVE_ACTION_SHORT, label: '真人短剧 (2-3min)', icon: Clapperboard },
                    { id: ScriptFormat.COMIC_DRAMA, label: '漫剧 (1.5-3min)', icon: Monitor },
                    { id: ScriptFormat.TV_SERIES, label: '标准剧集', icon: Film },
                ].map(fmt => (
                    <button 
                    key={fmt.id}
                    onClick={() => handleFormatSelect(fmt.id as ScriptFormat)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${format === fmt.id ? 'bg-blue-600 text-white shadow-md' : 'text-ink-500 hover:text-ink-200'}`}
                    >
                    <fmt.icon size={14} /> {fmt.label}
                    </button>
                ))}
                </div>
                
                <div className="flex items-center gap-2 bg-ink-950 px-4 py-2 rounded-xl border border-ink-800">
                    <span className="text-[10px] font-bold text-ink-500 uppercase">预期集数</span>
                    <input 
                        type="number" 
                        value={episodeCount} 
                        onChange={(e) => setEpisodeCount(Math.max(1, parseInt(e.target.value) || 10))}
                        className="w-12 bg-transparent text-sm font-bold text-ink-100 text-center outline-none border-b border-ink-700 focus:border-accent-500"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button 
                    onClick={() => data.novelAdaptationPlan && syncPlanToMatrix(data.novelAdaptationPlan)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-ink-800 text-ink-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-ink-700 transition-all shadow-sm active:scale-95"
                    title="手动将当前内容同步到事件矩阵"
                >
                    <RefreshCw size={14} /> 同步至事件矩阵
                </button>
                <button 
                    onClick={() => handleGeneratePlan(false)}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-6 py-2.5 bg-accent-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-accent-500 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                    {isGenerating ? "大师编剧构思中..." : "生成分集改编全案"}
                </button>
            </div>
          </div>
          <div className="text-[10px] text-ink-500 flex items-center gap-2">
             <Activity size={12} className="text-pink-500" />
             提示：AI 将根据深度研报的主线脉络，严格把控在 {episodeCount} 集内完成完整叙事。生成后自动同步至【事件矩阵】。
          </div>
       </div>

       {/* Cards Stream */}
       <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-ink-950">
          {!hasFormatSelected && !data.novelAdaptationPlan ? (
             <div className="flex flex-col items-center justify-center h-full opacity-30">
                <Layout size={80} className="mb-6 text-ink-500" />
                <p className="text-xs font-mono uppercase tracking-[0.5em]">请选择剧本制式以开始</p>
             </div>
          ) : (
             <div className="max-w-7xl mx-auto space-y-8 pb-32">
                {(!data.novelAdaptationPlan || data.novelAdaptationPlan.length === 0) && (
                    <div className="border-2 border-dashed border-ink-800 rounded-[32px] p-12 text-center">
                        <p className="text-ink-500 font-bold mb-4">分集列表已就绪</p>
                        <button onClick={() => handleGeneratePlan(false)} className="px-6 py-2 bg-ink-800 rounded-full text-xs text-white hover:bg-accent-600 transition-all">
                            点击生成前 5 集
                        </button>
                    </div>
                )}

                {data.novelAdaptationPlan?.map((ep, idx) => (
                   <div key={ep.id} className="glass-card rounded-[32px] overflow-hidden border border-white/5 hover:border-accent-500/30 transition-all group relative">
                      <div className="bg-ink-900/50 p-6 flex items-center justify-between border-b border-white/5">
                         <div className="flex items-center gap-4 flex-1">
                            <div className="bg-accent-500 text-white font-black text-xl w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                               {ep.episodeNumber}
                            </div>
                            <div className="w-full mr-4">
                               <div className="text-[10px] font-bold text-ink-500 uppercase tracking-widest mb-1">EPISODE TITLE</div>
                               <input 
                                  value={ep.title} 
                                  onChange={(e) => updateEpisode(ep.id, { title: e.target.value })}
                                  className="text-xl font-serif font-bold text-white bg-transparent outline-none w-full border-b border-transparent focus:border-ink-700 transition-all"
                                  placeholder="输入本集标题"
                               />
                            </div>
                         </div>
                         
                         <div className="flex items-center gap-4">
                            {/* Emotions Input */}
                            <div className="flex items-center bg-white/5 px-3 py-1.5 rounded-full border border-white/10 w-64">
                                <Heart size={12} className="text-pink-500 mr-2 shrink-0" />
                                <input 
                                    value={ep.emotions.join(' ')} 
                                    onChange={(e) => updateEpisode(ep.id, { emotions: e.target.value.split(' ') })}
                                    className="bg-transparent text-[10px] text-ink-200 outline-none w-full placeholder:text-ink-600"
                                    placeholder="关键情绪 (如: 愤怒 悔恨)..."
                                />
                            </div>
                            <button onClick={() => removeEpisode(ep.id)} className="text-ink-700 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                         </div>
                      </div>
                      
                      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
                         {/* Plot Summary */}
                         <div className="lg:col-span-2 space-y-6">
                            <div>
                               <h4 className="text-[10px] font-black text-ink-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                  <Activity size={14} /> 剧情梗概 (Synopsis)
                               </h4>
                               <textarea 
                                  value={ep.summary}
                                  onChange={(e) => updateEpisode(ep.id, { summary: e.target.value })}
                                  className="w-full bg-ink-950/30 border border-ink-800/50 rounded-xl p-4 text-ink-200 leading-relaxed font-serif text-sm resize-none h-24 focus:border-accent-500/50 outline-none transition-all"
                                  placeholder="本集发生了什么..."
                               />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6">
                               <div>
                                  <h4 className="text-[10px] font-black text-ink-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                     <User size={14} /> 出场人物 (Cast)
                                  </h4>
                                  <textarea 
                                      value={ep.characters.join(', ')} 
                                      onChange={(e) => updateEpisode(ep.id, { characters: e.target.value.split(/[,，]\s*/) })}
                                      className="w-full bg-ink-950/30 border border-ink-800/50 rounded-xl p-3 text-xs text-ink-300 resize-none h-20 focus:border-accent-500/50 outline-none"
                                      placeholder="人物A, 人物B..."
                                  />
                               </div>
                               <div>
                                  <h4 className="text-[10px] font-black text-ink-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                     <Layers size={14} /> 关键事件 (Key Events)
                                  </h4>
                                  <textarea 
                                      value={ep.events.join('\n')} 
                                      onChange={(e) => updateEpisode(ep.id, { events: e.target.value.split('\n') })}
                                      className="w-full bg-ink-950/30 border border-ink-800/50 rounded-xl p-3 text-xs text-ink-300 resize-none h-20 focus:border-accent-500/50 outline-none leading-relaxed"
                                      placeholder="事件1&#10;事件2..."
                                  />
                               </div>
                            </div>
                         </div>

                         {/* Beats Section */}
                         <div className="bg-ink-950/50 rounded-3xl p-6 border border-white/5 flex flex-col justify-between">
                            <div>
                                <h4 className="text-[10px] font-black text-accent-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Zap size={14} /> 黄金节拍 (Master Beats)
                                </h4>
                                <div className="space-y-4">
                                {ep.beats.map((beat, i) => (
                                    <div key={i} className="flex gap-3 relative group/beat">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-2 h-2 rounded-full ${beat.type === 'hook' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : beat.type === 'climax' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : beat.type === 'reversal' ? 'bg-purple-500' : 'bg-ink-600'}`}></div>
                                            {i < ep.beats.length - 1 && <div className="w-px h-full bg-ink-800 my-1"></div>}
                                        </div>
                                        <div className="pb-2 w-full">
                                            <input 
                                                value={beat.name} 
                                                onChange={(e) => {
                                                    const newBeats = [...ep.beats];
                                                    newBeats[i].name = e.target.value;
                                                    updateEpisode(ep.id, { beats: newBeats });
                                                }}
                                                className={`text-[10px] font-bold uppercase mb-1 bg-transparent outline-none w-full ${beat.type === 'hook' ? 'text-amber-500' : beat.type === 'climax' ? 'text-red-500' : 'text-ink-400'}`}
                                            />
                                            <textarea 
                                                value={beat.description}
                                                onChange={(e) => {
                                                    const newBeats = [...ep.beats];
                                                    newBeats[i].description = e.target.value;
                                                    updateEpisode(ep.id, { beats: newBeats });
                                                }}
                                                className="text-[11px] text-ink-300 leading-tight bg-transparent outline-none w-full resize-none h-12 border-b border-transparent focus:border-ink-800"
                                            />
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => handleSingleScriptGen(ep)}
                                disabled={generatingEpId === ep.id}
                                className={`w-full mt-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95
                                    ${generatingEpId === ep.id ? 'bg-ink-800 text-ink-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                            >
                                {generatingEpId === ep.id ? <Loader2 size={14} className="animate-spin" /> : <PenTool size={14} />}
                                {generatingEpId === ep.id ? "正在后台生成..." : "生成本集剧本"}
                            </button>
                         </div>
                      </div>
                   </div>
                ))}
                
                {showGenerateNext && (
                    <button 
                        onClick={() => handleGeneratePlan(true)}
                        disabled={isGenerating}
                        className="w-full py-6 border-2 border-dashed border-accent-500/30 rounded-[32px] text-accent-500 font-black uppercase tracking-widest hover:bg-accent-500/5 transition-all flex items-center justify-center gap-3 shadow-lg"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                        {isGenerating ? "正在续写中 (后台运行)..." : `生成后续 5 集 (当前进度 ${currentTotal}/${episodeCount} 集)`}
                    </button>
                )}
                
                {currentTotal >= episodeCount && (
                    <div className="flex items-center justify-center gap-2 py-6 text-ink-500 font-bold uppercase text-xs tracking-widest">
                        <CheckCircle2 size={16} className="text-green-500" /> 全剧 {episodeCount} 集大纲规划完成
                    </div>
                )}
             </div>
          )}
       </div>
    </div>
  );
};

export const NovelAdaptationModule: React.FC<NovelAdaptationProps> = ({ data, update, language, addNotification }) => {
  const [activeTab, setActiveTab] = useState<TabMode>('upload');

  const handleGenerateScript = async (episode: AdaptationEpisode): Promise<boolean> => {
     try {
         const newBlocks = await GeminiService.generateScriptFromAdaptationEpisode(episode, data, language);
         if (newBlocks && newBlocks.length > 0) {
             const scriptWithNewBlocks = [...data.script, ...newBlocks];
             update({ script: scriptWithNewBlocks });
             return true;
         }
         return false;
     } catch (e) {
         return false;
     }
  };

  return (
    <div className="h-full flex bg-ink-950 overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-ink-900/50 border-r border-ink-800 flex flex-col shrink-0 animate-fadeIn">
         <div className="h-16 flex items-center px-6 border-b border-ink-800">
             <div className="flex items-center gap-2 text-ink-100 font-bold font-serif">
                <BookOpen className="text-blue-500" size={20} />
                <span>改编工作流</span>
             </div>
         </div>
         
         <div className="p-4 space-y-2">
            {[
                { id: 'upload', label: '1. 原著投喂', icon: Upload, desc: '上传小说文本' },
                { id: 'analysis', label: '2. 深度研报', icon: Activity, desc: 'AI 拆解卖点' },
                { id: 'plan', label: '3. 改编全案', icon: Layers, desc: '生成分集大纲' },
                { id: 'matrix', label: '4. 事件矩阵', icon: GitMerge, desc: '可视化剧情梳理' },
                { id: 'script', label: '5. 正文写作', icon: PenTool, desc: '剧本编辑引擎' },
            ].map(item => {
                const isActive = activeTab === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as TabMode)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group
                        ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-ink-800 text-ink-500 hover:text-ink-200'}`}
                    >
                        <item.icon size={18} className={isActive ? 'text-white' : 'text-ink-500 group-hover:text-blue-500 transition-colors'} />
                        <div>
                            <div className="text-xs font-bold">{item.label}</div>
                            <div className={`text-[9px] ${isActive ? 'text-blue-100' : 'text-ink-600'}`}>{item.desc}</div>
                        </div>
                    </button>
                );
            })}
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col bg-ink-950">
         {activeTab === 'upload' && (
             <ChunkUploadView 
                data={data} 
                update={update} 
                onNextStep={() => setActiveTab('analysis')} 
             />
         )}
         {activeTab === 'analysis' && (
             <AnalysisReportView 
                data={data} 
                update={update} 
                language={language}
                onNextStep={() => setActiveTab('plan')} 
             />
         )}
         {activeTab === 'plan' && (
             <AdaptationPlanView 
                data={data} 
                update={update} 
                language={language}
                onGenerateScript={handleGenerateScript} 
                addNotification={addNotification}
             />
         )}
         {activeTab === 'matrix' && (
             <PlotModule 
                data={data} 
                update={update} 
                language={language} 
             />
         )}
         {activeTab === 'script' && (
             <ScriptEditor 
                data={data} 
                update={update} 
                undo={() => {}} // Undo/Redo logic would need a history manager in App.tsx ideally
                redo={() => {}} 
                language={language} 
             />
         )}
      </div>
    </div>
  );
};
