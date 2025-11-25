
import React, { useState } from 'react';
import { ProjectData, NovelChapter, ScriptBlock, ScriptBlockType, AppLanguage } from '../../types';
import { GeminiService } from '../../services/geminiService';
import { Plus, Trash2, Wand2, ArrowRight, BookText, FileText, CheckCircle2, User, Search, List, LayoutTemplate, MessageSquare, Clapperboard } from 'lucide-react';
import { getTranslation } from '../../utils/translations';

interface NovelAdaptationProps {
  data: ProjectData;
  update: (data: Partial<ProjectData>, saveHistory?: boolean) => void;
  language: AppLanguage;
}

type TabType = 'edit' | 'analysis';
type PreviewMode = 'text' | 'structure';

export const NovelAdaptationModule: React.FC<NovelAdaptationProps> = ({ data, update, language }) => {
  const t = getTranslation(language);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(
    data.novelChapters.length > 0 ? data.novelChapters[0].id : null
  );
  const [isConverting, setIsConverting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('edit');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('structure');

  const activeChapter = data.novelChapters.find(c => c.id === activeChapterId);

  const addChapter = () => {
    const newChapter: NovelChapter = {
      id: crypto.randomUUID(),
      title: `${t.novel.title} ${data.novelChapters.length + 1}`,
      content: '',
      convertedBlocks: []
    };
    const updatedChapters = [...data.novelChapters, newChapter];
    update({ novelChapters: updatedChapters });
    setActiveChapterId(newChapter.id);
  };

  const deleteChapter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedChapters = data.novelChapters.filter(c => c.id !== id);
    update({ novelChapters: updatedChapters });
    if (activeChapterId === id) {
      setActiveChapterId(updatedChapters.length > 0 ? updatedChapters[0].id : null);
    }
  };

  const updateChapter = (id: string, updates: Partial<NovelChapter>) => {
    const updatedChapters = data.novelChapters.map(c => 
      c.id === id ? { ...c, ...updates } : c
    );
    update({ novelChapters: updatedChapters });
  };

  const handleAnalyze = async () => {
    if (!activeChapter || !activeChapter.content.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await GeminiService.analyzeNovelText(activeChapter.content, language);
      if (result) {
        updateChapter(activeChapter.id, { analysis: result });
        setActiveTab('analysis');
      }
    } catch (e) {
      alert("分析失败");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConvert = async () => {
    if (!activeChapter || !activeChapter.content.trim()) return;
    setIsConverting(true);
    try {
      const scriptBlocks = await GeminiService.adaptNovelToScript(activeChapter.content, language);
      updateChapter(activeChapter.id, { convertedBlocks: scriptBlocks });
      setPreviewMode('structure');
    } catch (e) {
      alert("转换失败");
    } finally {
      setIsConverting(false);
    }
  };

  const handleImportToScript = () => {
    if (!activeChapter || !activeChapter.convertedBlocks) return;
    const newBlocks = activeChapter.convertedBlocks.map(b => ({
      ...b,
      id: crypto.randomUUID()
    }));
    update({ script: [...data.script, ...newBlocks] }, true);
    alert("已导入到剧本");
  };

  const getClassForType = (type: ScriptBlockType) => {
    switch (type) {
      case ScriptBlockType.SCENE_HEADING: return "font-bold text-ink-900 bg-ink-200 py-1 px-2 mb-2 uppercase text-xs";
      case ScriptBlockType.ACTION: return "text-ink-800 text-xs mb-2";
      case ScriptBlockType.CHARACTER: return "font-bold text-ink-800 text-center mt-3 text-xs uppercase";
      case ScriptBlockType.DIALOGUE: return "text-ink-800 text-center w-3/4 mx-auto text-xs mb-1";
      case ScriptBlockType.PARENTHETICAL: return "text-ink-500 text--[10px] text-center italic";
      default: return "text-xs mb-1";
    }
  };

  const renderStructureView = (blocks: ScriptBlock[]) => {
    const scenes: { heading: ScriptBlock | null; body: ScriptBlock[] }[] = [];
    let currentScene: { heading: ScriptBlock | null; body: ScriptBlock[] } | null = null;

    blocks.forEach(block => {
      if (block.type === ScriptBlockType.SCENE_HEADING) {
        if (currentScene) scenes.push(currentScene);
        currentScene = { heading: block, body: [] };
      } else {
        if (!currentScene) currentScene = { heading: null, body: [] };
        currentScene.body.push(block);
      }
    });
    if (currentScene) scenes.push(currentScene);

    return (
      <div className="space-y-6 pb-20">
        {scenes.map((scene, idx) => {
          const uniqueChars = Array.from(new Set(
            scene.body.filter(b => b.type === ScriptBlockType.CHARACTER).map(b => b.content)
          ));
          const actionCount = scene.body.filter(b => b.type === ScriptBlockType.ACTION).length;
          const dialogueCount = scene.body.filter(b => b.type === ScriptBlockType.DIALOGUE).length;
          const total = actionCount + dialogueCount || 1;
          const actionPercent = Math.round((actionCount / total) * 100);

          return (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-ink-200 overflow-hidden">
              <div className="bg-ink-900 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="bg-accent-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">场景 {idx + 1}</span>
                  <span className="font-bold text-sm truncate uppercase">{scene.heading?.content || '未知场景'}</span>
                </div>
              </div>

              <div className="bg-ink-50 px-4 py-2 flex items-center justify-between border-b border-ink-100 text-[10px] text-ink-500">
                 <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1"><Clapperboard size={10}/> {actionCount} 动作</span>
                    <span className="flex items-center gap-1"><MessageSquare size={10}/> {dialogueCount} 对白</span>
                 </div>
                 <div className="flex items-center gap-1">
                   <div className="w-16 h-1.5 bg-ink-200 rounded-full overflow-hidden flex">
                      <div className="bg-blue-400 h-full" style={{ width: `${actionPercent}%` }}></div>
                      <div className="bg-green-400 h-full" style={{ width: `${100 - actionPercent}%` }}></div>
                   </div>
                 </div>
              </div>

              <div className="p-4 space-y-3">
                 {uniqueChars.length > 0 && (
                   <div className="flex flex-wrap gap-1.5 mb-3">
                      {uniqueChars.map((char, cIdx) => (
                        <span key={cIdx} className="px-2 py-0.5 bg-ink-100 text-ink-600 rounded text-[10px] font-bold flex items-center gap-1">
                           <User size={10} /> {char}
                        </span>
                      ))}
                   </div>
                 )}
                 <div className="space-y-2 relative">
                    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-ink-100"></div>
                    {scene.body.map((block, bIdx) => {
                      if (block.type === ScriptBlockType.ACTION) {
                        return (
                          <div key={bIdx} className="pl-8 relative">
                             <div className="absolute left-[9px] top-2 w-1.5 h-1.5 rounded-full bg-blue-300"></div>
                             <div className="text-xs text-ink-700 leading-relaxed">{block.content}</div>
                          </div>
                        );
                      }
                      if (block.type === ScriptBlockType.DIALOGUE) {
                        const charName = scene.body[bIdx - 1]?.type === ScriptBlockType.CHARACTER ? scene.body[bIdx-1].content : "???";
                        return (
                          <div key={bIdx} className="pl-8 relative mt-1">
                             <div className="absolute left-[9px] top-2 w-1.5 h-1.5 rounded-full bg-green-300"></div>
                             <div className="bg-ink-50 p-2 rounded-lg rounded-tl-none border border-ink-100 text-xs text-ink-800">
                                <span className="font-bold text-ink-500 text-[10px] uppercase block mb-0.5">{charName}</span>
                                {block.content}
                             </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-64 bg-ink-50 border-r border-ink-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-ink-200 flex items-center justify-between">
          <h2 className="font-bold text-ink-800 flex items-center gap-2">
            <BookText size={18} /> {t.novel.title}
          </h2>
          <button onClick={addChapter} className="p-1 hover:bg-ink-200 rounded text-ink-600">
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {data.novelChapters.map(chapter => (
            <div 
              key={chapter.id}
              onClick={() => setActiveChapterId(chapter.id)}
              className={`p-3 rounded-lg cursor-pointer group flex items-center justify-between text-sm transition-colors
                ${activeChapterId === chapter.id ? 'bg-white shadow-sm border border-ink-200 font-medium text-ink-900' : 'text-ink-600 hover:bg-ink-100'}
              `}
            >
              <span className="truncate">{chapter.title}</span>
              <button 
                onClick={(e) => deleteChapter(chapter.id, e)}
                className="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-red-500 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {data.novelChapters.length === 0 && (
            <div className="p-4 text-center text-xs text-ink-400">
              {t.novel.addChapter}
            </div>
          )}
        </div>
      </div>

      {activeChapter ? (
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col border-r border-ink-200 min-w-0 bg-white">
             <div className="h-12 border-b border-ink-100 flex items-center justify-between px-4 bg-white shrink-0">
               <div className="flex items-center gap-1 bg-ink-100 p-0.5 rounded-lg">
                  <button onClick={() => setActiveTab('edit')} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'edit' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}>{t.novel.textEdit}</button>
                  <button onClick={() => setActiveTab('analysis')} className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${activeTab === 'analysis' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}><Search size={12}/> {t.novel.analysis}</button>
               </div>
               <div className="flex items-center gap-2">
                 <input value={activeChapter.title} onChange={(e) => updateChapter(activeChapter.id, { title: e.target.value })} className="font-bold text-ink-800 bg-transparent outline-none focus:text-accent-600 text-right w-40 text-sm" />
               </div>
             </div>

             {activeTab === 'edit' ? (
               <>
                <textarea value={activeChapter.content} onChange={(e) => updateChapter(activeChapter.id, { content: e.target.value })} className="flex-1 resize-none p-6 outline-none text-ink-700 leading-relaxed bg-ink-50/30 focus:bg-white transition-colors" placeholder="..." />
                <div className="p-4 border-t border-ink-200 bg-white flex justify-end gap-3">
                   <button onClick={handleAnalyze} disabled={isAnalyzing || !activeChapter.content} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-xs font-medium disabled:opacity-50"><Search size={14} className={isAnalyzing ? "animate-spin" : ""} /> {t.novel.aiBreakdown}</button>
                   <button onClick={handleConvert} disabled={isConverting || !activeChapter.content} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-ink-800 to-ink-900 text-white rounded-lg shadow-md hover:opacity-90 transition-opacity text-xs font-medium disabled:opacity-50"><Wand2 size={14} className={isConverting ? "animate-spin" : ""} /> {t.novel.toScript}</button>
                </div>
               </>
             ) : (
               <div className="flex-1 overflow-y-auto p-6 bg-ink-50/30">
                 {activeChapter.analysis ? (
                   <div className="space-y-6">
                      <div className="bg-white p-4 rounded-xl border border-ink-200 shadow-sm">
                        <h3 className="text-xs font-bold text-ink-400 uppercase tracking-widest mb-2 flex items-center gap-2"><BookText size={14}/> 核心摘要 (Summary)</h3>
                        <p className="text-sm text-ink-700 leading-relaxed">{activeChapter.analysis.summary}</p>
                        <div className="mt-3 flex gap-2 flex-wrap">{activeChapter.analysis.themes?.map((tag, i) => (<span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] rounded-full border border-purple-100">#{tag}</span>))}</div>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-ink-400 uppercase tracking-widest mb-3 flex items-center gap-2"><User size={14}/> 主要角色 (Characters)</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                           {activeChapter.analysis.characters.map((char, idx) => (
                             <div key={idx} className="bg-white p-3 rounded-lg border border-ink-200 flex items-start gap-3 hover:border-accent-300 transition-colors">
                                <div className="w-8 h-8 rounded-full bg-ink-100 flex items-center justify-center text-ink-500 font-serif font-bold shrink-0">{char.name[0]}</div>
                                <div><div className="flex items-center gap-2 mb-1"><span className="font-bold text-ink-800 text-sm">{char.name}</span><span className="text-[10px] px-1.5 py-0.5 bg-ink-100 text-ink-500 rounded">{char.role}</span></div><p className="text-xs text-ink-500">{char.trait}</p></div>
                             </div>
                           ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-ink-400 uppercase tracking-widest mb-3 flex items-center gap-2"><List size={14}/> 故事线 (Storylines)</h3>
                        <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">{activeChapter.analysis.storylines.map((line, idx) => (<div key={idx} className="p-3 border-b border-ink-100 last:border-0 flex gap-3 text-sm text-ink-700 hover:bg-ink-50"><span className="text-accent-500 font-mono font-bold">{String(idx + 1).padStart(2, '0')}</span>{line}</div>))}</div>
                      </div>
                   </div>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-ink-400">
                      <Search size={48} className="mx-auto mb-4 opacity-20" />
                      <button onClick={handleAnalyze} className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors">开始分析</button>
                   </div>
                 )}
               </div>
             )}
          </div>

          <div className="flex-1 flex flex-col bg-ink-100 min-w-0 border-l border-ink-200">
            <div className="h-12 border-b border-ink-200 px-4 flex items-center justify-between bg-ink-50 shrink-0">
               <div className="flex items-center gap-2 text-ink-600 font-medium text-sm">
                 {previewMode === 'text' ? <FileText size={16} /> : <LayoutTemplate size={16} />}
                 {previewMode === 'text' ? t.novel.preview : t.novel.structure}
               </div>

               <div className="flex items-center gap-2">
                 <div className="flex items-center bg-white border border-ink-200 rounded-lg p-0.5 mr-2">
                    <button onClick={() => setPreviewMode('structure')} className={`p-1.5 rounded transition-colors ${previewMode === 'structure' ? 'bg-ink-100 text-ink-900' : 'text-ink-400 hover:text-ink-700'}`} title="结构视图"><LayoutTemplate size={14} /></button>
                    <button onClick={() => setPreviewMode('text')} className={`p-1.5 rounded transition-colors ${previewMode === 'text' ? 'bg-ink-100 text-ink-900' : 'text-ink-400 hover:text-ink-700'}`} title="文本视图"><FileText size={14} /></button>
                 </div>
                 {activeChapter.convertedBlocks && activeChapter.convertedBlocks.length > 0 && (
                   <button onClick={handleImportToScript} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-ink-300 text-ink-700 rounded shadow-sm text-xs hover:bg-ink-50 hover:text-accent-600 font-medium transition-colors">
                     <CheckCircle2 size={14} /> {t.novel.apply}
                   </button>
                 )}
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {activeChapter.convertedBlocks && activeChapter.convertedBlocks.length > 0 ? (
                previewMode === 'text' ? (
                  <div className="bg-white shadow-lg p-8 min-h-full font-mono text-sm">
                     {activeChapter.convertedBlocks.map(block => (
                       <div key={block.id} className={getClassForType(block.type)}>
                         {block.content}
                       </div>
                     ))}
                  </div>
                ) : (
                  renderStructureView(activeChapter.convertedBlocks)
                )
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-ink-400">
                   <ArrowRight size={32} className="mb-2 opacity-30" />
                   <p className="text-sm">点击 "转为剧本"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-ink-50 text-ink-400">
           <div className="text-center">
             <BookText size={48} className="mx-auto mb-4 opacity-20" />
             <p>{t.novel.addChapter}</p>
           </div>
        </div>
      )}
    </div>
  );
};
