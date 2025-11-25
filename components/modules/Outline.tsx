
import React, { useState, useRef } from 'react';
import { ProjectData, OutlineScene, AppLanguage, ScriptFormat, OutlineSection } from '../../types';
import { GeminiService } from '../../services/geminiService';
import { Lightbulb, RefreshCw, Wand2, Plus, Trash2, GripVertical, Layout, List, Columns, Film, Tv, Smartphone, Clock, AlertTriangle, BookOpen, ChevronRight, Layers, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { getTranslation } from '../../utils/translations';

interface OutlineProps {
  data: ProjectData;
  update: (data: Partial<ProjectData>) => void;
  language: AppLanguage;
}

type ViewMode = 'list' | 'board';

// --- Structural Templates with Precise Timing ---
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
  const t = getTranslation(language);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [generatingTotal, setGeneratingTotal] = useState(false);
  const [generatingBreakdown, setGeneratingBreakdown] = useState(false);
  const [generatingSectionId, setGeneratingSectionId] = useState<string | null>(null);
  const [generatingBeatsId, setGeneratingBeatsId] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<ViewMode>('list'); // Default to list for clarity in this flow
  const [draggedScene, setDraggedScene] = useState<{ sectionId: string, sceneId: string } | null>(null);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  
  // Breakdown State
  const [targetCount, setTargetCount] = useState<number>(3);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // --- Helpers ---
  const getBeatBadgeColor = (title: string) => {
     const t = title.toLowerCase();
     if (t.includes('hook') || t.includes('黄金') || t.includes('climax') || t.includes('高潮')) return 'bg-red-50 text-red-600 border-red-100';
     if (t.includes('twist') || t.includes('反转')) return 'bg-purple-50 text-purple-600 border-purple-100';
     if (t.includes('setup') || t.includes('铺垫')) return 'bg-blue-50 text-blue-600 border-blue-100';
     return 'bg-ink-50 text-ink-600 border-ink-100';
  };

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
        newExpanded.delete(id);
    } else {
        newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  // --- Format Handling ---
  const handleFormatChange = (format: ScriptFormat) => {
    const hasContent = data.outline.some(s => s.content.length > 0 || s.scenes.length > 0);
    
    if (!hasContent || confirm("切换制式将重置当前的大纲结构，是否继续？(Switching formats will reset structure)")) {
       const template = OUTLINE_TEMPLATES[format] || OUTLINE_TEMPLATES[ScriptFormat.MOVIE];
       
       // Update default target count based on format
       if (format === ScriptFormat.MOVIE) setTargetCount(3);
       else if (format === ScriptFormat.TV_SERIES) setTargetCount(8); // Default 8 eps
       else if (format === ScriptFormat.SHORT_VIDEO) setTargetCount(1);
       
       const newOutline: OutlineSection[] = template.map(item => ({
         id: crypto.randomUUID(),
         title: item.title,
         tips: item.tips,
         content: '',
         scenes: []
       }));

       update({ 
         scriptFormat: format,
         outline: newOutline
       });
    }
  };

  const getFormatIcon = (fmt?: ScriptFormat) => {
    switch (fmt) {
      case ScriptFormat.SHORT_VIDEO: return <Smartphone size={16}/>;
      case ScriptFormat.TV_SERIES: return <Tv size={16}/>;
      case ScriptFormat.MOVIE: return <Film size={16}/>;
      default: return <Layout size={16}/>;
    }
  };

  const getSectionLabel = (index: number, format?: ScriptFormat) => {
     if (format === ScriptFormat.TV_SERIES || format === ScriptFormat.MID_FORM_SERIES || format === ScriptFormat.ANIMATION) {
        return `${t.outline.section} ${index + 1}`; // e.g. "Section 1" or "Part 1"
     }
     if (format === ScriptFormat.SHORT_VIDEO) {
        return `${t.outline.beat} ${index + 1}`;
     }
     return `${t.outline.act} ${index + 1}`;
  };

  // --- Data Updates ---
  const updateSection = (id: string, field: string, value: string) => {
    const updated = data.outline.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    );
    update({ outline: updated });
  };

  const addSection = () => {
    const newSection = {
      id: crypto.randomUUID(),
      title: '新章节',
      content: '',
      tips: '在此描述本章节的核心目标...',
      scenes: []
    };
    update({ outline: [...data.outline, newSection] });
  };

  const deleteSection = (id: string) => {
    if (confirm(t.common.confirm)) {
        const newOutline = data.outline.filter(s => s.id !== id);
        update({ outline: newOutline });
    }
  };

  const addScene = (sectionId: string) => {
    const updated = data.outline.map(s => {
      if (s.id === sectionId) {
        const newScene: OutlineScene = {
          id: crypto.randomUUID(),
          title: `功能/节拍 ${s.scenes.length + 1}`,
          summary: ''
        };
        return { ...s, scenes: [...s.scenes, newScene] };
      }
      return s;
    });
    update({ outline: updated });
  };

  const updateScene = (sectionId: string, sceneId: string, field: keyof OutlineScene, value: string) => {
    const updated = data.outline.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          scenes: s.scenes.map(scene => 
            scene.id === sceneId ? { ...scene, [field]: value } : scene
          )
        };
      }
      return s;
    });
    update({ outline: updated });
  };

  const deleteScene = (sectionId: string, sceneId: string) => {
    const updated = data.outline.map(s => {
      if (s.id === sectionId) {
        return { ...s, scenes: s.scenes.filter(scene => scene.id !== sceneId) };
      }
      return s;
    });
    update({ outline: updated });
  };

  // --- AI Actions ---
  const handleGenerateTotalOutline = async () => {
    setGeneratingTotal(true);
    try {
        const context = `Title: ${data.title}\nLogline: ${data.logline}\nGenre: ${data.genre}\nTarget Audience: ${data.marketAnalysis.targetAudience}`;
        const total = await GeminiService.generateTotalOutline(context, language);
        update({ totalOutline: total });
    } catch (e) {
        alert("Failed to generate total outline");
    } finally {
        setGeneratingTotal(false);
    }
  };

  const handleGenerateBreakdown = async () => {
    if (!data.totalOutline) {
        alert("请先填写或生成故事总纲。 (Please write or generate the Total Outline first.)");
        return;
    }
    
    const hasContent = data.outline.some(s => s.content.length > 0 || s.scenes.length > 0);
    if (hasContent && !confirm(t.outline.overwriteWarning)) {
        return;
    }

    setGeneratingBreakdown(true);
    try {
        const breakdown = await GeminiService.generateEpisodeBreakdown(
            data.totalOutline, 
            data.scriptFormat || ScriptFormat.MOVIE, 
            targetCount, 
            language
        );
        if (breakdown.length > 0) {
            update({ outline: breakdown });
            setExpandedSections(new Set()); // Collapse all initially
        } else {
            alert("Generation returned empty results.");
        }
    } catch (e) {
        alert("Failed to generate breakdown.");
    } finally {
        setGeneratingBreakdown(false);
    }
  };

  const handleGenerateSection = async (id: string, title: string) => {
    setGeneratingSectionId(id);
    try {
      const context = `
        Total Story Outline: ${data.totalOutline || ''}
        Format: ${data.scriptFormat}
        Title: ${data.title}
        Logline: ${data.logline}
        Genre: ${data.genre}
      `;
      const content = await GeminiService.generateOutlineSection(title, context, language);
      if (content) {
        updateSection(id, 'content', content);
      }
    } catch (e) {
      alert("Generation failed");
    } finally {
      setGeneratingSectionId(null);
    }
  };

  const handleGenerateBeats = async (section: OutlineSection) => {
    setGeneratingBeatsId(section.id);
    try {
        const beats = await GeminiService.generateEpisodeBeats(
            section.content,
            data.scriptFormat || ScriptFormat.MOVIE,
            language
        );
        
        const newScenes = beats.map(b => ({
            id: crypto.randomUUID(),
            title: b.title,
            summary: b.summary
        }));

        const updated = data.outline.map(s => 
            s.id === section.id ? { ...s, scenes: newScenes } : s
        );
        update({ outline: updated });
    } catch (e) {
        alert("Failed to generate structure beats.");
    } finally {
        setGeneratingBeatsId(null);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await GeminiService.analyzeOutline(data.outline, language);
      setAnalysis(result);
    } catch (e) {
      setAnalysis("Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  // --- Drag & Drop Handlers ---
  
  const handleSectionDrop = (targetSectionId: string) => {
    if (!draggedSection || draggedSection === targetSectionId) return;
    const items = [...data.outline];
    const dragIdx = items.findIndex(s => s.id === draggedSection);
    const targetIdx = items.findIndex(s => s.id === targetSectionId);
    
    const [removed] = items.splice(dragIdx, 1);
    items.splice(targetIdx, 0, removed);
    
    update({ outline: items });
    setDraggedSection(null);
  };

  const handleSceneDrop = (targetSectionId: string, targetSceneId?: string) => {
    if (!draggedScene) return;
    const { sectionId: srcSecId, sceneId: srcSceneId } = draggedScene;
    
    const newOutline = JSON.parse(JSON.stringify(data.outline));
    
    const srcSec = newOutline.find((s: any) => s.id === srcSecId);
    const sceneIdx = srcSec.scenes.findIndex((s: any) => s.id === srcSceneId);
    const [sceneToMove] = srcSec.scenes.splice(sceneIdx, 1);
    
    const targetSec = newOutline.find((s: any) => s.id === targetSectionId);
    
    if (targetSceneId) {
       const targetSceneIdx = targetSec.scenes.findIndex((s: any) => s.id === targetSceneId);
       targetSec.scenes.splice(targetSceneIdx, 0, sceneToMove);
    } else {
       targetSec.scenes.push(sceneToMove);
    }
    
    update({ outline: newOutline });
    setDraggedScene(null);
  };

  return (
    <div className="h-full flex flex-col bg-ink-50">
      <div className="flex-1 overflow-hidden flex flex-col xl:flex-row">
         
         {/* LEFT PANEL: Total Outline (Story Summary) */}
         <div className="w-full xl:w-96 flex flex-col border-r border-ink-200 bg-white shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
             <div className="p-4 border-b border-ink-200 flex items-center justify-between bg-ink-50">
                <div className="font-bold text-ink-800 flex items-center gap-2">
                   <BookOpen size={18} /> {t.outline.totalOutline}
                </div>
                <button 
                  onClick={handleGenerateTotalOutline}
                  disabled={generatingTotal}
                  className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-medium hover:bg-purple-200 flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                   <Wand2 size={12} className={generatingTotal ? "animate-spin" : ""} /> {t.common.aiGenerate}
                </button>
             </div>
             
             <div className="flex-1 p-4 overflow-y-auto">
                 <textarea 
                    value={data.totalOutline || ''}
                    onChange={(e) => update({ totalOutline: e.target.value })}
                    className="w-full h-full min-h-[300px] resize-none border-none outline-none text-ink-700 leading-relaxed text-sm bg-transparent placeholder-ink-300"
                    placeholder="在此撰写故事的总纲，包含起承转合的核心脉络..."
                 />
             </div>

             {/* Smart Breakdown Controls */}
             <div className="p-4 border-t border-ink-200 bg-ink-50">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-ink-500 uppercase tracking-wider">
                   <Layers size={12} /> {t.outline.breakdownSettings}
                </div>
                <div className="flex gap-2">
                   <div className="flex-1 bg-white border border-ink-300 rounded-lg flex items-center px-3 py-2 shadow-sm">
                      <span className="text-xs font-bold text-ink-600 mr-2 whitespace-nowrap">{t.outline.targetCount}</span>
                      <input 
                         type="number" 
                         min="1" 
                         max="100" 
                         value={targetCount}
                         onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
                         className="w-full text-sm font-bold text-ink-900 outline-none text-right bg-transparent"
                      />
                   </div>
                   <button 
                      onClick={handleGenerateBreakdown}
                      disabled={generatingBreakdown || !data.totalOutline}
                      className="bg-ink-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-accent-600 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                   >
                      <ChevronRight size={14} /> 
                      {generatingBreakdown ? t.common.loading : t.outline.generateBreakdown}
                   </button>
                </div>
             </div>
         </div>

         {/* RIGHT PANEL: Episode Breakdown (Existing Outline) */}
         <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-ink-50">
             {/* Header for Breakdown */}
             <div className="p-4 border-b border-ink-200 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                    <h2 className="text-xl font-serif font-bold text-ink-900">{t.outline.episodeOutline}</h2>
                    <p className="text-xs text-ink-500 mt-1">{t.outline.subtitle}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Format Selector */}
                    <div className="flex items-center gap-2 bg-ink-100 p-1.5 rounded-lg border border-ink-200 shadow-sm relative group">
                        <div className="text-xs font-bold text-ink-500 px-2 flex items-center gap-1 uppercase">
                        {getFormatIcon(data.scriptFormat)} {t.outline.format}
                        </div>
                        <div className="w-px h-4 bg-ink-300 mx-1"></div>
                        <select 
                        value={data.scriptFormat || ScriptFormat.MOVIE}
                        onChange={(e) => handleFormatChange(e.target.value as ScriptFormat)}
                        className="bg-transparent text-sm font-medium text-ink-800 focus:outline-none cursor-pointer pr-8 appearance-none min-w-[140px]"
                        style={{ backgroundImage: 'none' }}
                        >
                            {Object.entries(t.outline.formats).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 pointer-events-none text-ink-400">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1L5 5L9 1"/></svg>
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-ink-100 rounded-lg p-1 border border-ink-200">
                        <button 
                        onClick={() => setViewMode('list')} 
                        className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-ink-900' : 'text-ink-400 hover:text-ink-700'}`}
                        title="列表视图"
                        >
                        <List size={18} />
                        </button>
                        <button 
                        onClick={() => setViewMode('board')} 
                        className={`p-1.5 rounded transition-colors ${viewMode === 'board' ? 'bg-white shadow-sm text-ink-900' : 'text-ink-400 hover:text-ink-700'}`}
                        title="看板视图"
                        >
                        <Columns size={18} />
                        </button>
                    </div>
                    
                    <button 
                    onClick={addSection}
                    className="flex items-center gap-2 px-3 py-2 bg-ink-800 text-white rounded-lg hover:bg-ink-900 text-xs font-medium shadow-sm"
                    >
                    <Plus size={14}/> {t.common.add}
                    </button>
                </div>
             </div>

             {/* Content Area */}
             <div className="flex-1 overflow-auto p-6">
                {viewMode === 'list' ? (
                    <div className="max-w-4xl mx-auto space-y-6 pb-20">
                    {data.outline.map((section, index) => {
                        const isExpanded = expandedSections.has(section.id);
                        const hasScenes = section.scenes && section.scenes.length > 0;
                        const isGeneratingThis = generatingBeatsId === section.id;

                        return (
                        <div key={section.id} className="bg-white rounded-xl border border-ink-200 shadow-sm transition-shadow hover:shadow-md">
                            {/* Summary Header Area */}
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2 flex-1">
                                        <span className="bg-ink-100 text-ink-500 text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
                                        {getSectionLabel(index, data.scriptFormat)}
                                        </span>
                                        <input 
                                        value={section.title}
                                        onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                                        className="font-bold text-lg text-ink-800 bg-transparent outline-none focus:underline w-full"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => deleteSection(section.id)} className="text-ink-300 hover:text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                </div>

                                <div className="mb-4 flex items-start gap-2 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                    <Clock size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-800 font-medium">{section.tips}</p>
                                </div>

                                <div className="relative">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-xs font-bold text-ink-400 uppercase tracking-wide">本集摘要 (Summary)</h4>
                                        <button onClick={() => handleGenerateSection(section.id, section.title)} disabled={generatingSectionId === section.id} className="text-xs flex items-center gap-1 bg-purple-50 text-purple-600 px-2 py-0.5 rounded hover:bg-purple-100 transition-colors"><Wand2 size={12}/> AI 完善摘要</button>
                                    </div>
                                    <textarea 
                                        value={section.content}
                                        onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                                        className="w-full bg-ink-50 border-transparent rounded p-3 text-sm resize-none h-24 focus:bg-white focus:border-accent-500 border focus:outline-none transition-colors"
                                        placeholder="本节故事摘要..."
                                    />
                                </div>

                                <div className="mt-4 pt-4 border-t border-ink-100 flex justify-center">
                                    <button 
                                        onClick={() => toggleSection(section.id)}
                                        className="flex items-center gap-1 text-xs font-bold text-ink-400 hover:text-ink-700 transition-colors"
                                    >
                                        {isExpanded ? t.outline.collapse : t.outline.expand}
                                        {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Detailed Structure Area (Expandable) */}
                            {isExpanded && (
                                <div className="px-6 pb-6 bg-ink-50/50 rounded-b-xl border-t border-ink-100">
                                    <div className="pt-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-xs font-bold text-ink-400 uppercase flex items-center gap-2">
                                                <Layers size={12} /> {t.outline.sceneDetail} / 结构节拍
                                            </h4>
                                            {(!hasScenes && !isGeneratingThis) && (
                                                <button 
                                                    onClick={() => handleGenerateBeats(section)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold hover:bg-indigo-200 transition-colors"
                                                >
                                                    <Wand2 size={12} /> {t.outline.generateBeats}
                                                </button>
                                            )}
                                        </div>

                                        {isGeneratingThis && (
                                            <div className="py-8 flex flex-col items-center text-ink-400">
                                                <RefreshCw size={24} className="animate-spin mb-2 text-accent-500" />
                                                <p className="text-xs">{t.common.loading}</p>
                                            </div>
                                        )}

                                        {!isGeneratingThis && (
                                            <>
                                                {section.scenes.map((scene, sIdx) => (
                                                    <div key={scene.id} className="flex gap-2 mb-2 animate-fadeIn">
                                                        <div className={`relative shrink-0 w-32 rounded border px-2 py-1 flex items-center ${getBeatBadgeColor(scene.title)}`}>
                                                            <Tag size={10} className="mr-1 opacity-50"/>
                                                            <input 
                                                            value={scene.title} 
                                                            onChange={(e) => updateScene(section.id, scene.id, 'title', e.target.value)} 
                                                            className="bg-transparent text-xs font-bold w-full outline-none" 
                                                            placeholder="功能/节拍" 
                                                            />
                                                        </div>
                                                        <input value={scene.summary} onChange={(e) => updateScene(section.id, scene.id, 'summary', e.target.value)} className="flex-[2] bg-white rounded px-2 py-1 text-xs border border-ink-200 focus:border-accent-500 outline-none" placeholder="场景描述" />
                                                        <button onClick={() => deleteScene(section.id, scene.id)} className="text-ink-300 hover:text-red-500"><Trash2 size={12}/></button>
                                                    </div>
                                                ))}
                                                <button onClick={() => addScene(section.id)} className="text-xs text-ink-500 hover:text-accent-600 flex items-center gap-1 mt-3 px-1"><Plus size={12}/> {t.outline.addScene}</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );})}
                    </div>
                ) : (
                    <div className="h-full flex gap-4 pb-4 overflow-x-auto min-w-full">
                    {data.outline.map((section, index) => (
                        <div 
                            key={section.id} 
                            className="w-80 shrink-0 bg-ink-100/50 rounded-xl border border-ink-200 flex flex-col max-h-full"
                            draggable
                            onDragStart={() => setDraggedSection(section.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleSectionDrop(section.id)}
                        >
                            <div className="p-3 border-b border-ink-200 bg-white/50 rounded-t-xl flex justify-between items-start cursor-grab active:cursor-grabbing group">
                                <div className="flex-1 mr-2">
                                <div className="text-[10px] font-bold text-ink-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    {getSectionLabel(index, data.scriptFormat)}
                                </div>
                                <input 
                                    value={section.title}
                                    onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                                    className="font-bold text-sm text-ink-800 bg-transparent outline-none w-full"
                                />
                                </div>
                                <button 
                                    onPointerDown={(e) => e.stopPropagation()} 
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }} 
                                    className="text-ink-300 hover:text-red-500 p-1 hover:bg-ink-100 rounded"
                                >
                                    <Trash2 size={14}/>
                                </button>
                            </div>

                            {section.tips && (
                                <div className="px-3 py-2 bg-amber-50/50 border-b border-amber-100/50 flex items-start gap-1">
                                    <Clock size={10} className="text-amber-600 mt-0.5 shrink-0" />
                                    <p className="text-[10px] text-amber-700 leading-tight font-medium">{section.tips}</p>
                                </div>
                            )}

                            <div className="p-3 bg-white/30 border-b border-ink-200">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] text-ink-400 flex items-center gap-1"><Lightbulb size={10}/> Summary</span>
                                    <button onClick={() => handleGenerateSection(section.id, section.title)} disabled={generatingSectionId === section.id} className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded hover:bg-purple-200 flex items-center gap-1"><Wand2 size={10} className={generatingSectionId === section.id ? "animate-spin" : ""}/> AI</button>
                                </div>
                                <textarea 
                                    value={section.content}
                                    onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                                    className="w-full text-xs text-ink-600 bg-white rounded border border-ink-200 p-2 resize-none h-20 outline-none focus:border-accent-500"
                                    placeholder="..."
                                />
                            </div>

                            <div 
                            className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => { e.stopPropagation(); handleSceneDrop(section.id); }}
                            >
                                <div className="flex justify-between items-center px-1 mb-1">
                                    <span className="text-[10px] font-bold text-ink-400">STRUCTURE</span>
                                    <button onClick={() => handleGenerateBeats(section)} className="text-[10px] text-indigo-600 flex items-center gap-1"><Wand2 size={10}/> Gen</button>
                                </div>
                                {section.scenes.map((scene) => (
                                <div 
                                    key={scene.id} 
                                    className="bg-white p-3 rounded-lg border border-ink-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-accent-400 transition-colors group relative"
                                    draggable
                                    onDragStart={(e) => { e.stopPropagation(); setDraggedScene({ sectionId: section.id, sceneId: scene.id }); }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => { e.stopPropagation(); handleSceneDrop(section.id, scene.id); }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <GripVertical size={12} className="text-ink-300" />
                                        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide truncate max-w-[120px] ${getBeatBadgeColor(scene.title)}`}>
                                            {scene.title}
                                        </div>
                                    </div>
                                    <textarea 
                                        value={scene.summary} 
                                        onChange={(e) => updateScene(section.id, scene.id, 'summary', e.target.value)}
                                        className="w-full text-[10px] text-ink-500 bg-ink-50 rounded p-1 resize-none h-12 outline-none border border-transparent focus:bg-white focus:border-ink-200"
                                        placeholder="Detail..."
                                    />
                                    <button onClick={() => deleteScene(section.id, scene.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-ink-300 hover:text-red-500 transition-opacity"><Trash2 size={12}/></button>
                                </div>
                                ))}
                                <button onClick={() => addScene(section.id)} className="w-full py-2 border border-dashed border-ink-300 rounded-lg text-xs text-ink-400 hover:bg-white hover:text-accent-600 transition-colors flex items-center justify-center gap-1"><Plus size={12}/> {t.outline.addScene}</button>
                            </div>
                        </div>
                    ))}
                    <div className="w-80 shrink-0 flex items-center justify-center border-2 border-dashed border-ink-200 rounded-xl bg-ink-50/50 hover:bg-ink-100 transition-colors cursor-pointer" onClick={addSection}>
                        <div className="text-center text-ink-400">
                            <Plus size={32} className="mx-auto mb-2 opacity-50"/>
                            <p>{t.common.add}</p>
                        </div>
                    </div>
                    </div>
                )}
             </div>
         </div>

         {/* Sidebar: Diagnostics (Hidden on small screens) */}
         <div className="w-72 bg-white border-l border-ink-200 p-6 hidden 2xl:block overflow-y-auto shrink-0">
             <div className="mb-6">
                <h3 className="font-bold text-ink-800 text-sm mb-2">{t.outline.aiDiagnose}</h3>
                <button 
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 py-2 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors"
                >
                   <RefreshCw size={14} className={analyzing ? "animate-spin" : ""} />
                   {t.common.aiGenerate}
                </button>
             </div>
             {analysis && (
                <div className="text-xs text-ink-600 bg-ink-50 p-3 rounded-lg border border-ink-100 leading-relaxed whitespace-pre-wrap animate-fadeIn">
                   {analysis}
                </div>
             )}
         </div>
      </div>
    </div>
  );
};
