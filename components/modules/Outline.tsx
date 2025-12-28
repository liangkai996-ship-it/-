
import React, { useState, useRef } from 'react';
import { ProjectData, OutlineScene, AppLanguage, ScriptFormat, OutlineSection } from '../../types';
import { GeminiService } from '../../services/geminiService';
import { Lightbulb, RefreshCw, Wand2, Plus, Trash2, GripVertical, Layout, List, Columns, Film, Tv, Smartphone, Clock, AlertTriangle, BookOpen, ChevronRight, Layers, Tag, ChevronDown, ChevronUp, MessageCircle, Sparkles } from 'lucide-react';
import { getTranslation } from '../../utils/translations';

interface OutlineProps {
  data: ProjectData;
  update: (data: Partial<ProjectData>) => void;
  language: AppLanguage;
}

type ViewMode = 'list' | 'board';

const OUTLINE_TEMPLATES: Record<ScriptFormat, Omit<OutlineSection, 'id' | 'content' | 'scenes'>[]> = {
  [ScriptFormat.SHORT_VIDEO]: [
    { title: '黄金前3秒 (Hook)', tips: '0-3s: 视觉奇观或核心悬念，完播率的关键。' },
    { title: '情境铺垫 (Setup)', tips: '3-15s: 快速建立人物身份与核心矛盾，节奏要快。' },
    { title: '反转/冲突 (Twist)', tips: '15-45s: 剧情急转直下，或冲突升级，打破预期。' },
    { title: '情绪高潮 (Climax)', tips: '45-60s: 情绪释放点，爽感或痛点达到顶峰。' },
    { title: '钩子/结局 (Outro)', tips: '60s+: 留下悬念引导关注(Call to Action)，或给出有力结局。' }
  ],
  [ScriptFormat.MOVIE]: [
    { title: '第一幕：铺垫 (Setup)', tips: '0-30min: 建置世界观，介绍主角。包含激励事件(Inciting Incident)和情节点一。' },
    { title: '第二幕：对抗 (Confrontation)', tips: '30-90min: 试炼、盟友与敌人。包含中点(Midpoint)高潮和灵魂黑夜(All is Lost)。' },
    { title: '第三幕：结局 (Resolution)', tips: '90-110min: 最终决战(Climax)与新常态的建立。' }
  ],
  [ScriptFormat.TV_SERIES]: [
    { title: '冷开场 (Teaser)', tips: '0-3min: 剧集标题前的独立高能片段，暗示本集主题。' },
    { title: '第一幕 (Act 1)', tips: '3-12min: 确立本集的具体任务或危机。' },
    { title: '第二幕 (Act 2)', tips: '12-25min: 尝试解决问题但陷入更深的麻烦。' },
    { title: '第三幕 (Act 3)', tips: '25-35min: 次级高潮，通常包含一个重大转折。' },
    { title: '第四幕 (Act 4)', tips: '35-45min: 结局与下集预告(Cliffhanger)。' }
  ],
  [ScriptFormat.MID_FORM_SERIES]: [
    { title: '序幕 (Prologue)', tips: '0-2min: 快速回顾或引入新危机。' },
    { title: '上半场：困境', tips: '2-10min: 主角遭遇无法回避的挑战，节奏紧凑。' },
    { title: '下半场：突围', tips: '10-20min: 通过行动改变现状，推向单集高潮。' }
  ],
  [ScriptFormat.DYNAMIC_COMIC]: [
    { title: '分镜一：开篇', tips: '强视觉冲击，定场与氛围。' },
    { title: '分镜二：展开', tips: '对话密集区，信息量输出。' },
    { title: '分镜三：高潮', tips: '动作场面或表情特写，BGM配合点。' }
  ],
  [ScriptFormat.ANIMATION]: [
    { title: 'A Part (前半)', tips: '0-10min: 日常引入或危机发生。' },
    { title: 'Eyecatch (过场)', tips: '中场休息的转场点。' },
    { title: 'B Part (后半)', tips: '10-22min: 解决危机或深化主题。' },
    { title: 'ED/C Part', tips: '22min+: 片尾曲后的彩蛋或预告。' }
  ]
};

