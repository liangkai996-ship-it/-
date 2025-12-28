
import React, { useState, useRef } from 'react';
import { Character, ProjectData, CharacterRelationship, AppLanguage } from '../../types';
import { GeminiService } from '../../services/geminiService';
// Added missing Users import
import { User, Users, Plus, Wand2, Trash2, LayoutGrid, Network, Link as LinkIcon, X, Palette, Image as ImageIcon, Download, Target, Flame } from 'lucide-react';
import { getTranslation } from '../../utils/translations';
import { ImagePreviewModal } from '../ImagePreviewModal';

interface CharactersProps {
  data: ProjectData;
  update: (data: Partial<ProjectData>) => void;
  language: AppLanguage;
}

const CHARACTER_STYLES = ['日系动漫', '写实风格', '皮克斯3D', '美漫风格', '水彩手绘', '赛博朋克'];

export const CharactersModule: React.FC<CharactersProps> = ({ data, update, language }) => {
  const t = getTranslation(language);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [previewCharId, setPreviewCharId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const handleAddCharacter = () => {
    const newChar: Character = {
      id: crypto.randomUUID(),
      name: '未命名角色',
      role: '角色定位',
      age: '未知',
      description: '',
      goal: '',
      conflict: '',
      arc: '',
      mapPosition: { x: 100, y: 100 },
      visualDesign: { clothing: '日常', pose: '自然', expression: '平静', style: '日系动漫' }
    };
    update({ characters: [...data.characters, newChar] });
  };

  const updateCharacter = (id: string, field: keyof Character, value: any) => {
    update({ characters: data.characters.map(c => c.id === id ? { ...c, [field]: value } : c) });
  };

  return (
    <div className="h-full overflow-hidden flex flex-col bg-ink-950">
      <div className="p-8 flex justify-between items-center shrink-0 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-serif font-bold text-ink-100 flex items-center gap-3">
             <Users className="text-accent-400" /> {t.characters.title}
          </h2>
          <p className="text-ink-500 text-xs mt-1 uppercase tracking-widest font-mono">Neural Character Modeling Laboratory</p>
        </div>
        <div className="flex gap-4">
          <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/20' : 'text-ink-500 hover:text-ink-200'}`}><LayoutGrid size={18} /></button>
            <button onClick={() => setViewMode('map')} className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/20' : 'text-ink-500 hover:text-ink-200'}`}><Network size={18} /></button>
          </div>
          <button onClick={handleAddCharacter} className="bg-white text-ink-950 px-6 py-2 rounded-xl font-bold text-sm hover:bg-accent-500 hover:text-white transition-all shadow-xl">
             <Plus size={16} className="inline mr-2" /> {t.common.add}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 bg-transparent">
        {viewMode === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-12">
            {data.characters.map(char => (
              <div key={char.id} className="glass-card rounded-[32px] p-6 group relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/5 blur-[60px] pointer-events-none"></div>
                
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-accent-500/50 transition-colors shadow-inner">
                      {char.visualDesign?.image ? <img src={`data:image/png;base64,${char.visualDesign.image}`} className="w-full h-full object-cover" /> : <User className="text-ink-700" size={32} />}
                   </div>
                   <div className="flex-1">
                      <input value={char.name} onChange={(e) => updateCharacter(char.id, 'name', e.target.value)} className="bg-transparent text-xl font-bold text-ink-100 border-none outline-none focus:text-accent-400 transition-colors w-full" />
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] font-bold text-accent-500 px-2 py-0.5 rounded bg-accent-500/10 border border-accent-500/20 uppercase">{char.role}</span>
                        <span className="text-[10px] font-bold text-ink-500 px-2 py-0.5 rounded bg-white/5 border border-white/10">{char.age}岁</span>
                      </div>
                   </div>
                   <button onClick={() => update({ characters: data.characters.filter(c => c.id !== char.id) })} className="opacity-0 group-hover:opacity-100 text-ink-600 hover:text-red-400 transition-all"><Trash2 size={16}/></button>
                </div>

                <div className="space-y-4">
                   <div className="relative">
                      <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-ink-500 uppercase tracking-tighter"><Target size={12}/> 动机与目标 (Goal)</div>
                      <textarea value={char.goal} onChange={(e) => updateCharacter(char.id, 'goal', e.target.value)} className="w-full bg-white/5 border-none rounded-xl p-3 text-sm text-ink-300 resize-none h-16 outline-none focus:bg-white/10" placeholder="角色最渴求什么？" />
                   </div>
                   <div className="relative">
                      <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-ink-500 uppercase tracking-tighter"><Flame size={12}/> 核心矛盾 (Conflict)</div>
                      <textarea value={char.conflict} onChange={(e) => updateCharacter(char.id, 'conflict', e.target.value)} className="w-full bg-white/5 border-none rounded-xl p-3 text-sm text-ink-300 resize-none h-16 outline-none focus:bg-white/10" placeholder="什么在阻碍他的行动？" />
                   </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                   <div className="flex -space-x-2">
                      {[1,2].map(i => <div key={i} className="w-6 h-6 rounded-full border border-ink-900 bg-ink-800 flex items-center justify-center text-[10px] text-ink-500"><User size={10}/></div>)}
                      <div className="w-6 h-6 rounded-full border border-ink-900 bg-accent-500 flex items-center justify-center text-[10px] text-white font-bold">+</div>
                   </div>
                   <button onClick={() => setPreviewCharId(char.id)} className="text-[10px] font-bold text-ink-500 hover:text-accent-400 flex items-center gap-2 transition-colors uppercase tracking-widest">Visual DNA <Palette size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full glass-card rounded-[40px] relative overflow-hidden">
             <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[length:40px_40px]"></div>
             <div className="flex items-center justify-center h-full text-ink-700 font-mono text-xs uppercase tracking-[1em] animate-pulse">Neural Map Online...</div>
          </div>
        )}
      </div>
    </div>
  );
};
