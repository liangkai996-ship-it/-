
import React, { useState, useRef } from 'react';
import { ProjectData, ScriptBlock, ScriptBlockType, AppLanguage } from '../../types';
import { GeminiService } from '../../services/geminiService';
import { Wand2, Download, Type, Undo, Redo, FileUp, X, MousePointer2, CheckSquare, PlusSquare, FileText, Zap } from 'lucide-react';
import { getTranslation } from '../../utils/translations';

const getClassForType = (type: ScriptBlockType) => {
  switch (type) {
    case ScriptBlockType.SCENE_HEADING: return "font-mono font-bold text-lg text-ink-100 uppercase mb-8 mt-12 tracking-tight border-b border-white/5 pb-2";
    case ScriptBlockType.ACTION: return "text-ink-300 text-base mb-6 leading-relaxed text-justify font-sans";
    case ScriptBlockType.CHARACTER: return "text-accent-400 font-bold uppercase text-base mb-2 w-full text-center mt-8 tracking-widest";
    case ScriptBlockType.PARENTHETICAL: return "text-ink-500 italic text-sm mb-2 w-1/2 mx-auto text-center";
    case ScriptBlockType.DIALOGUE: return "text-ink-100 text-lg mb-8 leading-snug w-3/4 mx-auto text-center font-serif";
    case ScriptBlockType.TRANSITION: return "font-bold text-accent-500 text-sm text-right my-12 uppercase tracking-[0.3em]";
    default: return "text-base mb-4";
  }
};

export const ScriptEditor: React.FC<{ data: ProjectData, update: any, undo: any, redo: any, language: AppLanguage }> = ({ data, update, undo, redo, language }) => {
  const [generating, setGenerating] = useState(false);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

  const handleExport = () => {
    let text = `TITLE: ${data.title.toUpperCase()}\n\n`;
    data.script.forEach(b => { text += `${b.content}\n\n`; });
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.title}_script.txt`;
    a.click();
  };

  return (
    <div className="h-full flex flex-col bg-ink-950 relative overflow-hidden">
      {/* Immersive Toolbar */}
      <div className="h-16 bg-ink-900/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 shrink-0 z-30 shadow-2xl">
        <div className="flex items-center gap-6">
           <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              <button onClick={undo} className="p-2 text-ink-500 hover:text-ink-100 transition-colors"><Undo size={18} /></button>
              <button onClick={redo} className="p-2 text-ink-500 hover:text-ink-100 transition-colors"><Redo size={18} /></button>
           </div>
           <button onClick={() => {}} className="flex items-center gap-2 px-5 py-2 bg-accent-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-accent-950/40 hover:scale-105 transition-all">
              <Zap size={14} className={generating ? "animate-spin" : ""} /> AI 灵感续写
           </button>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-ink-600 uppercase tracking-widest hidden md:block">Standard Courier Prime v1.0</span>
            <button onClick={handleExport} className="p-2.5 bg-white/5 text-ink-300 hover:bg-white/10 rounded-xl border border-white/10 transition-all"><Download size={20} /></button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto py-16 scroll-smooth bg-transparent">
        <div className="max-w-[850px] mx-auto bg-ink-900 border border-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.5)] min-h-[1100px] p-[1.5in] relative rounded-lg transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-accent-500/20"></div>
          {data.script.map((block) => (
            <div key={block.id} className="group relative">
               <textarea
                 value={block.content}
                 onChange={(e) => update({ script: data.script.map(b => b.id === block.id ? { ...b, content: e.target.value } : b) })}
                 onFocus={() => setFocusedBlockId(block.id)}
                 className={`w-full bg-transparent resize-none outline-none overflow-hidden whitespace-pre-wrap transition-colors ${getClassForType(block.type)} focus:bg-white/[0.02] rounded-lg px-2`}
                 rows={1}
                 placeholder="..."
               />
               <div className="absolute -left-20 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-end">
                  <span className="text-[8px] font-mono text-accent-500 uppercase font-black">{block.type}</span>
                  <button className="text-red-500/30 hover:text-red-500 mt-1"><X size={12}/></button>
               </div>
            </div>
          ))}
          <div className="h-64"></div>
        </div>
      </div>

      {/* Formatting Bar */}
      <div className="h-20 bg-ink-900/90 backdrop-blur-2xl border-t border-white/10 shrink-0 flex justify-center items-center gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] z-30">
          {[
            { label: '场景', type: ScriptBlockType.SCENE_HEADING },
            { label: '动作', type: ScriptBlockType.ACTION },
            { label: '角色', type: ScriptBlockType.CHARACTER },
            { label: '对白', type: ScriptBlockType.DIALOGUE },
            { label: '括号', type: ScriptBlockType.PARENTHETICAL },
            { label: '转场', type: ScriptBlockType.TRANSITION },
          ].map(btn => (
            <button 
              key={btn.type}
              onClick={() => {}} 
              className="px-6 py-2 bg-white/5 hover:bg-accent-500 hover:text-white border border-white/10 rounded-xl text-[10px] font-black text-ink-300 transition-all uppercase tracking-widest"
            >
              {btn.label}
            </button>
          ))}
      </div>
    </div>
  );
};
