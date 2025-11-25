
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { ProjectData, ScriptBlock, ScriptBlockType, AppLanguage } from '../../types';
import { GeminiService } from '../../services/geminiService';
import { Wand2, Plus, Download, Type, Undo, Redo, MessageSquarePlus, FileUp, X, Clapperboard, MousePointer2, CheckSquare } from 'lucide-react';
import { getTranslation } from '../../utils/translations';

interface ScriptEditorProps {
  data: ProjectData;
  update: (data: Partial<ProjectData>, saveHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  language: AppLanguage;
}

const getClassForType = (type: ScriptBlockType) => {
  switch (type) {
    case ScriptBlockType.SCENE_HEADING: 
      return "font-bold text-lg text-ink-900 mt-10 mb-4 pt-2 border-b-2 border-ink-100 pb-2 uppercase tracking-wide bg-ink-50/50 px-2";
    case ScriptBlockType.ACTION: 
      return "text-ink-800 text-base mb-4 leading-8 text-justify";
    case ScriptBlockType.CHARACTER: 
      return "font-bold text-ink-900 text-base text-center mt-6 mb-1 w-full"; // Reduced bottom margin to stick to dialogue
    case ScriptBlockType.DIALOGUE: 
      return "text-ink-800 text-base text-justify w-[85%] mx-auto mb-4 leading-7";
    case ScriptBlockType.PARENTHETICAL: 
      return "text-ink-500 text-sm text-center italic mb-0 w-[70%] mx-auto";
    case ScriptBlockType.TRANSITION: 
      return "font-bold text-ink-800 uppercase text-right mt-6 mb-6 pr-4";
    default: 
      return "";
  }
};

interface ScriptBlockItemProps {
  block: ScriptBlock;
  updateBlock: (id: string, content: string) => void;
  addBlock: (type: ScriptBlockType, content?: string, afterId?: string) => void;
  deleteBlock: (id: string) => void;
  onFocus: (id: string) => void;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
}

const ScriptBlockItem: React.FC<ScriptBlockItemProps> = ({ 
  block, updateBlock, addBlock, deleteBlock, onFocus, 
  selectionMode, isSelected, onToggleSelection 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useLayoutEffect(() => {
    adjustHeight();
  }, [block.content, block.type]);

  const handleClick = (e: React.MouseEvent) => {
    if (selectionMode) {
      e.preventDefault(); // Prevent focus in selection mode
      onToggleSelection(block.id);
    }
  };

  return (
    <div 
      className={`group relative transition-all duration-200 rounded px-2 -mx-2 
        ${isSelected ? 'bg-accent-50/80 ring-2 ring-accent-200' : 'hover:bg-ink-50/50'}
        ${block.type === ScriptBlockType.SCENE_HEADING ? 'mt-2' : ''}
      `}
      onClick={handleClick}
    >
      <div className="absolute -left-20 top-0 bottom-0 w-16 flex flex-col items-end justify-start pt-2 opacity-0 group-hover:opacity-100 transition-opacity gap-1 pr-3 select-none">
         <div className="text-[10px] text-ink-300 font-sans uppercase tracking-wider font-bold text-right leading-tight">
            {(block.type || 'ACTION').replace('_', ' ')}
         </div>
         {!selectionMode && (
           <button onClick={() => deleteBlock(block.id)} className="text-ink-300 hover:text-red-400 p-1 rounded hover:bg-red-50 transition-colors">
              <Type size={12}/>
           </button>
         )}
      </div>

      {selectionMode && isSelected && (
        <div className="absolute -right-10 top-1/2 transform -translate-y-1/2 text-accent-500 animate-in fade-in zoom-in duration-200">
           <CheckSquare size={20} />
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={block.content}
        readOnly={selectionMode} // Read-only when selecting
        onChange={(e) => {
          updateBlock(block.id, e.target.value);
          adjustHeight();
        }}
        onFocus={() => {
          if (!selectionMode) onFocus(block.id);
        }}
        onKeyDown={(e) => {
          if (selectionMode) return;
          if(e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (block.type === ScriptBlockType.SCENE_HEADING) addBlock(ScriptBlockType.ACTION, '', block.id);
            else if (block.type === ScriptBlockType.CHARACTER) addBlock(ScriptBlockType.DIALOGUE, '', block.id);
            else if (block.type === ScriptBlockType.DIALOGUE) addBlock(ScriptBlockType.CHARACTER, '', block.id);
            else addBlock(ScriptBlockType.ACTION, '', block.id);
          }
          if(e.key === 'Backspace' && block.content === '') {
            e.preventDefault();
            deleteBlock(block.id);
          }
        }}
        className={`w-full bg-transparent resize-none outline-none overflow-hidden whitespace-pre-wrap break-words font-serif ${getClassForType(block.type)} ${selectionMode ? 'cursor-pointer' : ''}`}
        placeholder={block.type === ScriptBlockType.SCENE_HEADING ? "1. 场景标题" : ""}
        rows={1}
        style={{ minHeight: '1.5em' }}
      />
    </div>
  );
};

export const ScriptEditor: React.FC<ScriptEditorProps> = ({ data, update, undo, redo, language }) => {
  const t = getTranslation(language);
  const [generating, setGenerating] = useState(false);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  
  // Selection Mode State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastTypeTime = useRef<number>(Date.now());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const addBlock = (type: ScriptBlockType, content: string = '', afterId?: string) => {
    const newBlock: ScriptBlock = {
      id: crypto.randomUUID(),
      type,
      content
    };

    if (afterId) {
      const index = data.script.findIndex(b => b.id === afterId);
      if (index !== -1) {
        const newScript = [...data.script];
        newScript.splice(index + 1, 0, newBlock);
        update({ script: newScript }, true);
        return;
      }
    }
    
    update({ script: [...data.script, newBlock] }, true);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleInsertDialogueSequence = () => {
    const targetId = focusedBlockId;
    if (!targetId) return;

    const index = data.script.findIndex(b => b.id === targetId);
    if (index === -1) return;

    const charBlock: ScriptBlock = {
      id: crypto.randomUUID(),
      type: ScriptBlockType.CHARACTER,
      content: 'CHARACTER'
    };
    const dialBlock: ScriptBlock = {
      id: crypto.randomUUID(),
      type: ScriptBlockType.DIALOGUE,
      content: 'Dialogue'
    };

    const newScript = [...data.script];
    newScript.splice(index + 1, 0, charBlock, dialBlock);
    
    update({ script: newScript }, true);
  };

  const updateBlock = (id: string, content: string) => {
    const now = Date.now();
    const shouldSave = now - lastTypeTime.current > 1000;
    
    const updated = data.script.map(b => 
      b.id === id ? { ...b, content } : b
    );
    update({ script: updated }, shouldSave);
    lastTypeTime.current = now;
  };

  const deleteBlock = (id: string) => {
    update({ script: data.script.filter(b => b.id !== id) }, true);
  };

  const handleAIContinue = async () => {
    setGenerating(true);
    const sceneContext = data.outline.find(o => o.title.includes("Act"))?.content || "Generic Scene";
    const newBlocks = await GeminiService.continueScript(data.script, sceneContext, language);
    if (newBlocks.length > 0) {
      update({ script: [...data.script, ...newBlocks] }, true);
    }
    setGenerating(false);
  };

  const handleToggleSelection = (id: string) => {
     const newSet = new Set(selectedBlockIds);
     if (newSet.has(id)) {
        newSet.delete(id);
     } else {
        newSet.add(id);
     }
     setSelectedBlockIds(newSet);
  };

  const handleAutoStoryboard = async () => {
    setGenerating(true);
    try {
      // If selection exists, only process selected blocks. Otherwise, confirm process all.
      let blocksToProcess = data.script;
      if (selectedBlockIds.size > 0) {
          blocksToProcess = data.script.filter(b => selectedBlockIds.has(b.id));
      } else {
          if (!confirm("未选择任何范围，将为所有脚本生成分镜（可能耗时较长），是否继续？\n(No range selected. Generate for ALL blocks?)")) {
             setGenerating(false);
             return;
          }
      }

      const results = await GeminiService.analyzeScriptForStoryboard(blocksToProcess, language);
      const newScript = data.script.map(b => {
         if (results[b.id]) {
            return {
               ...b,
               storyboard: {
                  ...b.storyboard,
                  ...results[b.id]
               }
            };
         }
         return b;
      });
      update({ script: newScript }, true);
      
      // Clear selection after generation
      if (selectionMode) {
          setSelectionMode(false);
          setSelectedBlockIds(new Set());
      }
    } catch (e) {
      alert("Auto Storyboard failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = () => {
    let content = "";
    data.script.forEach(block => {
      const text = block.content.trim();
      if (!text && block.type !== ScriptBlockType.ACTION) return;
      switch (block.type) {
        case ScriptBlockType.SCENE_HEADING: content += `\n\n.${text.toUpperCase()}\n`; break;
        case ScriptBlockType.ACTION: content += `\n${text}\n`; break;
        case ScriptBlockType.CHARACTER: content += `\n\n${text.toUpperCase()}\n`; break;
        case ScriptBlockType.DIALOGUE: content += `${text}\n`; break;
        case ScriptBlockType.PARENTHETICAL: content += `${text}\n`; break;
        case ScriptBlockType.TRANSITION: content += `\n\n> ${text.toUpperCase()}\n`; break;
        default: content += `\n${text}\n`;
      }
    });
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.title.replace(/\s+/g, '_') || 'script'}.fountain`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parseFountain = (text: string): ScriptBlock[] => {
    const lines = text.split(/\r?\n/);
    const blocks: ScriptBlock[] = [];
    let isDialogue = false;
    let lastLineWasEmpty = true;
    const sceneRegex = /^(INT|EXT|EST|I\/E|INT\/EXT)/i;
    const transitionRegex = /TO:$/;
    
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) { lastLineWasEmpty = true; isDialogue = false; continue; }

      let type: ScriptBlockType = ScriptBlockType.ACTION;
      let content = line;

      if (line.startsWith('.')) { type = ScriptBlockType.SCENE_HEADING; content = line.substring(1).trim(); isDialogue = false; } 
      else if (line.startsWith('>')) { type = ScriptBlockType.TRANSITION; content = line.substring(1).trim(); isDialogue = false; }
      else if (sceneRegex.test(line)) { type = ScriptBlockType.SCENE_HEADING; isDialogue = false; }
      else if (transitionRegex.test(line) && line === line.toUpperCase()) { type = ScriptBlockType.TRANSITION; isDialogue = false; }
      else if (lastLineWasEmpty && line === line.toUpperCase() && /[A-Z]/.test(line)) { type = ScriptBlockType.CHARACTER; isDialogue = true; }
      else if (isDialogue && line.startsWith('(') && line.endsWith(')')) { type = ScriptBlockType.PARENTHETICAL; }
      else if (isDialogue) { type = ScriptBlockType.DIALOGUE; }
      else { type = ScriptBlockType.ACTION; isDialogue = false; }

      blocks.push({ id: crypto.randomUUID(), type, content });
      lastLineWasEmpty = false;
    }
    return blocks;
  };

  const handleImport = (replace: boolean) => {
    const newBlocks = parseFountain(importText);
    if (newBlocks.length === 0) {
      alert("解析 Fountain 文本出错。");
      return;
    }
    if (replace) {
      update({ script: newBlocks }, true);
    } else {
      update({ script: [...data.script, ...newBlocks] }, true);
    }
    setShowImportModal(false);
    setImportText('');
  };

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Import Modal */}
      {showImportModal && (
        <div className="absolute inset-0 z-50 bg-ink-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-ink-200">
              <h3 className="font-bold text-ink-800 flex items-center gap-2">
                <FileUp size={20} /> {t.script.import} (Fountain)
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-ink-400 hover:text-ink-900">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex-1">
              <textarea 
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full h-64 md:h-96 p-4 bg-ink-50 border border-ink-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent-500"
                placeholder={`INT. OFFICE - DAY\n\nALICE\nHello world!\n\nShe types on her keyboard.`}
              />
            </div>
            <div className="p-4 border-t border-ink-200 bg-ink-50 rounded-b-xl flex justify-end gap-3">
              <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-ink-600 hover:bg-ink-200 rounded transition-colors text-sm font-medium">{t.common.cancel}</button>
              <button onClick={() => handleImport(false)} disabled={!importText.trim()} className="px-4 py-2 bg-white border border-ink-300 text-ink-700 hover:bg-ink-50 rounded shadow-sm transition-colors text-sm font-medium disabled:opacity-50">{t.common.add}</button>
              <button onClick={() => handleImport(true)} disabled={!importText.trim()} className="px-4 py-2 bg-ink-900 text-white hover:bg-accent-600 rounded shadow-md transition-colors text-sm font-medium disabled:opacity-50">替换 (Replace)</button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="h-14 bg-white border-b border-ink-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-2">
           <button onClick={undo} className="p-2 text-ink-500 hover:text-ink-900 transition-colors"><Undo size={18} /></button>
           <button onClick={redo} className="p-2 text-ink-500 hover:text-ink-900 transition-colors"><Redo size={18} /></button>
           <div className="w-px h-4 bg-ink-300 mx-2"></div>
           
           <button 
              onClick={() => {
                 setSelectionMode(!selectionMode);
                 setSelectedBlockIds(new Set()); // Clear selection when toggling
              }} 
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors
                 ${selectionMode ? 'bg-accent-600 text-white shadow-inner' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'}
              `}
           >
             <MousePointer2 size={14} /> {selectionMode ? t.script.cancelSelection : t.script.selectRange}
           </button>

           <div className="w-px h-4 bg-ink-300 mx-2"></div>

           <button onClick={handleInsertDialogueSequence} disabled={!focusedBlockId || selectionMode} className="flex items-center gap-2 px-3 py-1.5 bg-ink-100 text-ink-700 rounded text-sm hover:bg-ink-200 transition-colors disabled:opacity-50">
             <MessageSquarePlus size={14} /> {t.script.insertDialogue}
           </button>

           <button 
              onClick={handleAutoStoryboard} 
              disabled={generating} 
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors
                 ${selectedBlockIds.size > 0 
                    ? 'bg-accent-600 text-white hover:bg-accent-700 shadow-md' 
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                 }
              `}
            >
             <Clapperboard size={14} className={generating ? "animate-spin" : ""} />
             {selectedBlockIds.size > 0 ? t.script.generateSelected : t.script.autoStoryboard}
           </button>

           <button onClick={handleAIContinue} disabled={generating || selectionMode} className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-accent-500 to-emerald-600 text-white rounded text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
             <Wand2 size={14} className={generating ? "animate-spin" : ""} />
             {t.script.aiContinue}
           </button>
           
           <div className="w-px h-4 bg-ink-300 mx-2"></div>

           <button onClick={() => setShowImportModal(true)} className="p-2 text-ink-500 hover:text-ink-900 transition-colors"><FileUp size={18} /></button>
           <button onClick={handleExport} className="p-2 text-ink-500 hover:text-ink-900 transition-colors"><Download size={18} /></button>
        </div>
      </div>

      {/* Selection Banner */}
      {selectionMode && (
         <div className="bg-accent-50 border-b border-accent-100 p-2 text-center text-xs font-bold text-accent-700 flex items-center justify-center gap-2 animate-fadeIn">
            <MousePointer2 size={12} />
            {t.script.selectHint} ({selectedBlockIds.size} selected)
         </div>
      )}

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="w-full max-w-3xl mx-auto p-12 relative min-h-full">
          {data.script.length === 0 && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
               <div className="text-center">
                 <Type size={48} className="mx-auto mb-2" />
                 <p>开始创作</p>
               </div>
             </div>
          )}
          {data.script.map((block) => (
            <ScriptBlockItem 
               key={block.id} 
               block={block} 
               updateBlock={updateBlock} 
               addBlock={addBlock} 
               deleteBlock={deleteBlock} 
               onFocus={setFocusedBlockId} 
               selectionMode={selectionMode}
               isSelected={selectedBlockIds.has(block.id)}
               onToggleSelection={handleToggleSelection}
            />
          ))}
          <div ref={bottomRef} className="h-40"></div>
        </div>
      </div>

      {/* Bottom Bar (Add Blocks) */}
      {!selectionMode && (
        <div className="h-16 bg-white border-t border-ink-200 shrink-0 flex justify-center items-center gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
            <BlockButton label="场景 (Scene)" shortcut="S" onClick={() => addBlock(ScriptBlockType.SCENE_HEADING, '', focusedBlockId || undefined)} />
            <BlockButton label="动作 (Action)" shortcut="A" onClick={() => addBlock(ScriptBlockType.ACTION, '', focusedBlockId || undefined)} />
            <BlockButton label="角色 (Char)" shortcut="C" onClick={() => addBlock(ScriptBlockType.CHARACTER, '', focusedBlockId || undefined)} />
            <BlockButton label="对白 (Dial)" shortcut="D" onClick={() => addBlock(ScriptBlockType.DIALOGUE, '', focusedBlockId || undefined)} />
            <BlockButton label="括号 (Paren)" shortcut="P" onClick={() => addBlock(ScriptBlockType.PARENTHETICAL, '', focusedBlockId || undefined)} />
        </div>
      )}
    </div>
  );
};

const BlockButton: React.FC<{ label: string; shortcut: string; onClick: () => void }> = ({ label, shortcut, onClick }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center w-20 h-12 rounded hover:bg-ink-100 transition-colors group"
  >
    <span className="text-xs font-bold text-ink-700">{label}</span>
    <span className="text-[9px] text-ink-400 group-hover:text-accent-500">Alt+{shortcut}</span>
  </button>
);
