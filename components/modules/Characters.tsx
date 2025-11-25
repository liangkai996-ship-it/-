
import React, { useState, useRef } from 'react';
import { Character, ProjectData, CharacterRelationship, AppLanguage } from '../../types';
import { GeminiService } from '../../services/geminiService';
import { User, Plus, Wand2, Trash2, LayoutGrid, Network, Link as LinkIcon, X, Palette, Image as ImageIcon, Download } from 'lucide-react';
import { getTranslation } from '../../utils/translations';
import { ImagePreviewModal } from '../ImagePreviewModal';

interface CharactersProps {
  data: ProjectData;
  update: (data: Partial<ProjectData>) => void;
  language: AppLanguage;
}

type ViewMode = 'list' | 'map';

const CHARACTER_STYLES = [
  '日系动漫 (Anime)', '写实风格 (Realistic)', '皮克斯3D (Pixar)', '美漫风格 (Comic)', '水彩手绘 (Watercolor)', '厚涂 (Impasto)', '像素风 (Pixel)', '赛博朋克 (Cyberpunk)', '古风 (Traditional Chinese)'
];

export const CharactersModule: React.FC<CharactersProps> = ({ data, update, language }) => {
  const t = getTranslation(language);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  // Image Preview State
  const [previewCharId, setPreviewCharId] = useState<string | null>(null);

  // Map View State
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const handleAddCharacter = () => {
    const newPos = { x: 100 + (data.characters.length * 50) % 500, y: 100 + Math.floor(data.characters.length / 10) * 100 };
    const newChar: Character = {
      id: crypto.randomUUID(),
      name: '新角色',
      role: '角色定位',
      age: '未知',
      description: '',
      goal: '',
      conflict: '',
      arc: '',
      mapPosition: newPos,
      visualDesign: { clothing: '日常', pose: '自然', expression: '平静', style: '日系动漫 (Anime)' }
    };
    update({ characters: [...data.characters, newChar] });
  };

  const handleGenerateCharacter = async () => {
    setIsGenerating(true);
    try {
      const char = await GeminiService.generateCharacter(`A character for a ${data.genre} story about ${data.logline}`, language);
      char.mapPosition = { x: 300, y: 300 };
      char.visualDesign = { clothing: 'Casual', pose: 'Neutral', expression: 'Calm', style: '日系动漫 (Anime)' };
      update({ characters: [...data.characters, char] });
    } catch (e) {
      alert("生成角色失败");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImportFromOutline = async () => {
    if (!data.totalOutline && data.outline.every(s => !s.content)) {
        alert("请先生成故事大纲 (Please generate a story outline first).");
        return;
    }

    setIsImporting(true);
    // Prioritize Total Outline, fallback to first act summary
    const sourceText = data.totalOutline || data.outline.map(s => s.content).join('\n');
    
    try {
        const newChars = await GeminiService.extractCharactersFromOutline(sourceText, language);
        if (newChars.length > 0) {
            // Merge with existing (simple append for now, can be improved to dedup)
            const existingNames = new Set(data.characters.map(c => c.name.trim()));
            const filteredNewChars = newChars.filter(c => !existingNames.has(c.name.trim()));
            
            if (filteredNewChars.length > 0) {
                 // Add map positions
                 const positionedChars = filteredNewChars.map((c, i) => ({
                     ...c,
                     mapPosition: { x: 100 + (i * 60) % 600, y: 100 + (i * 50) }
                 }));
                 update({ characters: [...data.characters, ...positionedChars] });
                 alert(`${t.characters.importSuccess}: ${filteredNewChars.length}`);
            } else {
                 alert("未发现新角色 (No new characters found).");
            }
        } else {
            alert("未从大纲中提取到角色 (No characters extracted).");
        }
    } catch (e) {
        alert("导入失败 (Import failed).");
    } finally {
        setIsImporting(false);
    }
  };

  const handleGenerateCharacterSheet = async (char: Character) => {
    setIsGeneratingImage(char.id);
    const visuals = char.visualDesign || { clothing: 'Casual', pose: 'Neutral', expression: 'Neutral', style: '2D Animation' };
    const prompt = `
      Character Reference Sheet, Concept Art.
      Subject: ${char.name}, ${char.age}, ${char.description}.
      Clothing: ${visuals.clothing}.
      Pose: ${visuals.pose}.
      Expression: ${visuals.expression}.
      Style: ${visuals.style || '2D Animation'}.
      Three-view drawing: Front view, Side view, Back view. 
      White background, high quality, detailed character design.
    `;
    try {
      const base64Img = await GeminiService.generateImage(prompt);
      if (base64Img) {
        updateCharacter(char.id, 'visualDesign', { ...visuals, image: base64Img });
      } else {
        alert("生成图片失败");
      }
    } catch (e) {
       console.error(e);
       alert("Error generating image");
    } finally {
      setIsGeneratingImage(null);
    }
  };

  const handleEditCharacterImage = async (prompt: string) => {
    if (!previewCharId) return;
    const char = data.characters.find(c => c.id === previewCharId);
    if (!char || !char.visualDesign?.image) return;

    try {
      const newImage = await GeminiService.editImage(char.visualDesign.image, prompt);
      if (newImage) {
        updateCharacter(previewCharId, 'visualDesign', { ...char.visualDesign, image: newImage });
      } else {
        alert("修改图片失败");
      }
    } catch (e) {
      alert("Error editing image");
    }
  };

  const updateCharacter = (id: string, field: keyof Character, value: any) => {
    const updated = data.characters.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    );
    update({ characters: updated });
  };

  const updateVisualDesign = (id: string, field: string, value: string) => {
    const char = data.characters.find(c => c.id === id);
    if (char) {
      const currentVisuals = char.visualDesign || { clothing: '', pose: '', expression: '', style: '' };
      updateCharacter(id, 'visualDesign', { ...currentVisuals, [field]: value });
    }
  };

  const deleteCharacter = (id: string) => {
    update({ 
      characters: data.characters.filter(c => c.id !== id),
      relationships: (data.relationships || []).filter(r => r.sourceId !== id && r.targetId !== id)
    });
  };

  const handleDragStart = (e: React.MouseEvent, id: string) => {
    if (connectingSourceId) return;
    e.stopPropagation();
    setDraggingId(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (draggingId) {
      const updated = data.characters.map(c => 
        c.id === draggingId ? { ...c, mapPosition: { x: x - 64, y: y - 32 } } : c
      );
      update({ characters: updated });
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  const handleNodeClick = (id: string) => {
    if (connectingSourceId) {
      if (connectingSourceId === id) {
        setConnectingSourceId(null);
        return;
      }
      const newRel: CharacterRelationship = {
        id: crypto.randomUUID(),
        sourceId: connectingSourceId,
        targetId: id,
        label: '?'
      };
      update({ relationships: [...(data.relationships || []), newRel] });
      setConnectingSourceId(null);
    }
  };

  const updateRelationship = (id: string, label: string) => {
    const updated = (data.relationships || []).map(r => 
      r.id === id ? { ...r, label } : r
    );
    update({ relationships: updated });
  };

  const deleteRelationship = (id: string) => {
    const updated = (data.relationships || []).filter(r => r.id !== id);
    update({ relationships: updated });
  };

  const getCharPos = (id: string) => {
    const char = data.characters.find(c => c.id === id);
    return char?.mapPosition || { x: 50, y: 50 };
  };

  const renderMap = () => (
    <div 
      ref={mapContainerRef}
      className="relative w-full h-[600px] bg-ink-50/50 border border-ink-200 rounded-xl overflow-hidden cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute top-4 left-4 z-20 bg-white/80 backdrop-blur px-3 py-1 rounded text-xs text-ink-500 pointer-events-none">
        {connectingSourceId ? "选择另一个角色以连接" : "拖拽移动 • 点击链接图标进行连接"}
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {(data.relationships || []).map(rel => {
          const start = getCharPos(rel.sourceId);
          const end = getCharPos(rel.targetId);
          const sX = start.x + 80; const sY = start.y + 40;
          const eX = end.x + 80; const eY = end.y + 40;
          return (
            <g key={rel.id}>
              <line x1={sX} y1={sY} x2={eX} y2={eY} stroke="#cbd5e1" strokeWidth="2" />
            </g>
          );
        })}
        {connectingSourceId && (
          <line 
            x1={getCharPos(connectingSourceId).x + 80} 
            y1={getCharPos(connectingSourceId).y + 40} 
            x2={mousePos.x} 
            y2={mousePos.y} 
            stroke="#10b981" 
            strokeWidth="2" 
            strokeDasharray="5,5" 
          />
        )}
      </svg>

      {(data.relationships || []).map(rel => {
        const start = getCharPos(rel.sourceId);
        const end = getCharPos(rel.targetId);
        const sX = start.x + 80; const sY = start.y + 40;
        const eX = end.x + 80; const eY = end.y + 40;
        const midX = (sX + eX) / 2;
        const midY = (sY + eY) / 2;

        return (
          <div 
            key={`label-${rel.id}`}
            className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 flex items-center group"
            style={{ left: midX, top: midY }}
          >
            <input 
              value={rel.label}
              onChange={(e) => updateRelationship(rel.id, e.target.value)}
              className="bg-white text-xs font-medium text-ink-600 border border-ink-200 rounded px-2 py-0.5 shadow-sm focus:border-accent-500 focus:outline-none text-center w-24"
            />
            <button 
              onClick={() => deleteRelationship(rel.id)}
              className="ml-1 text-ink-300 hover:text-red-500 hidden group-hover:block bg-white rounded-full p-0.5 shadow-sm"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}

      {data.characters.map(char => (
        <div
          key={char.id}
          className={`absolute w-40 bg-white rounded-lg shadow-md border-2 p-3 flex flex-col gap-2 z-10 transition-shadow select-none
            ${connectingSourceId === char.id ? 'border-accent-500 ring-2 ring-accent-200' : 'border-ink-100 hover:border-ink-300'}
          `}
          style={{ left: char.mapPosition?.x || 0, top: char.mapPosition?.y || 0, cursor: 'grab' }}
          onMouseDown={(e) => handleDragStart(e, char.id)}
          onClick={(e) => { e.stopPropagation(); handleNodeClick(char.id); }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-ink-100 rounded-full flex items-center justify-center text-ink-400 shrink-0 overflow-hidden">
               {char.visualDesign?.image ? (
                 <img src={`data:image/png;base64,${char.visualDesign.image}`} className="w-full h-full object-cover" />
               ) : (
                 <User size={16} />
               )}
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-sm text-ink-900 truncate">{char.name}</div>
              <div className="text-[10px] text-ink-500 truncate">{char.role}</div>
            </div>
          </div>
          
          <div className="flex justify-end border-t border-ink-50 pt-2 mt-1">
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 setConnectingSourceId(connectingSourceId === char.id ? null : char.id);
               }}
               className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors
                 ${connectingSourceId === char.id 
                   ? 'bg-accent-100 text-accent-700 font-bold' 
                   : 'bg-ink-50 text-ink-500 hover:bg-ink-100'}`}
             >
               <LinkIcon size={10} />
               {connectingSourceId === char.id ? t.common.cancel : '连线'}
             </button>
          </div>
        </div>
      ))}
    </div>
  );

  const previewCharacter = data.characters.find(c => c.id === previewCharId);

  return (
    <div className="p-8 h-full overflow-y-auto">
      {/* Image Preview Modal */}
      {previewCharacter && previewCharacter.visualDesign?.image && (
        <ImagePreviewModal 
           isOpen={!!previewCharId}
           onClose={() => setPreviewCharId(null)}
           imageUrl={previewCharacter.visualDesign.image}
           onEditImage={handleEditCharacterImage}
           title={`${previewCharacter.name} - ${t.characters.visualDesign}`}
           language={language}
        />
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-serif font-bold text-ink-900">{t.characters.title}</h2>
          <p className="text-ink-500 mt-1">{t.characters.subtitle}</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-ink-100 rounded-lg p-1 mr-4">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-900'}`}
              title={t.characters.listView}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-md transition-all ${viewMode === 'map' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-900'}`}
              title={t.characters.relationMap}
            >
              <Network size={18} />
            </button>
          </div>

          <button 
            onClick={handleImportFromOutline}
            disabled={isImporting}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 transition-colors font-medium text-sm"
          >
             <Download size={16} className={isImporting ? "animate-spin" : ""} />
             {t.characters.importFromOutline}
          </button>

          <button 
            onClick={handleGenerateCharacter}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium text-sm"
          >
            <Wand2 size={16} className={isGenerating ? "animate-spin" : ""} />
            {t.common.aiGenerate}
          </button>
          <button 
            onClick={handleAddCharacter}
            className="flex items-center gap-2 px-4 py-2 bg-ink-900 text-white rounded-lg hover:bg-ink-800 transition-colors font-medium text-sm shadow-md"
          >
            <Plus size={16} />
            {t.common.add}
          </button>
        </div>
      </div>

      {viewMode === 'map' ? (
        renderMap()
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
          {data.characters.map(char => (
            <div key={char.id} className="bg-white rounded-xl border border-ink-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-4 group relative">
              <button 
                onClick={() => deleteCharacter(char.id)}
                className="absolute top-4 right-4 text-ink-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
              
              <div className="flex items-start gap-4 border-b border-ink-100 pb-4">
                <div 
                   onClick={() => char.visualDesign?.image && setPreviewCharId(char.id)}
                   className={`w-16 h-16 bg-ink-100 rounded-lg flex items-center justify-center text-ink-400 shrink-0 overflow-hidden border border-ink-200 ${char.visualDesign?.image ? 'cursor-pointer hover:opacity-90' : ''}`}
                >
                  {char.visualDesign?.image ? (
                    <img src={`data:image/png;base64,${char.visualDesign.image}`} alt={char.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div className="flex-1">
                  <input 
                    value={char.name}
                    onChange={(e) => updateCharacter(char.id, 'name', e.target.value)}
                    className="font-serif font-bold text-lg text-ink-900 w-full bg-transparent border-b border-transparent focus:border-accent-500 focus:outline-none"
                    placeholder={t.characters.name}
                  />
                  <div className="flex gap-2 mt-1">
                    <input 
                      value={char.role}
                      onChange={(e) => updateCharacter(char.id, 'role', e.target.value)}
                      className="text-xs font-medium text-accent-600 bg-accent-50 px-2 py-0.5 rounded w-20 focus:outline-none"
                      placeholder={t.characters.role}
                    />
                    <input 
                      value={char.age}
                      onChange={(e) => updateCharacter(char.id, 'age', e.target.value)}
                      className="text-xs text-ink-500 bg-ink-100 px-2 py-0.5 rounded w-16 focus:outline-none"
                      placeholder={t.characters.age}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-ink-400 uppercase tracking-wider">{t.characters.desc}</label>
                  <textarea 
                    value={char.description}
                    onChange={(e) => updateCharacter(char.id, 'description', e.target.value)}
                    className="w-full mt-1 text-sm text-ink-600 bg-ink-50 p-2 rounded border border-transparent focus:bg-white focus:border-ink-200 focus:outline-none resize-none h-20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-ink-400 uppercase tracking-wider">{t.characters.goal}</label>
                  <input 
                    value={char.goal}
                    onChange={(e) => updateCharacter(char.id, 'goal', e.target.value)}
                    className="w-full mt-1 text-sm text-ink-800 bg-transparent border-b border-ink-100 focus:border-accent-500 focus:outline-none py-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-ink-400 uppercase tracking-wider">{t.characters.conflict}</label>
                  <input 
                    value={char.conflict}
                    onChange={(e) => updateCharacter(char.id, 'conflict', e.target.value)}
                    className="w-full mt-1 text-sm text-ink-800 bg-transparent border-b border-ink-100 focus:border-accent-500 focus:outline-none py-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-ink-400 uppercase tracking-wider">{t.characters.arc}</label>
                  <textarea 
                    value={char.arc || ''}
                    onChange={(e) => updateCharacter(char.id, 'arc', e.target.value)}
                    className="w-full mt-1 text-sm text-ink-600 bg-ink-50 p-2 rounded border border-transparent focus:bg-white focus:border-ink-200 focus:outline-none resize-none h-16"
                  />
                </div>
                
                {/* Visual Design Section */}
                <div className="bg-ink-50 rounded-lg p-3 border border-ink-100 mt-2">
                   <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-bold text-ink-400 uppercase flex items-center gap-1">
                        <Palette size={10} /> {t.characters.visualDesign}
                      </label>
                      <button 
                         onClick={() => handleGenerateCharacterSheet(char)}
                         disabled={isGeneratingImage === char.id}
                         className="text-[10px] bg-accent-100 text-accent-700 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-accent-200 transition-colors"
                      >
                         <ImageIcon size={10} className={isGeneratingImage === char.id ? "animate-spin" : ""} />
                         {t.characters.genSheet}
                      </button>
                   </div>
                   <div className="grid grid-cols-2 gap-2 mb-2">
                      <input 
                        value={char.visualDesign?.clothing || ''}
                        onChange={(e) => updateVisualDesign(char.id, 'clothing', e.target.value)}
                        className="text-xs bg-white border border-ink-200 rounded px-2 py-1 focus:outline-none"
                        placeholder="服饰"
                      />
                      <input 
                        value={char.visualDesign?.pose || ''}
                        onChange={(e) => updateVisualDesign(char.id, 'pose', e.target.value)}
                        className="text-xs bg-white border border-ink-200 rounded px-2 py-1 focus:outline-none"
                        placeholder="姿势"
                      />
                      <input 
                        value={char.visualDesign?.expression || ''}
                        onChange={(e) => updateVisualDesign(char.id, 'expression', e.target.value)}
                        className="col-span-2 text-xs bg-white border border-ink-200 rounded px-2 py-1 focus:outline-none"
                        placeholder="神态 / 表情"
                      />
                      {/* Visual Style Selector */}
                      <div className="col-span-2 relative">
                        <label className="text-[9px] font-bold text-ink-400 uppercase mb-0.5 block">{t.characters.style}</label>
                        <div className="flex gap-1">
                           <select 
                              value="" 
                              onChange={(e) => updateVisualDesign(char.id, 'style', e.target.value)}
                              className="w-8 text-xs bg-white border border-ink-200 rounded px-1 py-1 focus:outline-none"
                           >
                              <option value="" disabled>选择</option>
                              {CHARACTER_STYLES.map(s => <option key={s} value={s}>{s.split(' ')[0]}</option>)}
                           </select>
                           <input 
                             value={char.visualDesign?.style || ''}
                             onChange={(e) => updateVisualDesign(char.id, 'style', e.target.value)}
                             className="flex-1 text-xs bg-white border border-ink-200 rounded px-2 py-1 focus:outline-none"
                             placeholder="选择或输入风格..."
                           />
                        </div>
                      </div>
                   </div>
                   {char.visualDesign?.image && (
                      <div className="mt-2 relative group cursor-pointer" onClick={() => setPreviewCharId(char.id)}>
                         <img src={`data:image/png;base64,${char.visualDesign.image}`} className="w-full rounded border border-ink-200 shadow-sm" alt="Design Sheet" />
                         <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                            <span className="text-white text-xs">AI 三视图</span>
                         </div>
                      </div>
                   )}
                </div>

              </div>
            </div>
          ))}
          
          {data.characters.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-ink-400 border-2 border-dashed border-ink-200 rounded-xl bg-ink-50/50">
              <User size={48} className="mb-4 opacity-50" />
              <p>暂无角色</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
