
import React, { useState, useMemo } from 'react';
import { ProjectData, AppLanguage, DoctorAnalysis, ProductionStyle } from '../../types';
import { GeminiService } from '../../services/geminiService';
import { 
  Stethoscope, 
  Activity, 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  TrendingUp,
  BrainCircuit,
  Zap,
  BarChart4,
  Target,
  Users2,
  PieChart,
  Flame,
  Globe,
  Globe2,
  Tv,
  Film,
  Monitor,
  CheckCircle2,
  XCircle,
  BarChart3,
  Dna,
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { getTranslation } from '../../utils/translations';

interface ScriptDoctorProps {
  data: ProjectData;
  update: (data: Partial<ProjectData>) => void;
  language: AppLanguage;
}

type AnalysisTab = 'medical' | 'market';

const Waveform: React.FC<{ data: number[], color: string, label: string }> = ({ data, color, label }) => {
  const points = useMemo(() => {
    if (!data.length) return "";
    const width = 800;
    const height = 120;
    const step = width / (data.length - 1);
    return data.map((val, i) => `${i * step},${height - (val / 100) * height}`).join(' ');
  }, [data]);

  if (!data.length) return null;

  return (
    <div className="mb-8 glass-card p-6 rounded-3xl border-white/5 relative overflow-hidden group">
      <div className="scan-line opacity-20"></div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
           <div className="w-2 h-2 rounded-full shadow-[0_0_10px_#10b981]" style={{ backgroundColor: color }}></div>
           <span className="text-xs font-bold text-ink-100 uppercase tracking-widest">{label}</span>
        </div>
      </div>
      <div className="h-[120px] w-full relative">
        <svg viewBox="0 0 800 120" className="w-full h-full">
          <defs>
            <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
            className="drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]"
          />
          <polygon
            fill={`url(#grad-${label})`}
            points={`0,120 ${points} 800,120`}
          />
        </svg>
      </div>
    </div>
  );
};

export const ScriptDoctorModule: React.FC<ScriptDoctorProps> = ({ data, update, language }) => {
  const t = getTranslation(language);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('medical');
  const [selectedActId, setSelectedActId] = useState<string | null>(data.outline.length > 0 ? data.outline[0].id : null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [marketResult, setMarketResult] = useState<any>(null);
  const [tempStyle, setTempStyle] = useState<ProductionStyle>(data.productionStyle || ProductionStyle.LIVE_ACTION);

  const selectedAct = data.outline.find(a => a.id === selectedActId);

  const handleDiagnose = async () => {
    if (!selectedAct) return;
    setIsAnalyzing(true);
    try {
      const result = await GeminiService.analyzeScriptDoctor(selectedAct.title, selectedAct.content, selectedAct.scenes, language);
      const updatedOutline = data.outline.map(o => o.id === selectedActId ? { ...o, doctorAnalysis: result } : o);
      update({ outline: updatedOutline });
    } catch (e) {
      alert("诊断失败");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMarketAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await GeminiService.analyzeMarketPerformance(data.title, data.genre, data.logline, tempStyle, language);
      setMarketResult(result);
      update({ productionStyle: tempStyle });
    } catch (e) {
      alert("情报分析失败");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const MetricBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="mb-4">
      <div className="flex justify-between text-[10px] font-bold text-ink-500 uppercase mb-1.5 tracking-wider">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full shadow-[0_0_8px_currentColor]" style={{ width: `${value}%`, backgroundColor: color, color }}></div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-ink-950 overflow-hidden">
      {/* Header Tabs */}
      <div className="h-16 border-b border-white/5 flex items-center px-8 bg-ink-900/50 shrink-0 z-20 transition-colors">
         <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
            <button 
              onClick={() => setActiveTab('medical')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all
                ${activeTab === 'medical' ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/20' : 'text-ink-500 hover:text-ink-100'}`}
            >
              <Stethoscope size={16} /> 剧本结构诊断
            </button>
            <button 
              onClick={() => setActiveTab('market')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all
                ${activeTab === 'market' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-ink-500 hover:text-ink-100'}`}
            >
              <Globe2 size={16} /> 短剧爆款对标情报
            </button>
         </div>
         <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse"></div>
            <span className="text-[10px] font-mono text-ink-600 uppercase tracking-widest">Neural Analysis Console</span>
         </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'medical' ? (
          <div className="h-full flex p-8 gap-8 animate-fadeIn">
            {/* Act Sidebar */}
            <div className="w-72 flex flex-col gap-4 overflow-y-auto shrink-0 pr-4">
               <div className="text-[10px] font-mono text-ink-500 uppercase tracking-[0.2em] mb-2 px-2">Structure Nodes</div>
               {data.outline.map((act, idx) => (
                 <button
                   key={act.id}
                   onClick={() => setSelectedActId(act.id)}
                   className={`p-6 rounded-3xl text-left transition-all relative overflow-hidden group
                     ${selectedActId === act.id ? 'glass-card border-accent-500/50 shadow-xl' : 'hover:bg-white/5 text-ink-500'}`}
                 >
                   <span className="text-[10px] font-mono mb-2 block uppercase text-ink-600">BEAT 0{idx + 1}</span>
                   <span className="text-sm font-bold truncate block">{act.title || 'Untitled Beat'}</span>
                   {act.doctorAnalysis && <div className="absolute top-4 right-4"><ShieldCheck size={14} className="text-accent-500" /></div>}
                 </button>
               ))}
            </div>

            {/* Diagnosis Main */}
            <div className="flex-1 flex flex-col overflow-y-auto pr-4">
              {selectedAct ? (
                <>
                  <div className="mb-12 flex items-center justify-between">
                     <div>
                        <h2 className="text-4xl font-serif font-bold text-ink-100 tracking-tight mb-2">{selectedAct.title}</h2>
                        <div className="flex gap-4">
                           <div className="text-[10px] font-mono text-ink-600 uppercase">Scenes: {selectedAct.scenes.length}</div>
                           <div className="text-[10px] font-mono text-ink-600 uppercase">Characters involved: {data.characters.length}</div>
                        </div>
                     </div>
                     <button 
                        onClick={handleDiagnose} 
                        disabled={isAnalyzing} 
                        className="px-8 py-4 bg-white text-ink-950 rounded-[32px] font-black text-xs uppercase hover:bg-accent-500 hover:text-white transition-all shadow-2xl flex items-center gap-3 active:scale-95"
                      >
                       {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                       {isAnalyzing ? 'Scanning Neurons...' : 'Launch AI Medical Scan'}
                     </button>
                  </div>
                  {selectedAct.doctorAnalysis ? (
                     <div className="space-y-8 animate-fadeIn">
                        <Waveform data={selectedAct.doctorAnalysis.emotions} color="#ef4444" label="Emotional Resonance Curve" />
                        <Waveform data={selectedAct.doctorAnalysis.plotDensity} color="#10b981" label="Plot Intensity Distribution" />
                        
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                           <div className="glass-card p-10 rounded-[40px] border-white/5 bg-white/[0.01]">
                              <h4 className="text-accent-400 font-bold uppercase text-[10px] tracking-widest mb-6 flex items-center gap-2">
                                <AlertTriangle size={16} /> Structural Pathological Diagnosis
                              </h4>
                              <p className="text-lg font-serif leading-relaxed text-ink-200 italic opacity-80">"{selectedAct.doctorAnalysis.diagnosis}"</p>
                           </div>
                           
                           <div className="space-y-4">
                              {selectedAct.doctorAnalysis.suggestions.map((s, i) => (
                                 <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-accent-500/20 transition-all">
                                    <div className="text-[9px] font-bold text-accent-500 uppercase mb-2 tracking-widest">Correction {i+1}</div>
                                    <div className="text-sm text-ink-100 font-bold mb-2">{s.advice}</div>
                                    <div className="text-xs text-ink-400 leading-relaxed italic border-l-2 border-white/10 pl-4">{s.revision}</div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-32 opacity-10">
                       <Stethoscope size={80} className="mb-4" />
                       <div className="text-xs font-mono uppercase tracking-[0.5em]">System Ready for Diagnosis</div>
                    </div>
                  )}
                </>
              ) : <div className="text-center py-32 opacity-20 uppercase font-mono tracking-widest text-xs">Select a Node to begin</div>}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col p-8 overflow-y-auto animate-fadeIn">
             <div className="mb-12 flex flex-col xl:flex-row justify-between items-start gap-8">
                <div className="max-w-2xl">
                   <h2 className="text-4xl font-serif font-bold text-ink-100 mb-4 tracking-tight">爆款对标分析室</h2>
                   <p className="text-ink-400 text-sm leading-relaxed mb-8">
                     选择您的制作赛道，AI 将深度对标该领域近期的爆款作品，分析本项目在“漫剧、动态漫、真人”不同终端的潜在成功率与核心差距。
                   </p>
                   
                   <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 inline-flex">
                      {[
                        { id: ProductionStyle.COMIC_DRAMA, label: '漫剧', icon: <Tv size={14} /> },
                        { id: ProductionStyle.MOTION_COMIC, label: '动态漫', icon: <Monitor size={14} /> },
                        { id: ProductionStyle.LIVE_ACTION, label: '真人短剧', icon: <Film size={14} /> },
                      ].map(s => (
                        <button 
                          key={s.id}
                          onClick={() => setTempStyle(s.id)}
                          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all
                            ${tempStyle === s.id ? 'bg-blue-600 text-white shadow-lg' : 'text-ink-500 hover:text-ink-200'}`}
                        >
                          {s.icon} {s.label}
                        </button>
                      ))}
                   </div>
                </div>
                
                <button 
                  onClick={handleMarketAnalysis} 
                  disabled={isAnalyzing}
                  className="px-10 py-5 bg-blue-600 text-white rounded-[32px] font-bold text-sm uppercase hover:bg-blue-500 transition-all shadow-2xl shadow-blue-900/30 flex items-center gap-3 shrink-0 active:scale-95"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Dna size={20} />}
                  启动赛道对标分析
                </button>
             </div>

             {marketResult ? (
               <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-fadeIn pb-32">
                  {/* Left: Benchmarking & Radar (Metrics) */}
                  <div className="xl:col-span-4 space-y-8">
                     <div className="glass-card rounded-[40px] p-8 border-white/5 bg-white/[0.01]">
                        <h3 className="text-blue-400 font-bold uppercase text-[10px] tracking-widest mb-8 flex items-center gap-2">
                           <TrendingUp size={16} /> 核心维度雷达
                        </h3>
                        <div className="space-y-6">
                           <MetricBar label="剧情爽感 (Excitement)" value={marketResult.metrics.excitement} color="#3b82f6" />
                           <MetricBar label="题材创新 (Innovation)" value={marketResult.metrics.innovation} color="#10b981" />
                           <MetricBar label="情感共鸣 (Emotion)" value={marketResult.metrics.emotion} color="#f43f5e" />
                           <MetricBar label="投资回报 (ROI)" value={marketResult.metrics.roiValue} color="#fbbf24" />
                        </div>
                     </div>

                     <div className="glass-card rounded-[40px] p-8 border-white/5">
                        <h3 className="text-blue-400 font-bold uppercase text-[10px] tracking-widest mb-6 flex items-center gap-2">
                           <Users2 size={16} /> 赛道受众画像
                        </h3>
                        <div className="flex items-center gap-6 mb-8">
                           <div className="text-center">
                              <div className="text-3xl font-serif font-bold text-blue-400 mb-1">{marketResult.audience.gender.female}%</div>
                              <div className="text-[9px] text-ink-600 uppercase font-mono">Female</div>
                           </div>
                           <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden flex">
                              <div className="h-full bg-blue-400" style={{ width: `${marketResult.audience.gender.female}%` }}></div>
                              <div className="h-full bg-ink-700" style={{ width: `${marketResult.audience.gender.male}%` }}></div>
                           </div>
                           <div className="text-center">
                              <div className="text-3xl font-serif font-bold text-ink-300 mb-1">{marketResult.audience.gender.male}%</div>
                              <div className="text-[9px] text-ink-600 uppercase font-mono">Male</div>
                           </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                           {marketResult.audience.painPoints.map((p: string, i: number) => (
                             <span key={i} className="px-3 py-1.5 bg-blue-600/5 border border-blue-500/10 rounded-full text-[10px] text-blue-300">#{p}</span>
                           ))}
                        </div>
                     </div>
                  </div>

                  {/* Right: Hit Titles & Gap Analysis */}
                  <div className="xl:col-span-8 space-y-10">
                     <div>
                        <h3 className="text-blue-400 font-bold uppercase text-[10px] tracking-widest mb-6 flex items-center gap-2">
                           <Sparkles size={16} /> 同赛道爆款对标 (Hit Benchmarking)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {marketResult.benchmarking.map((hit: any, i: number) => (
                              <div key={i} className="glass-card p-6 rounded-[32px] border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent group hover:border-blue-500/30 transition-all">
                                 <div className="flex justify-between items-start mb-4">
                                    <div className="text-lg font-bold text-ink-100">{hit.title}</div>
                                    <div className="px-3 py-1 bg-blue-600/10 rounded-full text-[10px] font-bold text-blue-400 border border-blue-500/20">匹配度 {hit.similarity}%</div>
                                 </div>
                                 <div className="text-[9px] font-bold text-ink-500 uppercase mb-2 tracking-widest">爆款密码 (Success Factor)</div>
                                 <p className="text-xs text-ink-400 leading-relaxed italic">"{hit.keySuccessFactor}"</p>
                              </div>
                           ))}
                        </div>
                     </div>

                     <div className="glass-card rounded-[40px] p-10 border-white/5 bg-white/[0.01]">
                        <h3 className="text-amber-500 font-bold uppercase text-[10px] tracking-widest mb-8 flex items-center gap-2">
                           <Target size={16} /> 爆款差距诊断 (Gap Analysis)
                        </h3>
                        <div className="space-y-6">
                           {marketResult.gaps.map((gap: any, i: number) => (
                              <div key={i} className="flex gap-6 items-start group">
                                 <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center font-bold text-amber-500 shrink-0 border border-amber-500/20">0{i+1}</div>
                                 <div className="flex-1">
                                    <div className="text-sm font-bold text-ink-100 mb-1 flex items-center gap-2">
                                       {gap.aspect}
                                       <ArrowRight size={12} className="text-ink-600 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                    <p className="text-xs text-ink-500 mb-3">{gap.description}</p>
                                    <div className="text-[11px] text-amber-400 font-bold bg-amber-500/5 px-4 py-3 rounded-2xl border border-amber-500/10">建议：{gap.advice}</div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>

                     <div className="p-10 rounded-[40px] border border-blue-500/20 bg-blue-600/5 relative overflow-hidden group">
                        <div className="scan-line opacity-5"></div>
                        <h3 className="text-blue-400 font-bold uppercase text-[10px] tracking-widest mb-4 flex items-center gap-2">
                           <BrainCircuit size={16} /> 专家终审评语 (Final Verdict)
                        </h3>
                        <p className="text-xl font-serif leading-relaxed text-ink-100 italic">
                           "{marketResult.finalVerdict}"
                        </p>
                     </div>
                  </div>
               </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center opacity-10 py-32 animate-pulse">
                  <Globe2 size={100} className="mb-6" />
                  <p className="text-xs font-mono uppercase tracking-[0.8em]">Select format and start analysis</p>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

const RefreshCw = ({ className, size }: { className?: string, size?: number }) => (
  <svg className={`${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
);
