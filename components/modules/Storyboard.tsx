
import React, { useState, useRef } from 'react';
import { ProjectData, ScriptBlock, ScriptBlockType, ShotType, CameraAngle, StoryboardData, CameraMovement, AspectRatio, AppLanguage } from '../../types';
import { GeminiService } from '../../services/geminiService';
import { Wand2, Image as ImageIcon, Camera, User, RefreshCw, Sparkles, Loader2, Music, Video, Maximize, Film, Palette, Smartphone, Monitor, Square, MessageCircle, Plus, Clapperboard, Trash2, Upload } from 'lucide-react';
import { getTranslation } from '../../utils/translations';
import { ImagePreviewModal } from '../ImagePreviewModal';

interface StoryboardProps {
  data: ProjectData;
  update: (data: Partial<ProjectData>) => void;
  language: AppLanguage;
}

const SHOT_OPTIONS = [
  { value: ShotType.EXTREME_LONG_SHOT, label: '大远景 (ELS)' },
  { value: ShotType.LONG_SHOT, label: '远景 (LS)' },
  { value: ShotType.FULL_SHOT, label: '全景 (FS)' },
  { value: ShotType.MEDIUM_SHOT, label: '中景 (MS)' },
  { value: ShotType.CLOSE_UP, label: '特写 (CU)' },
  { value: ShotType.EXTREME_CLOSE_UP, label: '大特写 (ECU)' },
];

const ANGLE_OPTIONS = [
  { value: CameraAngle.EYE_LEVEL, label: '平视' },
  { value: CameraAngle.LOW_ANGLE, label: '仰视' },
  { value: CameraAngle.HIGH_ANGLE, label: '俯视' },
  { value: CameraAngle.DUTCH_ANGLE, label: '倾斜 (Dutch)' },
  { value: CameraAngle.OVER_SHOULDER, label: '过肩 (OTS)' },
  { value: CameraAngle.BIRD_EYE, label: '鸟瞰' },
];

const MOVEMENT_OPTIONS = [
  { value: CameraMovement.STATIC, label: '固定' },
  { value: CameraMovement.PAN, label: '摇摄 (Pan)' },
  { value: CameraMovement.TILT, label: '俯仰 (Tilt)' },
  { value: CameraMovement.DOLLY, label: '推拉 (Dolly)' },
  { value: CameraMovement.TRACKING, label: '跟随' },
  { value: CameraMovement.CRANE, label: '升降 (Crane)' },
  { value: CameraMovement.HANDHELD, label: '手持' },
  { value: CameraMovement.ZOOM, label: '变焦' },
];

const STYLE_PRESETS = [
  '电影感', '动漫风格', '黑色电影', '赛博朋克', '水彩', '油画', '黑白', '复古', '皮克斯风格', '哥特'
];

const COMMUNICATION_PRESETS = [
  { label: '情感', value: 'Emotional, Intimate, Soft Focus, Warm Tones' },
  { label: '动感', value: 'High Contrast, Motion Blur, Dynamic Action, Vibrant' },
  { label: '紧张', value: 'Shadowy, High Contrast, Uneasy Atmosphere, Cold Tones' },
  { label: '商业', value: 'Bright, Clean, Appealing, High Saturation, Professional Lighting' },
  { label: '极简', value: 'Clean Lines, Negative Space, Simple Composition, Neutral Tones' },
  { label: '梦幻', value: 'Soft Light, Pastel Colors, Ethereal, Foggy' },
];

