
import React, { useState, useEffect, useRef } from 'react';
import { Character, ProjectData, CharacterRelationship, AppLanguage } from '../../types';
import { GeminiService } from '../../services/geminiService';
import { Users, Plus, Trash2, LayoutGrid, Network, Info, Zap, Flame, Target, Home, Fingerprint, GitMerge, ChevronRight, Save, Wand2, Loader2, Import } from 'lucide-react';
import { getTranslation } from '../../utils/translations';

interface CharactersProps {
  data: ProjectData;
  update: (data: Partial<ProjectData>) => void;
  language: AppLanguage;
}

export const CharactersModule: React.FC<CharactersProps> = ({ data, update, language }) => {
  const t = getTranslation(language);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const selectedChar = data.characters.find(c => c.id === selectedCharId);

  const handleAddCharacter = async () => {
    const newChar: Character = {
      id: crypto.randomUUID(),
      name: '新人物',
      role: '角色定位',
      importance: 5,
      age: '25',
      description: '',
      origins: { family: '', genes: '', background: '' },
      stages: { setup: '', struggle: '', resolution: '' },
      mapPosition: { x: Math.random() * 600, y: Math.random() * 400 }
    };
    update({ characters: [...data.characters, newChar] });
    setSelectedCharId(newChar.id);
  };

  const handleImportFromOutline = async () => {
    if (!data.totalOutline) {
      alert("请先在「故事大纲」板块生成或编写深度故事总纲。");
      return;
    }
    
    if (data.characters.length > 0 && !confirm("现有角色列表不为空。AI 提取的角色将追加到列表中，是否继续？")) {
      return;
    }

    setIsExtracting(true);
    try {
      const result = await GeminiService.extractCharactersFromOutline(data.totalOutline, language);
      
      const newChars: Character[] = (result.characters || []).map((c: any) => ({
        id: crypto.randomUUID(),
        name: c.name,
        role: c.role || "主要角色",
        importance: 5,
        description: c.description || "",
        age: c.age || "未知",
        origins: c.origins || { family: '', genes: '', background: '' },
        stages: c.stages || { setup: '', struggle: '', resolution: '' },
        mapPosition: { x: Math.random() * 600, y: Math.random() * 400 }
      }));

      // Merge with existing or replace? Currently appending.
      update({ characters: [...data.characters, ...newChars] });
      
      if (newChars.length > 0) {
        alert(`成功提取并导入 ${newChars.length} 个角色！`);
        setSelectedCharId(newChars[0].id);
      } else {
        alert("未能从大纲中提取到明确的角色信息，请检查大纲内容。");
      }

    } catch (e) {
      console.error(e);
      alert("AI 分析失败，请重试。");
    } finally {
      setIsExtracting(false);
    }
  };

  const updateCharacter = (id: string, updates: Partial<Character>) => {
    update({ characters: data.characters.map(c => c.id === id ? { ...c, ...updates } : c) });
  };

  const addRelationship = (sourceId: string, targetId: string) => {
    const newRel: CharacterRelationship = {
      id: crypto.randomUUID(),
      sourceId,
      targetId,
      label: '新关系',
      bidirectional: true
    };
    update({ relationships: [...data.relationships, newRel] });
  };

  const RelationshipGraph = () => {
    return (
      <div className="relative w-full h-full bg-ink-950 overflow-hidden rounded-[40px] border border-ink-800 shadow-2xl">
        <svg className="absolute inset-0 w-full h-full">
          {data.relationships.map(rel => {
            const source = data.characters.find(c => c.id === rel.sourceId);
            const target = data.characters.find(c => c.id === rel.targetId);
            if (!source || !target) return null;
            return (
              <g key={rel.id}>
                <line 
                  x1={source.mapPosition.x} y1={source.mapPosition.y} 
                  x2={target.mapPosition.x} y2={target.mapPosition.y} 
                  stroke="rgba(16, 185, 129, 0.3)" strokeWidth="2" strokeDasharray="5,5"
                />
                <text 
                  x={(source.mapPosition.x + target.mapPosition.x)/2} 
                  y={(source.mapPosition.y + target.mapPosition.y)/2}
                  fill="#10b981" fontSize="10" className="font-bold select-none" textAnchor="middle"
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
            className={`absolute w-32 h-32 rounded-full glass-card flex flex-col items-center justify-center p-4 cursor-move transition-all border-2 shadow-lg
              ${selectedCharId === char.id ? 'border-accent-500 scale-110 shadow-accent-500/20 bg-ink-900' : 'border-ink-800 bg-ink-950 hover:border-ink-600'}`}
            style={{ left: char.mapPosition.x - 64, top: char.mapPosition.y - 64 }}
            onClick={() => setSelectedCharId(char.id)}
            onMouseDown={(e) => {
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
            <div className="w-12 h-12 bg-ink-800 rounded-full mb-2 flex items-center justify-center text-accent-500 font-bold border border-ink-700">
              {char.name[0]}
            </div>
            <div className="text-[10px] font-black text-ink-100 uppercase tracking-tighter truncate w-full text-center">{char.name}</div>
            <div className="text-[8px] text-ink-500 uppercase">{char.role}</div>
          </div>
        ))}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-ink-900/90 backdrop-blur-xl px-10 py-4 rounded-full border border-ink-700 shadow-2xl">
           <span className="text-[10px] text-ink-400 uppercase font-black tracking-widest">点击人物切换，拖拽调整布局</span>
           <div className="w-px h-4 bg-ink-700"></div>
           <button onClick={() => setViewMode('list')} className="text-xs font-bold text-accent-500 flex items-center gap-2 hover:text-ink-100 transition-all"><LayoutGrid size={14}/> 切换到列表编辑</button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex bg-ink-950 overflow-hidden">
      {/* List Sidebar */}
      <div className="w-80 border-r border-ink-800 flex flex-col bg-ink-900/50">
        <div className="h-20 px-6 flex items-center justify-between shrink-0 border-b border-ink-800">
          <div className="flex items-center gap-2 text-accent-500 font-bold uppercase tracking-widest text-xs">
            <Users size={16}/> 人物档案库
          </div>
          <button onClick={handleAddCharacter} className="p-2 hover:bg-ink-800 text-accent-500 rounded-xl transition-all" title="手动添加"><Plus size={20}/></button>
        </div>
        
        {/* Import Button */}
        <div className="px-4 pt-4 pb-2">
           <button 
             onClick={handleImportFromOutline}
             disabled={isExtracting}
             className="w-full py-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-purple-500 hover:text-white transition-all mb-2"
           >
             {isExtracting ? <Loader2 size={12} className="animate-spin" /> : <Import size={12} />}
             {isExtracting ? "正在分析总纲..." : "从故事大纲导入人物"}
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {data.characters.map(char => (
            <button 
              key={char.id}
              onClick={() => setSelectedCharId(char.id)}
              className={`w-full p-4 rounded-2xl text-left transition-all duration-200 flex items-center gap-4 group border
                ${selectedCharId === char.id ? 'bg-accent-500 text-white shadow-lg border-accent-400' : 'bg-ink-950 border-ink-800 hover:border-ink-600 text-ink-500'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${selectedCharId === char.id ? 'bg-white/20' : 'bg-ink-800'}`}>{char.name[0]}</div>
              <div className="flex-1 overflow-hidden">
                <div className={`font-bold text-xs uppercase truncate ${selectedCharId === char.id ? 'text-white' : 'text-ink-200'}`}>{char.name}</div>
                <div className={`text-[9px] uppercase ${selectedCharId === char.id ? 'opacity-80' : 'opacity-60'}`}>{char.role}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); update({ characters: data.characters.filter(c => c.id !== char.id) }); }} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-white transition-colors"><Trash2 size={14}/></button>
            </button>
          ))}
        </div>
        <div className="p-6 border-t border-ink-800">
           <button onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')} className="w-full py-4 bg-ink-950 border border-ink-800 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:text-accent-500 hover:border-accent-500/50 transition-all shadow-sm">
             {viewMode === 'map' ? <LayoutGrid size={16}/> : <Network size={16}/>}
             {viewMode === 'map' ? '返回列表视图' : '查看关系图谱'}
           </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 overflow-hidden p-10 bg-ink-950">
        {viewMode === 'map' ? <RelationshipGraph /> : (
          selectedChar ? (
            <div className="h-full flex flex-col animate-fadeIn max-w-6xl mx-auto">
              <header className="mb-10 flex items-end justify-between border-b border-ink-800 pb-8">
                <div>
                   <input 
                      value={selectedChar.name}
                      onChange={(e) => updateCharacter(selectedChar.id, { name: e.target.value })}
                      className="bg-transparent text-5xl font-serif font-bold text-ink-100 outline-none w-full mb-4 placeholder:text-ink-700"
                      placeholder="姓名"
                   />
                   <div className="flex items-center gap-4">
                      <input 
                        value={selectedChar.role}
                        onChange={(e) => updateCharacter(selectedChar.id, { role: e.target.value })}
                        className="bg-ink-900 border border-ink-800 rounded-full px-5 py-1.5 text-[10px] font-bold text-accent-500 uppercase outline-none focus:border-accent-500 transition-colors"
                        placeholder="角色定位"
                      />
                      <input 
                        value={selectedChar.age}
                        onChange={(e) => updateCharacter(selectedChar.id, { age: e.target.value })}
                        className="bg-ink-900 border border-ink-800 rounded-full px-5 py-1.5 text-[10px] font-bold text-ink-500 uppercase outline-none w-20 text-center focus:border-ink-600 transition-colors"
                        placeholder="年龄"
                      />
                   </div>
                </div>
                <button className="px-8 py-3 bg-accent-500 text-white rounded-full font-bold text-xs uppercase flex items-center gap-2 hover:bg-accent-400 shadow-xl transition-all active:scale-95">
                   <Save size={16} /> 保存档案
                </button>
              </header>

              <div className="flex-1 overflow-y-auto pr-4 grid grid-cols-1 lg:grid-cols-2 gap-10 pb-20 custom-scrollbar">
                {/* Origins Section */}
                <div className="space-y-8">
                   <div className="glass-card p-10 rounded-[40px] border-ink-800 bg-ink-900/40">
                      <h3 className="text-accent-400 font-black uppercase text-[10px] tracking-widest mb-8 flex items-center gap-2">
                         <Home size={16} /> 角色背景与原生家庭 (Origins)
                      </h3>
                      <div className="space-y-6">
                         <div>
                            <label className="text-[9px] font-bold text-ink-500 uppercase mb-2 block tracking-widest">人物简介 (Description)</label>
                            <textarea 
                               value={selectedChar.description}
                               onChange={(e) => updateCharacter(selectedChar.id, { description: e.target.value })}
                               className="w-full bg-ink-950 border border-ink-800 rounded-2xl p-5 text-sm text-ink-200 outline-none min-h-[100px] resize-none focus:border-accent-500/50 transition-all leading-relaxed"
                               placeholder="外貌特征、核心性格..."
                            />
                         </div>
                         <div>
                            <label className="text-[9px] font-bold text-ink-500 uppercase mb-2 block tracking-widest">原生家庭 / 成长环境 (Native Family)</label>
                            <textarea 
                               value={selectedChar.origins?.family}
                               onChange={(e) => updateCharacter(selectedChar.id, { origins: { ...selectedChar.origins!, family: e.target.value } })}
                               className="w-full bg-ink-950 border border-ink-800 rounded-2xl p-5 text-sm text-ink-200 outline-none min-h-[100px] resize-none focus:border-accent-500/50 transition-all leading-relaxed"
                               placeholder="描述原生家庭及其对性格的深远影响..."
                            />
                         </div>
                         <div>
                            <label className="text-[9px] font-bold text-ink-500 uppercase mb-2 block tracking-widest">社会背景 (Social Context)</label>
                            <textarea 
                               value={selectedChar.origins?.background}
                               onChange={(e) => updateCharacter(selectedChar.id, { origins: { ...selectedChar.origins!, background: e.target.value } })}
                               className="w-full bg-ink-950 border border-ink-800 rounded-2xl p-5 text-sm text-ink-200 outline-none min-h-[80px] resize-none focus:border-accent-500/50 transition-all leading-relaxed"
                               placeholder="职业、社会地位及经济状况..."
                            />
                         </div>
                      </div>
                   </div>

                   <div className="glass-card p-10 rounded-[40px] border-ink-800 bg-ink-900/40">
                      <h3 className="text-purple-400 font-black uppercase text-[10px] tracking-widest mb-8 flex items-center gap-2">
                         <GitMerge size={16} /> 核心关系链 (Neural Link)
                      </h3>
                      <div className="space-y-3">
                         {data.relationships.filter(r => r.sourceId === selectedCharId || r.targetId === selectedCharId).map(rel => {
                            const otherId = rel.sourceId === selectedCharId ? rel.targetId : rel.sourceId;
                            const otherChar = data.characters.find(c => c.id === otherId);
                            return (
                               <div key={rel.id} className="p-4 bg-ink-950 rounded-2xl border border-ink-800 flex items-center justify-between hover:border-purple-500/30 transition-colors">
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-xs font-bold text-purple-400">{otherChar?.name[0]}</div>
                                     <input 
                                        value={rel.label} 
                                        onChange={(e) => update({ relationships: data.relationships.map(r => r.id === rel.id ? { ...r, label: e.target.value } : r) })}
                                        className="bg-transparent text-xs font-bold text-ink-100 outline-none focus:text-purple-400 w-full"
                                     />
                                  </div>
                                  <button onClick={() => update({ relationships: data.relationships.filter(r => r.id !== rel.id) })} className="text-ink-600 hover:text-red-500"><Trash2 size={14}/></button>
                               </div>
                            );
                         })}
                         <button onClick={() => {
                            const other = data.characters.find(c => c.id !== selectedCharId);
                            if (other) addRelationship(selectedCharId, other.id);
                         }} className="w-full py-4 border-2 border-dashed border-ink-800 rounded-2xl text-[10px] font-bold text-ink-500 hover:text-purple-400 hover:border-purple-500/30 transition-all uppercase tracking-widest">建立新链接</button>
                      </div>
                   </div>
                </div>

                {/* Stages Section */}
                <div className="space-y-8">
                   <div className="glass-card p-10 rounded-[40px] border-ink-800 bg-ink-900/40">
                      <h3 className="text-orange-400 font-black uppercase text-[10px] tracking-widest mb-8 flex items-center gap-2">
                         <Flame size={16} /> 阶段性动机与欲望 (Arc)
                      </h3>
                      <div className="space-y-8 relative">
                         <div className="absolute left-4 top-4 bottom-4 w-px bg-ink-800"></div>
                         
                         <div className="relative pl-12 group">
                            <div className="absolute left-2.5 top-0 w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_10px_#f97316] z-10"></div>
                            <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-3 block">初期：表面目标 (The Want)</label>
                            <textarea 
                               value={selectedChar.stages?.setup}
                               onChange={(e) => updateCharacter(selectedChar.id, { stages: { ...selectedChar.stages!, setup: e.target.value } })}
                               className="w-full bg-transparent border-none text-sm text-ink-200 outline-none min-h-[100px] resize-none font-serif leading-relaxed group-hover:text-ink-100 transition-colors"
                               placeholder="故事开始时，角色认为自己想要什么？"
                            />
                         </div>

                         <div className="relative pl-12 group">
                            <div className="absolute left-2.5 top-0 w-3 h-3 rounded-full bg-orange-500/50 z-10"></div>
                            <label className="text-[10px] font-black text-orange-500/70 uppercase tracking-widest mb-3 block">中期：核心欲望 (The Need)</label>
                            <textarea 
                               value={selectedChar.stages?.struggle}
                               onChange={(e) => updateCharacter(selectedChar.id, { stages: { ...selectedChar.stages!, struggle: e.target.value } })}
                               className="w-full bg-transparent border-none text-sm text-ink-200 outline-none min-h-[100px] resize-none font-serif leading-relaxed group-hover:text-ink-100 transition-colors"
                               placeholder="压力之下，角色内心深处真正的渴望是什么？"
                            />
                         </div>

                         <div className="relative pl-12 group">
                            <div className="absolute left-2.5 top-0 w-3 h-3 rounded-full bg-orange-500/20 z-10"></div>
                            <label className="text-[10px] font-black text-orange-500/40 uppercase tracking-widest mb-3 block">结局：蜕变状态 (The Result)</label>
                            <textarea 
                               value={selectedChar.stages?.resolution}
                               onChange={(e) => updateCharacter(selectedChar.id, { stages: { ...selectedChar.stages!, resolution: e.target.value } })}
                               className="w-full bg-transparent border-none text-sm text-ink-200 outline-none min-h-[100px] resize-none font-serif leading-relaxed group-hover:text-ink-100 transition-colors"
                               placeholder="经历磨难后，角色变成了什么样？"
                            />
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-10">
              <Users size={80} className="mb-6 text-ink-500" />
              <div className="text-xs font-mono uppercase tracking-[0.8em] text-ink-500">请在左侧选择一个角色以编辑</div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