export const OutlineModule: React.FC<OutlineProps> = ({ data, update, language }) => {
  const t = getTranslation(language) as any;
  const [expandingTotal, setExpandingTotal] = useState(false);
  const [generatingTotal, setGeneratingTotal] = useState(false);
  const [generatingBreakdown, setGeneratingBreakdown] = useState(false);
  const [generatingSectionId, setGeneratingSectionId] = useState<string | null>(null);
  const [generatingBeatsId, setGeneratingBeatsId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list'); 
  const [draggedScene, setDraggedScene] = useState<{ sectionId: string, sceneId: string } | null>(null);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [targetCount, setTargetCount] = useState<number>(3);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const handleExpandLoglineToOutline = async () => {
    if (!data.logline) { alert("请先输入一句话故事。"); return; }
    setExpandingTotal(true);
    try {
        const result = await GeminiService.expandLoglineToOutline(data.logline, language);
        update({ totalOutline: result });
    } catch (e) { alert("扩写失败"); } finally { setExpandingTotal(false); }
  };

  const handleGenerateTotalOutline = async () => {
    setGeneratingTotal(true);
    try {
        const context = `Title: ${data.title}\nLogline: ${data.logline}\nGenre: ${data.genre}`;
        const total = await GeminiService.generateTotalOutline(context, language);
        update({ totalOutline: total });
    } catch (e) { alert("生成失败"); } finally { setGeneratingTotal(false); }
  };

  const handleGenerateBreakdown = async () => {
    if (!data.totalOutline) { alert("请先填写或生成故事总纲。"); return; }
    const hasContent = data.outline.some(s => s.content.length > 0 || s.scenes.length > 0);
    if (hasContent && !confirm(t.outline.overwriteWarning)) return;
    setGeneratingBreakdown(true);
    try {
        const breakdown = await GeminiService.generateEpisodeBreakdown(data.totalOutline, data.scriptFormat || ScriptFormat.MOVIE, targetCount, language);
        if (breakdown.length > 0) { update({ outline: breakdown }); setExpandedSections(new Set()); }
    } catch (e) { alert("生成分集失败"); } finally { setGeneratingBreakdown(false); }
  };

  const handleGenerateSection = async (id: string, title: string) => {
    setGeneratingSectionId(id);
    try {
      const context = `Outline: ${data.totalOutline || ''}`;
      const content = await GeminiService.generateOutlineSection(title, context, language);
      if (content) updateSection(id, 'content', content);
    } catch (e) { alert("生成失败"); } finally { setGeneratingSectionId(null); }
  };

  const updateSection = (id: string, field: string, value: string) => {
    update({ outline: data.outline.map(s => s.id === id ? { ...s, [field]: value } : s) });
  };

  const updateScene = (sectionId: string, sceneId: string, field: keyof OutlineScene, value: string) => {
    update({ outline: data.outline.map(s => s.id === sectionId ? { ...s, scenes: s.scenes.map(scene => scene.id === sceneId ? { ...scene, [field]: value } : scene) } : s) });
  };

  const handleFormatChange = (format: ScriptFormat) => {
    const template = OUTLINE_TEMPLATES[format];
    const newOutline: OutlineSection[] = template.map(item => ({ id: crypto.randomUUID(), title: item.title, tips: item.tips, content: '', scenes: [] }));
    update({ scriptFormat: format, outline: newOutline });
  };

  const getSectionLabel = (index: number, format?: ScriptFormat) => {
     if (format === ScriptFormat.TV_SERIES || format === ScriptFormat.MID_FORM_SERIES || format === ScriptFormat.ANIMATION) return `第 ${index + 1} 集`;
     if (format === ScriptFormat.SHORT_VIDEO) return `节拍 ${index + 1}`;
     return `第 ${index + 1} 幕`;
  };

  return (
    <div className="h-full flex flex-col bg-ink-950 transition-colors duration-400">
      <div className="flex-1 overflow-hidden flex flex-col xl:flex-row">
         
         {/* LEFT PANEL */}
         <div className="w-full xl:w-[400px] flex flex-col border-r border-ink-700 bg-ink-900 shrink-0 shadow-xl z-10 overflow-hidden transition-colors">
             <div className="p-6 border-b border-ink-700 bg-ink-950/50">
                <div className="flex items-center gap-2 mb-3 text-ink-100 font-bold text-sm">
                   <Sparkles size={16} className="text-accent-400" />
                   {t.outline.oneSentence}
                </div>
                <textarea 
                   value={data.logline}
                   onChange={(e) => update({ logline: e.target.value })}
                   className="w-full p-4 text-sm text-ink-100 bg-ink-800 border border-ink-700 rounded-2xl focus:border-accent-500 outline-none transition-all resize-none h-24 shadow-inner"
                   placeholder="一个落魄画师意外得到了一支神笔..."
                />
                <button onClick={handleExpandLoglineToOutline} disabled={expandingTotal || !data.logline} className="w-full mt-4 flex items-center justify-center gap-2 bg-accent-500 text-white py-3 rounded-2xl text-xs font-bold hover:bg-accent-400 transition-all shadow-lg shadow-accent-950/20 disabled:opacity-40">
                   {expandingTotal ? <RefreshCw size={14} className="animate-spin" /> : <Wand2 size={14} />}
                   {expandingTotal ? t.outline.expanding : t.outline.expandOutline}
                </button>
             </div>

             <div className="p-5 border-b border-ink-700 flex items-center justify-between">
                <div className="font-bold text-ink-100 text-sm flex items-center gap-2 uppercase tracking-widest">
                   <BookOpen size={16} className="text-accent-400" /> {t.outline.totalOutline}
                </div>
                <button onClick={handleGenerateTotalOutline} disabled={generatingTotal} className="text-[10px] bg-accent-500/10 text-accent-400 px-3 py-1.5 rounded-lg font-bold border border-accent-500/20 hover:bg-accent-500 hover:text-white transition-all">
                   <Wand2 size={12} className={generatingTotal ? "animate-spin" : ""} /> {t.common.aiGenerate}
                </button>
             </div>
             
             <div className="flex-1 p-6 overflow-y-auto">
                 <textarea 
                    value={data.totalOutline || ''}
                    onChange={(e) => update({ totalOutline: e.target.value })}
                    className="w-full h-full min-h-[400px] resize-none bg-transparent outline-none text-ink-200 leading-relaxed text-sm placeholder-ink-600 font-sans"
                    placeholder="在此扩写故事总纲..."
                 />
             </div>

             <div className="p-5 border-t border-ink-700 bg-ink-950/30">
                <div className="flex items-center gap-2 mb-3 text-[10px] font-mono text-ink-400 uppercase tracking-[0.2em]">
                   <Layers size={12} /> {t.outline.breakdownSettings}
                </div>
                <div className="flex gap-3">
                   <div className="flex-1 bg-ink-800 border border-ink-700 rounded-xl flex items-center px-4 py-2">
                      <span className="text-[10px] font-bold text-ink-400 mr-2 uppercase">{t.outline.targetCount}</span>
                      <input type="number" min="1" max="100" value={targetCount} onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)} className="w-full text-sm font-bold text-ink-100 outline-none text-right bg-transparent" />
                   </div>
                   <button onClick={handleGenerateBreakdown} disabled={generatingBreakdown || !data.totalOutline} className="bg-accent-500 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-accent-400 transition-all shadow-lg disabled:opacity-30">
                      {generatingBreakdown ? <RefreshCw size={14} className="animate-spin" /> : t.outline.generateBreakdown}
                   </button>
                </div>
             </div>
         </div>

         {/* RIGHT PANEL */}
         <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-ink-950 transition-colors">
             <div className="h-16 border-b border-ink-700 bg-ink-900/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
                <h2 className="text-xl font-serif font-bold text-ink-100 flex items-center gap-3">
                   <List size={20} className="text-accent-400" /> {t.outline.episodeOutline}
                </h2>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-ink-800 px-4 py-1.5 rounded-xl border border-ink-700">
                        <select value={data.scriptFormat || ScriptFormat.MOVIE} onChange={(e) => handleFormatChange(e.target.value as ScriptFormat)} className="bg-transparent text-xs font-bold text-ink-100 outline-none cursor-pointer">
                            {Object.entries(t.outline.formats).map(([key, label]) => (
                                <option key={key} value={key}>{label as string}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex bg-ink-800 rounded-xl p-1 border border-ink-700 shadow-inner">
                        <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-accent-500 text-white shadow-lg' : 'text-ink-500'}`}><List size={16} /></button>
                        <button onClick={() => setViewMode('board')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'board' ? 'bg-accent-500 text-white shadow-lg' : 'text-ink-500'}`}><Columns size={16} /></button>
                    </div>
                </div>
             </div>

             <div className="flex-1 overflow-auto p-8">
                {viewMode === 'list' ? (
                    <div className="max-w-4xl mx-auto space-y-6 pb-24">
                    {data.outline.map((section, index) => {
                        const isExpanded = expandedSections.has(section.id);
                        return (
                        <div key={section.id} className="glass-card rounded-[32px] overflow-hidden border-ink-700">
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3 flex-1">
                                        <span className="bg-accent-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-accent-950/30">
                                            {getSectionLabel(index, data.scriptFormat)}
                                        </span>
                                        <input value={section.title} onChange={(e) => updateSection(section.id, 'title', e.target.value)} className="font-bold text-xl text-ink-100 bg-transparent outline-none w-full" />
                                    </div>
                                    <button onClick={() => update({ outline: data.outline.filter(s => s.id !== section.id) })} className="text-ink-600 hover:text-red-500 p-2 transition-colors"><Trash2 size={18}/></button>
                                </div>

                                <div className="mb-6 flex items-start gap-4 bg-accent-500/5 p-4 rounded-2xl border border-accent-500/10">
                                    <Clock size={16} className="text-accent-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-ink-300 font-medium leading-relaxed italic">{section.tips}</p>
                                </div>

                                <div className="relative">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-[10px] font-black text-ink-400 uppercase tracking-widest">CHAPTER SYNOPSIS</h4>
                                        <button onClick={() => handleGenerateSection(section.id, section.title)} className="text-[10px] flex items-center gap-2 text-accent-400 hover:text-accent-300 transition-colors uppercase font-bold"><Wand2 size={12}/> AI Refine</button>
                                    </div>
                                    <textarea 
                                        value={section.content}
                                        onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                                        className="w-full bg-ink-800/50 border border-ink-700 rounded-2xl p-5 text-sm text-ink-200 resize-none h-32 focus:border-accent-500 outline-none transition-all leading-relaxed"
                                        placeholder="描述本章核心情节与转折..."
                                    />
                                </div>

                                <div className="mt-6 pt-4 border-t border-ink-700 flex justify-center">
                                    <button onClick={() => setExpandedSections(prev => { const next = new Set(prev); if(next.has(section.id)) next.delete(section.id); else next.add(section.id); return next; })} className="flex items-center gap-2 text-[10px] font-black text-ink-500 hover:text-accent-400 transition-all uppercase tracking-[0.2em]">
                                        {isExpanded ? 'Collapse Matrix' : 'Expand Structure'}
                                        {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                    </button>
                                </div>
                            </div>
                            
                            {isExpanded && (
                                <div className="px-8 pb-8 bg-ink-950/30 border-t border-ink-700">
                                    <div className="pt-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-[10px] font-black text-ink-500 uppercase flex items-center gap-2 tracking-[0.3em]">
                                                <Layers size={14} className="text-accent-400" /> Structure Beats
                                            </h4>
                                        </div>
                                        {section.scenes.map((scene) => (
                                            <div key={scene.id} className="flex gap-3 mb-3 group">
                                                <div className="relative shrink-0 w-40 rounded-xl border border-accent-500/20 bg-accent-500/5 px-3 py-2 flex items-center">
                                                    <Tag size={12} className="mr-2 text-accent-500 opacity-50"/>
                                                    <input value={scene.title} onChange={(e) => updateScene(section.id, scene.id, 'title', e.target.value)} className="bg-transparent text-[10px] font-black text-accent-400 w-full outline-none uppercase tracking-tighter" />
                                                </div>
                                                <input value={scene.summary} onChange={(e) => updateScene(section.id, scene.id, 'summary', e.target.value)} className="flex-1 bg-ink-800 rounded-xl px-4 py-2 text-xs border border-ink-700 text-ink-100 focus:border-accent-500 outline-none transition-all" placeholder="输入具体的场景描述..." />
                                                <button onClick={() => update({ outline: data.outline.map(s => s.id === section.id ? { ...s, scenes: s.scenes.filter(sc => sc.id !== scene.id) } : s) })} className="opacity-0 group-hover:opacity-100 text-ink-600 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                                            </div>
                                        ))}
                                        <button onClick={() => update({ outline: data.outline.map(s => s.id === section.id ? { ...s, scenes: [...s.scenes, { id: crypto.randomUUID(), title: 'NEW BEAT', summary: '' }] } : s) })} className="text-[10px] font-black text-ink-500 hover:text-accent-400 flex items-center gap-2 mt-4 px-2 transition-all uppercase"><Plus size={14}/> Add Beats Node</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );})}
                    </div>
                ) : (
                    <div className="h-full flex gap-6 pb-6 overflow-x-auto min-w-full">
                    {data.outline.map((section, index) => (
                        <div key={section.id} className="w-80 shrink-0 glass-card rounded-[32px] border-ink-700 flex flex-col max-h-full">
                            <div className="p-5 border-b border-ink-700 bg-ink-950/20 flex justify-between items-start">
                                <div className="flex-1 mr-3">
                                    <div className="text-[9px] font-black text-accent-500 uppercase tracking-widest mb-1">
                                        {getSectionLabel(index, data.scriptFormat)}
                                    </div>
                                    <input value={section.title} onChange={(e) => updateSection(section.id, 'title', e.target.value)} className="font-bold text-sm text-ink-100 bg-transparent outline-none w-full" />
                                </div>
                                <button onClick={() => update({ outline: data.outline.filter(s => s.id !== section.id) })} className="text-ink-600 hover:text-red-500 p-1.5 transition-colors"><Trash2 size={16}/></button>
                            </div>
                            <div className="p-4 bg-ink-800/30">
                                <textarea value={section.content} onChange={(e) => updateSection(section.id, 'content', e.target.value)} className="w-full text-xs text-ink-300 bg-ink-800 border border-ink-700 rounded-xl p-3 resize-none h-24 outline-none focus:border-accent-500 leading-relaxed" placeholder="..." />
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[120px]">
                                {section.scenes.map((scene) => (
                                <div key={scene.id} className="bg-ink-800 p-4 rounded-2xl border border-ink-700 shadow-sm group relative hover:border-accent-500/50 transition-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <GripVertical size={14} className="text-ink-700 group-hover:text-accent-500 transition-colors" />
                                        <div className="text-[9px] font-black px-2 py-0.5 rounded border border-accent-500/30 bg-accent-500/5 text-accent-400 uppercase tracking-tighter truncate">{scene.title}</div>
                                    </div>
                                    <textarea value={scene.summary} onChange={(e) => updateScene(section.id, scene.id, 'summary', e.target.value)} className="w-full text-[10px] text-ink-400 bg-transparent rounded p-1 resize-none h-14 outline-none border-none leading-relaxed" />
                                    <button onClick={() => update({ outline: data.outline.map(s => s.id === section.id ? { ...s, scenes: s.scenes.filter(sc => sc.id !== scene.id) } : s) })} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-ink-500 hover:text-red-500 transition-all"><Trash2 size={12}/></button>
                                </div>
                                ))}
                                <button onClick={() => update({ outline: data.outline.map(s => s.id === section.id ? { ...s, scenes: [...s.scenes, { id: crypto.randomUUID(), title: 'NEW BEAT', summary: '' }] } : s) })} className="w-full py-4 border-2 border-dashed border-ink-700 rounded-2xl text-[10px] font-bold text-ink-600 hover:text-accent-400 hover:border-accent-500/30 transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                                    <Plus size={14}/> Add Beat
                                </button>
                            </div>
                        </div>
                    ))}
                    </div>
                )}
             </div>
         </div>
      </div>
    </div>
  );
};