export const StoryboardModule: React.FC<StoryboardProps> = ({ data, update, language }) => {
  const t = getTranslation(language);
  const [loadingState, setLoadingState] = useState<Record<string, 'prompt' | 'image' | null>>({});
  const [globalStyle, setGlobalStyle] = useState("");
  
  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

  // Preview Modal State
  const [previewBlockId, setPreviewBlockId] = useState<string | null>(null);

  const visualBlocks = data.script.filter(b => 
    b.type === ScriptBlockType.SCENE_HEADING || 
    b.type === ScriptBlockType.ACTION
  );

  const getClosestAspectRatio = (ratio: number): AspectRatio => {
    const ratios: { [key: string]: number } = {
      '9:16': 9/16,
      '3:4': 3/4,
      '1:1': 1,
      '4:3': 4/3,
      '16:9': 16/9
    };
    
    let closestKey: AspectRatio = '16:9';
    let minDiff = Number.MAX_VALUE;

    for (const [key, val] of Object.entries(ratios)) {
      const diff = Math.abs(ratio - val);
      if (diff < minDiff) {
        minDiff = diff;
        closestKey = key as AspectRatio;
      }
    }
    return closestKey;
  };

  const updateBlockStoryboard = (blockId: string, updates: Partial<StoryboardData>) => {
    const updatedScript = data.script.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          storyboard: {
            shotType: ShotType.MEDIUM_SHOT,
            cameraAngle: CameraAngle.EYE_LEVEL,
            cameraMovement: CameraMovement.STATIC,
            aspectRatio: '16:9' as AspectRatio,
            customFrameRatio: 1.777,
            focalLength: '35mm',
            visualDescription: b.content,
            imagePrompt: '',
            ...b.storyboard,
            ...updates
          }
        };
      }
      return b;
    });
    update({ script: updatedScript });
  };

  const insertBlock = (type: ScriptBlockType, afterBlockId?: string) => {
    const newBlock: ScriptBlock = {
      id: crypto.randomUUID(),
      type: type,
      content: type === ScriptBlockType.SCENE_HEADING ? '新场景' : '新动作',
      storyboard: {
        shotType: ShotType.MEDIUM_SHOT,
        cameraAngle: CameraAngle.EYE_LEVEL,
        cameraMovement: CameraMovement.STATIC,
        aspectRatio: '16:9',
        customFrameRatio: 1.777,
        visualDescription: '',
        imagePrompt: '',
      }
    };

    let updatedScript = [...data.script];
    
    if (afterBlockId) {
      const index = updatedScript.findIndex(b => b.id === afterBlockId);
      if (index !== -1) {
        updatedScript.splice(index + 1, 0, newBlock);
      } else {
        updatedScript.push(newBlock);
      }
    } else {
      updatedScript.push(newBlock);
    }
    
    update({ script: updatedScript });
  };

  const deleteBlock = (id: string) => {
    const updatedScript = data.script.filter(b => b.id !== id);
    update({ script: updatedScript });
  };

  const setBlockLoading = (id: string, state: 'prompt' | 'image' | null) => {
    setLoadingState(prev => ({ ...prev, [id]: state }));
  };

  const getCharacterContext = (content: string) => {
    const foundChars = data.characters.filter(c => content.includes(c.name));
    if (foundChars.length === 0) return "";
    return foundChars.map(c => {
      const visuals = c.visualDesign || { clothing: "", pose: "" };
      return `${c.name}: ${c.age}, ${visuals.clothing}, ${visuals.pose}`;
    }).join("; ");
  };

  const handleGeneratePromptsOnly = async (block: ScriptBlock) => {
    setBlockLoading(block.id, 'prompt');
    const charContext = getCharacterContext(block.content);
    const styleToUse = block.storyboard?.visualStyle ? `${block.storyboard.visualStyle}, ${globalStyle}` : globalStyle;
    try {
      const result = await GeminiService.generateVisualPrompts(block.content, block.type, styleToUse, charContext, language);
      updateBlockStoryboard(block.id, {
        visualDescription: result.visualDescription,
        imagePrompt: result.imagePrompt,
        soundDesign: result.soundDesign,
        cameraMovement: result.cameraMovement as CameraMovement,
        focalLength: result.focalLength
      });
    } catch (e) {
      alert("生成 Prompt 失败");
    } finally {
      setBlockLoading(block.id, null);
    }
  };

  const handleSmartGenerate = async (block: ScriptBlock) => {
    const currentData = block.storyboard;
    let promptToUse = currentData?.imagePrompt;
    const aspectRatio = currentData?.aspectRatio || '16:9';
    const charContext = getCharacterContext(block.content);
    const styleToUse = block.storyboard?.visualStyle ? `${block.storyboard.visualStyle}, ${globalStyle}` : globalStyle;

    try {
      if (!promptToUse || !promptToUse.trim()) {
        setBlockLoading(block.id, 'prompt');
        const result = await GeminiService.generateVisualPrompts(block.content, block.type, styleToUse, charContext, language);
        updateBlockStoryboard(block.id, {
          visualDescription: result.visualDescription,
          imagePrompt: result.imagePrompt,
          soundDesign: result.soundDesign,
          cameraMovement: result.cameraMovement as CameraMovement,
          focalLength: result.focalLength
        });
        promptToUse = result.imagePrompt;
      }
      if (promptToUse) {
        setBlockLoading(block.id, 'image');
        const promptWithRatio = `${promptToUse}, ${aspectRatio === '9:16' ? 'Vertical, Portrait composition' : 'Cinematic, Landscape composition'}`;
        const base64Image = await GeminiService.generateImage(promptWithRatio, aspectRatio);
        if (base64Image) {
          updateBlockStoryboard(block.id, { generatedImage: base64Image });
        } else {
          alert("生成图片失败");
        }
      }
    } catch (e) {
      alert("生成过程中出错");
    } finally {
      setBlockLoading(block.id, null);
    }
  };
  
  const handleEditShotImage = async (prompt: string) => {
    if (!previewBlockId) return;
    const block = data.script.find(b => b.id === previewBlockId);
    if (!block || !block.storyboard?.generatedImage) return;

    try {
       const newImage = await GeminiService.editImage(block.storyboard.generatedImage, prompt);
       if (newImage) {
           updateBlockStoryboard(previewBlockId, { generatedImage: newImage });
       } else {
           alert("修改图片失败");
       }
    } catch (e) {
        alert("Error editing image");
    }
  };

  const handleUploadClick = (blockId: string) => {
    setUploadTargetId(blockId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadTargetId) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        // Remove metadata prefix to match Gemini format (raw base64)
        const base64 = result.replace(/^data:image\/[a-z]+;base64,/, "");
        updateBlockStoryboard(uploadTargetId, { generatedImage: base64 });
        setUploadTargetId(null);
      }
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const SchematicVisualizer = ({ shotType, angle, ratio }: { shotType: ShotType, angle: CameraAngle, ratio: AspectRatio }) => {
    let scale = 1;
    switch(shotType) {
      case ShotType.EXTREME_LONG_SHOT: scale = 0.15; break;
      case ShotType.LONG_SHOT: scale = 0.3; break;
      case ShotType.FULL_SHOT: scale = 0.6; break;
      case ShotType.MEDIUM_SHOT: scale = 1; break;
      case ShotType.CLOSE_UP: scale = 1.8; break;
      case ShotType.EXTREME_CLOSE_UP: scale = 3.5; break;
    }
    if (ratio === '9:16') scale *= 0.8;

    let containerTransform = '';
    let contentTransform = '';
    const angleText = ANGLE_OPTIONS.find(a => a.value === angle)?.label.split(' ')[0] || '';

    switch(angle) {
      case CameraAngle.LOW_ANGLE: containerTransform = 'perspective(500px) rotateX(25deg)'; contentTransform = 'translateY(-10%)'; break;
      case CameraAngle.HIGH_ANGLE: containerTransform = 'perspective(500px) rotateX(-25deg)'; contentTransform = 'translateY(10%)'; break;
      case CameraAngle.DUTCH_ANGLE: containerTransform = 'rotate(-15deg) scale(1.1)'; break;
      default: containerTransform = '';
    }

    return (
      <div className="w-full h-full bg-ink-200 flex items-center justify-center relative overflow-hidden text-ink-400">
        <div className="w-full h-full flex items-center justify-center transition-transform duration-500 origin-center" style={{ transform: containerTransform }}>
            <div className={`absolute inset-[-50%] border-ink-300/30 w-[200%] h-[200%] pointer-events-none 
              ${angle === CameraAngle.BIRD_EYE ? 'bg-[radial-gradient(circle,transparent_20%,#00000010_20%,transparent_30%)]' : 
                'bg-[linear-gradient(0deg,transparent_49%,#00000010_50%,transparent_51%),linear-gradient(90deg,transparent_49%,#00000010_50%,transparent_51%)] bg-[length:50px_50px]'
              }`}
            ></div>
            <div className="transition-transform duration-300 flex flex-col items-center justify-center relative z-10" style={{ transform: `scale(${scale}) ${contentTransform}` }}>
              <User size={128} strokeWidth={1} className="text-ink-400 drop-shadow-lg" />
            </div>
        </div>
        {angle === CameraAngle.OVER_SHOULDER && <div className="absolute -bottom-10 -left-10 w-48 h-64 bg-ink-900 rounded-full blur-md opacity-90 z-20 transform rotate-12"></div>}
        <div className="absolute inset-0 border-2 border-ink-300/20 pointer-events-none grid grid-cols-3 grid-rows-3 z-30">
             <div className="border-r border-b border-ink-300/20"></div><div className="border-r border-b border-ink-300/20"></div><div className="border-b border-ink-300/20"></div>
             <div className="border-r border-b border-ink-300/20"></div><div className="border-r border-b border-ink-300/20"></div><div className="border-b border-ink-300/20"></div>
             <div className="border-r border-ink-300/20"></div><div className="border-r border-ink-300/20"></div><div></div>
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] bg-black/60 text-white px-2 py-1 rounded backdrop-blur-sm z-40">
           {angleText}
        </div>
      </div>
    );
  };
  
  const previewBlock = data.script.find(b => b.id === previewBlockId);

  return (
    <div className="p-8 h-full overflow-y-auto">
        {/* Hidden File Input */}
        <input 
           type="file" 
           ref={fileInputRef} 
           className="hidden" 
           accept="image/*"
           onChange={handleFileChange}
        />

        {/* Image Preview Modal */}
        {previewBlock && previewBlock.storyboard?.generatedImage && (
            <ImagePreviewModal 
            isOpen={!!previewBlockId}
            onClose={() => setPreviewBlockId(null)}
            imageUrl={previewBlock.storyboard.generatedImage}
            onEditImage={handleEditShotImage}
            title={`${previewBlock.type === ScriptBlockType.SCENE_HEADING ? 'SCENE' : 'ACTION'} - ${t.storyboard.genShot}`}
            language={language}
            />
        )}

       <div className="mb-8 flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="text-3xl font-serif font-bold text-ink-900">{t.storyboard.title}</h2>
            <p className="text-ink-500 mt-1">{t.storyboard.subtitle}</p>
          </div>
          <div className="w-full md:w-auto flex flex-col items-end gap-2">
             <div className="flex items-center gap-3">
               <div className="flex flex-col items-end gap-2">
                 <input 
                   value={globalStyle}
                   onChange={(e) => setGlobalStyle(e.target.value)}
                   className="w-full md:w-80 px-3 py-2 border border-ink-200 rounded-lg text-sm bg-white focus:outline-none focus:border-accent-500 transition-all shadow-sm"
                   placeholder={t.storyboard.globalStyle}
                 />
               </div>
             </div>
             
             <div className="flex flex-wrap justify-end gap-1.5 max-w-lg">
               {STYLE_PRESETS.map(preset => (
                 <button key={preset} onClick={() => setGlobalStyle(preset)} className="px-2 py-1 bg-ink-100 hover:bg-ink-200 text-ink-600 text-[10px] rounded transition-colors">{preset}</button>
               ))}
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
          {visualBlocks.map((block, index) => {
             const sbData: StoryboardData = block.storyboard || {
                shotType: block.type === ScriptBlockType.SCENE_HEADING ? ShotType.EXTREME_LONG_SHOT : ShotType.MEDIUM_SHOT,
                cameraAngle: CameraAngle.EYE_LEVEL,
                cameraMovement: CameraMovement.STATIC,
                aspectRatio: '16:9',
                customFrameRatio: 1.777,
                visualDescription: '',
                imagePrompt: '',
                soundDesign: '',
                focalLength: '35mm'
             };
             const isLoading = loadingState[block.id] !== undefined && loadingState[block.id] !== null;
             const isLongTake = sbData.isLongTake;
             const currentNumericRatio = sbData.customFrameRatio || (sbData.aspectRatio === '9:16' ? 0.5625 : 1.777);

             return (
               <div key={block.id} className="bg-white rounded-xl border border-ink-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                  <div className={`p-3 border-b border-ink-100 flex items-center justify-between ${block.type === ScriptBlockType.SCENE_HEADING ? 'bg-ink-100' : 'bg-white'}`}>
                     <div className="flex items-center gap-3 overflow-hidden">
                       <div className="bg-ink-800 text-white text-xs font-bold px-2 py-1 rounded">#{index + 1}</div>
                       <div className="overflow-hidden">
                         <span className="text-[10px] font-bold text-ink-400 uppercase tracking-wider block">
                           {block.type === ScriptBlockType.SCENE_HEADING ? '场景 (SCENE)' : '动作 (ACTION)'}
                         </span>
                         <input 
                           value={block.content} 
                           onChange={(e) => {
                             const updatedScript = data.script.map(b => b.id === block.id ? { ...b, content: e.target.value } : b);
                             update({ script: updatedScript });
                           }}
                           className={`text-sm font-medium truncate w-full bg-transparent focus:outline-none focus:underline ${block.type === ScriptBlockType.SCENE_HEADING ? 'font-bold uppercase' : 'text-ink-700'}`}
                         />
                       </div>
                     </div>
                     <div className="flex gap-2 relative">
                        {/* Direct Action Buttons */}
                        <button 
                           onClick={() => insertBlock(ScriptBlockType.ACTION, block.id)}
                           className="p-1.5 rounded text-ink-400 hover:bg-ink-100 hover:text-ink-900 transition-colors"
                           title={t.storyboard.addAction}
                        >
                           <Plus size={16} />
                        </button>
                        <button 
                           onClick={() => insertBlock(ScriptBlockType.SCENE_HEADING, block.id)}
                           className="p-1.5 rounded text-ink-400 hover:bg-ink-100 hover:text-ink-900 transition-colors"
                           title={t.storyboard.addScene}
                        >
                           <Clapperboard size={16} />
                        </button>

                       <div className="flex items-center gap-2 bg-ink-100 rounded-lg px-2 py-1 ml-1">
                          <Smartphone size={14} className="text-ink-400" />
                          <input type="range" min="0.56" max="1.78" step="0.01" value={currentNumericRatio} onChange={(e) => { const val = parseFloat(e.target.value); updateBlockStoryboard(block.id, { customFrameRatio: val, aspectRatio: getClosestAspectRatio(val) }); }} className="w-16 md:w-20 h-1 bg-ink-300 rounded-lg appearance-none cursor-pointer accent-ink-800" />
                          <Monitor size={14} className="text-ink-400" />
                       </div>
                       <button onClick={() => updateBlockStoryboard(block.id, { isLongTake: !isLongTake })} className={`p-1.5 rounded transition-colors ${isLongTake ? 'bg-amber-100 text-amber-700' : 'text-ink-300 hover:bg-ink-100'}`} title="长镜头"><Film size={16} /></button>
                       <button 
                          onClick={() => deleteBlock(block.id)}
                          className="p-1.5 rounded text-ink-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                          title={t.common.delete}
                       >
                          <Trash2 size={16} />
                       </button>
                     </div>
                  </div>

                  <div className="bg-ink-900 w-full flex justify-center py-4 relative group overflow-hidden">
                    <div 
                        onClick={() => sbData.generatedImage && setPreviewBlockId(block.id)}
                        className={`bg-black relative shadow-2xl overflow-hidden transition-all duration-200 ${sbData.generatedImage ? 'cursor-pointer' : ''}`} 
                        style={{ width: '90%', aspectRatio: currentNumericRatio }}
                    >
                      {sbData.generatedImage ? (
                        <img src={`data:image/png;base64,${sbData.generatedImage}`} className="w-full h-full object-cover"/>
                      ) : (
                        <SchematicVisualizer shotType={sbData.shotType} angle={sbData.cameraAngle} ratio={sbData.aspectRatio || '16:9'} />
                      )}
                      {isLoading && <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20 text-white"><Loader2 size={32} className="animate-spin mb-2 text-accent-500" /></div>}
                      <div className={`absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 gap-2 ${isLoading ? 'hidden' : ''}`}>
                        <button 
                           onClick={(e) => { e.stopPropagation(); handleSmartGenerate(block); }} 
                           className="px-4 py-2 bg-accent-600 text-white rounded-full text-sm font-bold hover:bg-accent-500 transition-colors flex items-center gap-2 shadow-lg transform hover:scale-105 transition-transform"
                        >
                            {sbData.generatedImage ? <RefreshCw size={16} /> : <Sparkles size={16} />} {t.storyboard.genShot}
                        </button>
                        <button 
                           onClick={(e) => { e.stopPropagation(); handleUploadClick(block.id); }} 
                           className="px-4 py-2 bg-white text-ink-800 rounded-full text-sm font-bold hover:bg-ink-100 transition-colors flex items-center gap-2 shadow-lg transform hover:scale-105 transition-transform"
                        >
                            <Upload size={16} /> {t.storyboard.upload}
                        </button>
                        
                        {sbData.generatedImage && (
                            <div className="absolute top-2 right-2 text-white/80">
                                <Maximize size={16} />
                            </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-ink-50/50 border-b border-ink-100 grid grid-cols-2 gap-2">
                      <div><label className="text-[9px] font-bold text-ink-400 uppercase block mb-1">{t.storyboard.shotType}</label><select value={sbData.shotType} onChange={(e) => updateBlockStoryboard(block.id, { shotType: e.target.value as ShotType })} className="w-full text-xs border border-ink-200 rounded p-1 bg-white focus:outline-none focus:border-accent-500">{SHOT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                      <div><label className="text-[9px] font-bold text-ink-400 uppercase block mb-1">{t.storyboard.movement}</label><select value={sbData.cameraMovement || CameraMovement.STATIC} onChange={(e) => updateBlockStoryboard(block.id, { cameraMovement: e.target.value as CameraMovement })} className="w-full text-xs border border-ink-200 rounded p-1 bg-white focus:outline-none focus:border-accent-500">{MOVEMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                      <div><label className="text-[9px] font-bold text-ink-400 uppercase block mb-1">{t.storyboard.angle}</label><select value={sbData.cameraAngle} onChange={(e) => updateBlockStoryboard(block.id, { cameraAngle: e.target.value as CameraAngle })} className="w-full text-xs border border-ink-200 rounded p-1 bg-white focus:outline-none focus:border-accent-500">{ANGLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                       <div><label className="text-[9px] font-bold text-ink-400 uppercase block mb-1">{t.storyboard.lens}</label><input value={sbData.focalLength || ''} onChange={(e) => updateBlockStoryboard(block.id, { focalLength: e.target.value })} className="w-full text-xs border border-ink-200 rounded p-1 bg-white focus:outline-none focus:border-accent-500" placeholder="e.g. 35mm" /></div>
                  </div>

                  <div className="p-3 space-y-3 flex-1 bg-white">
                    <div className="flex items-center gap-2 bg-ink-50 p-2 rounded border border-ink-100"><Music size={12} className="text-ink-400 shrink-0"/><input value={sbData.soundDesign || ""} onChange={(e) => updateBlockStoryboard(block.id, { soundDesign: e.target.value })} className="w-full bg-transparent text-xs text-ink-600 focus:outline-none placeholder-ink-400" placeholder="声音设计..." /></div>
                    
                    {/* Long Take Inputs */}
                    {isLongTake && (
                       <div className="grid grid-cols-2 gap-2 bg-amber-50 p-2 rounded border border-amber-100">
                          <div>
                             <label className="text-[9px] font-bold text-amber-700 uppercase block mb-1">{t.storyboard.startFrame}</label>
                             <textarea 
                               value={sbData.startFrameDescription || ""}
                               onChange={(e) => updateBlockStoryboard(block.id, { startFrameDescription: e.target.value })}
                               className="w-full text-[10px] bg-white border border-amber-200 rounded p-1 resize-none h-12 focus:outline-none focus:border-amber-400"
                               placeholder="..."
                             />
                          </div>
                          <div>
                             <label className="text-[9px] font-bold text-amber-700 uppercase block mb-1">{t.storyboard.endFrame}</label>
                             <textarea 
                               value={sbData.endFrameDescription || ""}
                               onChange={(e) => updateBlockStoryboard(block.id, { endFrameDescription: e.target.value })}
                               className="w-full text-[10px] bg-white border border-amber-200 rounded p-1 resize-none h-12 focus:outline-none focus:border-amber-400"
                               placeholder="..."
                             />
                          </div>
                       </div>
                    )}

                    <div className="bg-ink-50 p-2 rounded border border-ink-100">
                       <label className="text-[9px] font-bold text-ink-400 uppercase flex items-center gap-1 mb-1"><MessageCircle size={10} /> 氛围 (Vibe)</label>
                       <select value={""} onChange={(e) => { if(e.target.value) { const currentStyle = sbData.visualStyle || ""; const sep = currentStyle ? ", " : ""; updateBlockStoryboard(block.id, { visualStyle: currentStyle + sep + e.target.value }); } }} className="w-full text-xs border border-ink-200 rounded p-1 bg-white focus:outline-none focus:border-accent-500 mb-1">
                          <option value="">+ 添加预设...</option>{COMMUNICATION_PRESETS.map(preset => (<option key={preset.label} value={preset.value}>{preset.label}</option>))}
                       </select>
                    </div>
                    <div>
                       <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold text-ink-400 uppercase">提示词 (Prompt)</label><button onClick={() => handleGeneratePromptsOnly(block)} className="text-[10px] text-accent-600 hover:text-accent-700 flex items-center gap-1 transition-colors"><Wand2 size={10} /> {t.storyboard.promptOnly}</button></div>
                       <textarea value={sbData.imagePrompt || ""} onChange={(e) => updateBlockStoryboard(block.id, { imagePrompt: e.target.value })} className="w-full text-[10px] text-ink-600 border border-ink-200 rounded p-2 bg-white resize-none h-14 focus:outline-none focus:border-accent-500 mb-2 font-mono" placeholder="Prompt..." />
                       <textarea value={sbData.visualDescription || block.content} onChange={(e) => updateBlockStoryboard(block.id, { visualDescription: e.target.value })} className="w-full text-[11px] text-ink-500 border border-ink-200 rounded p-2 bg-ink-50 resize-none h-12 focus:outline-none focus:border-ink-300" placeholder="画面描述..." />
                    </div>
                  </div>
               </div>
             );
          })}
        </div>
    </div>
  );
};
