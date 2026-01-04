
import React, { useState, useMemo } from 'react';
import { ProjectData, StoryboardRow, AppLanguage, ScriptBlock, ScriptBlockType } from '../../types';
import { GeminiService } from '../../services/geminiService';
import { 
  Clapperboard, Plus, Trash2, Wand2, 
  Download, Copy, RefreshCw, Zap, 
  Settings, Camera, Music, MessageSquare, 
  Clock, Image as ImageIcon, Sparkles, Loader2,
  ChevronDown, Eye, Filter, Package, Globe, ShieldCheck
} from 'lucide-react';

export const StoryboardProduction: React.FC<{ data: ProjectData, update: any, language: AppLanguage }> = ({ data, update, language }) => {
  const [aesthetic, setAesthetic] = useState("");
  const [directorialVision, setDirectorialVision] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [polishingId, setPolishingId] = useState<string | null>(null);
  const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState<number>(-1); 

  const episodes = useMemo(() => {
    const segments: { title: string, blocks: ScriptBlock[] }[] = [];
    let currentSegment: ScriptBlock[] = [];
    let currentTitle = "未分类片段";

    data.script.forEach((block) => {
      if (block.type === ScriptBlockType.SCENE_HEADING) {
        if (currentSegment.length > 0) {
          segments.push({ title: currentTitle, blocks: currentSegment });
        }
        currentSegment = [block];
        currentTitle = block.content || `片段 ${segments.length + 1}`;
      } else {
        currentSegment.push(block);
      }
    });

    if (currentSegment.length > 0) {
      segments.push({ title: currentTitle, blocks: currentSegment });
    }
    return segments;
  }, [data.script]);

  const handleSyncFromScript = async () => {
    if (data.script.length === 0) return;
    
    const blocksToProcess = selectedEpisodeIndex === -1 
      ? data.script 
      : episodes[selectedEpisodeIndex].blocks;

    if (blocksToProcess.length === 0) {
        alert("选定范围无剧本内容");
        return;
    }

    setIsGenerating(true);
    try {
      const rows = await GeminiService.generateProductionStoryboard(
        blocksToProcess, 
        aesthetic, 
        directorialVision,
        data.title,
        language
      );
      
      const newRowsWithIds = rows.map(r => ({ ...r, id: crypto.randomUUID() }));
      
      if (selectedEpisodeIndex === -1) {
        update({ storyboardRows: newRowsWithIds });
      } else {
        update({ storyboardRows: [...data.storyboardRows, ...newRowsWithIds] });
      }
    } catch (e) {
      console.error(e);
      alert("生成失败，请检查网络或 API 配置");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateRow = (id: string, field: keyof StoryboardRow, value: string) => {
    update({ storyboardRows: data.storyboardRows.map(r => r.id === id ? { ...r, [field]: value } : r) });
  };

  const handlePolishPrompt = async (row: StoryboardRow) => {
    setPolishingId(row.id);
    try {
      const polished = await GeminiService.polishAiPrompt(row, aesthetic, directorialVision, language);
      updateRow(row.id, 'aiPrompt', polished);
    } finally {
      setPolishingId(null);
    }
  };

  const addRow = () => {
    const newRow: StoryboardRow = {
      id: crypto.randomUUID(),
      shotIndex: (data.storyboardRows.length + 1).toString().padStart(2, '0'),
      sceneName: '新场景',
      character: '',
      props: '', 
      visualContent: '',
      shotType: '中景',
      movement: '固定',
      sound: '',
      dialogue: '',
      duration: '3s',
      aiPrompt: ''
    };
    update({ storyboardRows: [...data.storyboardRows, newRow] });
  };

  return (
    <div className="h-full flex flex-col bg-ink-950 overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="bg-ink-900 border-b border-ink-700 flex flex-col shrink-0">
        <div className="h-16 flex items-center justify-between px-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
               <Clapperboard className="text-accent-500" size={24} />
               <h2 className="text-xl font-serif font-bold text-ink-100 uppercase tracking-tight">导演分镜控制台 (Director Storyboard)</h2>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-accent-500/10 rounded-full border border-accent-500/20">
               <Globe size={12} className="text-accent-500"/>
               <span className="text-[9px] font-black text-accent-500 uppercase tracking-widest">Universal AIGC Protocol Enabled</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-ink-800 px-4 py-2 rounded-xl border border-ink-700">
                <Filter size={14} className="text-ink-500" />
                <select 
                   value={selectedEpisodeIndex} 
                   onChange={(e) => setSelectedEpisodeIndex(parseInt(e.target.value))}
                   className="bg-transparent text-xs font-bold text-ink-100 outline-none cursor-pointer min-w-[120px]"
                >
                   <option value={-1}>全部剧本内容</option>
                   {episodes.map((ep, idx) => (
                     <option key={idx} value={idx}>{ep.title}</option>
                   ))}
                </select>
             </div>

             <button 
               onClick={handleSyncFromScript} 
               disabled={isGenerating} 
               className="flex items-center gap-2 px-6 py-2.5 bg-accent-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-accent-400 transition-all shadow-lg shadow-accent-950/20 disabled:opacity-30"
             >
                {isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                {selectedEpisodeIndex === -1 ? "全剧同步生成" : "选定范围生成"}
             </button>
             <button className="p-2.5 bg-ink-800 text-ink-300 hover:text-white rounded-xl border border-ink-700 transition-all"><Download size={20} /></button>
          </div>
        </div>

        <div className="px-8 pb-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
           <div className="bg-ink-950/50 p-3 rounded-2xl border border-ink-700 flex flex-col gap-2">
              <label className="text-[10px] font-black text-accent-500 uppercase flex items-center gap-2">
                <Camera size={12}/> 视觉美学 (Aesthetic & Style)
              </label>
              <input 
                value={aesthetic}
                onChange={(e) => setAesthetic(e.target.value)}
                placeholder="例如: Cinematic, 8k, Kodak Film, Warm..."
                className="bg-transparent text-xs text-ink-100 outline-none w-full placeholder:text-ink-700 font-mono"
              />
           </div>
           <div className="bg-ink-950/50 p-3 rounded-2xl border border-ink-700 flex flex-col gap-2">
              <label className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-2">
                <Eye size={12}/> 导演视听阐述 (Visual Logic Context)
              </label>
              <textarea 
                value={directorialVision}
                onChange={(e) => setDirectorialVision(e.target.value)}
                rows={1}
                placeholder="描述核心视觉逻辑，锁定 AI 生成风格一致性..."
                className="bg-transparent text-xs text-ink-200 outline-none w-full placeholder:text-ink-700 resize-none leading-relaxed"
              />
           </div>
        </div>
      </div>

      {/* 表格区 */}
      <div className="flex-1 overflow-auto p-8 pt-4">
        <div className="mb-4 flex items-center gap-2 text-ink-500 text-[10px] font-mono">
           <ShieldCheck size={12} className="text-accent-500"/>
           提示词已自动优化：适配 Sora / Kling / Runway Gen-3 / ComfyUI / Midjourney V6
        </div>
        <table className="w-full border-collapse text-left min-w-[1400px]">
          <thead>
            <tr className="border-b border-ink-700 text-[10px] text-ink-500 font-black uppercase tracking-[0.2em] bg-ink-900/50 sticky top-0 z-10">
              <th className="p-4 w-16">序号</th>
              <th className="p-4 w-32">场景/人物</th>
              <th className="p-4 w-48">道具清单 (Props)</th>
              <th className="p-4 w-64">画面内容 (Visual)</th>
              <th className="p-4 w-32">景别/运镜</th>
              <th className="p-4 w-32">声音/对白</th>
              <th className="p-4 w-20">时长</th>
              <th className="p-4">全能 AIGC 提示词 (Master Prompt)</th>
              <th className="p-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {data.storyboardRows.map((row) => (
              <tr key={row.id} className="group hover:bg-accent-500/5 transition-colors">
                <td className="p-4 align-top">
                  <input value={row.shotIndex} onChange={(e) => updateRow(row.id, 'shotIndex', e.target.value)} className="w-full bg-transparent text-sm font-mono font-bold text-accent-500 outline-none" />
                </td>
                <td className="p-4 align-top space-y-2">
                   <div className="flex items-center gap-2 bg-ink-800 p-2 rounded-lg border border-ink-700">
                      <ImageIcon size={12} className="text-ink-500" />
                      <input value={row.sceneName} onChange={(e) => updateRow(row.id, 'sceneName', e.target.value)} className="bg-transparent text-[10px] text-ink-100 outline-none w-full" />
                   </div>
                   <div className="flex items-center gap-2 bg-ink-800 p-2 rounded-lg border border-ink-700">
                      <Plus size={12} className="text-ink-500" />
                      <input value={row.character} onChange={(e) => updateRow(row.id, 'character', e.target.value)} placeholder="人物..." className="bg-transparent text-[10px] text-ink-100 outline-none w-full" />
                   </div>
                </td>
                <td className="p-4 align-top">
                   <div className="flex items-start gap-2 bg-amber-500/5 p-2 rounded-lg border border-amber-500/20">
                      <Package size={12} className="text-amber-500 shrink-0 mt-1" />
                      <textarea 
                        value={row.props} 
                        onChange={(e) => updateRow(row.id, 'props', e.target.value)} 
                        placeholder="识别场景关键道具..." 
                        className="bg-transparent text-[10px] text-ink-100 outline-none w-full resize-none min-h-[60px]" 
                      />
                   </div>
                </td>
                <td className="p-4 align-top">
                  <textarea value={row.visualContent} onChange={(e) => updateRow(row.id, 'visualContent', e.target.value)} className="w-full bg-transparent text-sm text-ink-200 outline-none resize-none min-h-[80px] leading-relaxed" placeholder="描述画面细节..." />
                </td>
                <td className="p-4 align-top space-y-2">
                   <div className="flex items-center gap-2 bg-ink-800 p-2 rounded-lg">
                      <Camera size={12} className="text-ink-500" />
                      <input value={row.shotType} onChange={(e) => updateRow(row.id, 'shotType', e.target.value)} className="bg-transparent text-[10px] text-ink-100 outline-none w-full" />
                   </div>
                   <div className="flex items-center gap-2 bg-ink-800 p-2 rounded-lg">
                      <Sparkles size={12} className="text-ink-500" />
                      <input value={row.movement} onChange={(e) => updateRow(row.id, 'movement', e.target.value)} className="bg-transparent text-[10px] text-ink-100 outline-none w-full" />
                   </div>
                </td>
                <td className="p-4 align-top space-y-2">
                   <div className="flex items-center gap-2 text-ink-400 italic">
                      <Music size={12} className="shrink-0" />
                      <input value={row.sound} onChange={(e) => updateRow(row.id, 'sound', e.target.value)} placeholder="音效..." className="bg-transparent text-[10px] outline-none w-full" />
                   </div>
                   <div className="flex items-start gap-2 text-ink-200">
                      <MessageSquare size={12} className="shrink-0 mt-1" />
                      <textarea value={row.dialogue} onChange={(e) => updateRow(row.id, 'dialogue', e.target.value)} placeholder="对白..." className="bg-transparent text-[10px] outline-none w-full resize-none h-12" />
                   </div>
                </td>
                <td className="p-4 align-top">
                   <div className="flex items-center gap-2 text-ink-500 font-mono">
                      <Clock size={12} />
                      <input value={row.duration} onChange={(e) => updateRow(row.id, 'duration', e.target.value)} className="bg-transparent text-xs outline-none w-full" />
                   </div>
                </td>
                <td className="p-4 align-top">
                  <div className="relative group/prompt">
                    <textarea 
                      value={row.aiPrompt} 
                      onChange={(e) => updateRow(row.id, 'aiPrompt', e.target.value)} 
                      className="w-full bg-ink-800 border border-ink-700 rounded-xl p-4 text-[10px] font-mono text-accent-400 outline-none focus:border-accent-500 min-h-[120px] leading-relaxed transition-all"
                      placeholder="Universal Industry-standard Prompt..."
                    />
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/prompt:opacity-100 transition-opacity">
                      <button onClick={() => handlePolishPrompt(row)} disabled={polishingId === row.id} className="p-1.5 bg-accent-500 text-white rounded-lg hover:bg-accent-400 shadow-lg" title="AI 提示词重写">
                        {polishingId === row.id ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                      </button>
                      <button onClick={() => { navigator.clipboard.writeText(row.aiPrompt); }} className="p-1.5 bg-ink-700 text-ink-300 rounded-lg hover:text-white" title="复制提示词">
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="p-4 align-top">
                   <button onClick={() => update({ storyboardRows: data.storyboardRows.filter(r => r.id !== row.id) })} className="text-ink-700 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <button onClick={addRow} className="w-full mt-8 py-6 border-2 border-dashed border-ink-800 rounded-3xl text-ink-600 hover:text-accent-500 hover:border-accent-500/50 transition-all flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest">
           <Plus size={20} /> 手动插入生产分镜
        </button>
      </div>
    </div>
  );
};
