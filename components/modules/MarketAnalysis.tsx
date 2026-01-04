
import React, { useState } from 'react';
import { ProjectData, ProductionStyle, AppLanguage } from '../../types';
import { GeminiService } from '../../services/geminiService';
import { 
  Globe2, TrendingUp, Users2, Target, Dna, 
  Loader2, ArrowRight, BrainCircuit, Tv, 
  Film, Monitor, Sparkles, ChevronRight, BarChart3,
  Search, ExternalLink, ShieldCheck, X, Library,
  Flame, Trophy, LayoutList, ArrowLeftRight, Activity,
  Zap, Star, BookText, AlertCircle, Quote,
  ChevronDown, Layers, MousePointer2
} from 'lucide-react';

interface MarketAnalysisProps {
  data: ProjectData; // 当前活动剧本
  projects: ProjectData[]; // 所有已创建的剧本
  update: (data: Partial<ProjectData>) => void;
  language: AppLanguage;
}

export const MarketAnalysisModule: React.FC<MarketAnalysisProps> = ({ data, projects, update, language }) => {
  const [activeTab, setActiveTab] = useState<'trends' | 'compare' | 'global'>('trends');
  
  // Trend Hub States
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [trendData, setTrendData] = useState<any>(null);
  const [isFetchingTrends, setIsFetchingTrends] = useState(false);

  // Comparison Lab States
  const [selectedBenchmark, setSelectedBenchmark] = useState<string | null>(null);
  const [comparingProjectId, setComparingProjectId] = useState<string>(data.id);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<any>(null);

  // Global Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ text: string, sources: { uri: string, title: string }[] } | null>(null);

  const categories = ["战神爽剧", "都市言情", "悬疑反转", "热血漫剧", "重生复仇", "科幻短剧"];

  const comparingProject = projects.find(p => p.id === comparingProjectId) || data;

  const handleFetchTrends = async () => {
    const topic = customTopic.trim() || selectedCategory;
    if (!topic) {
        alert("请选择一个题材或输入自定义类型");
        return;
    }
    
    setIsFetchingTrends(true);
    setTrendData(null);
    try {
      const result = await GeminiService.fetchTrendingInsights(topic, language);
      setTrendData(result);
    } catch (e) {
      console.error(e);
      alert("分析失败，请检查网络");
    } finally {
      setIsFetchingTrends(false);
    }
  };

  const handleStartComparison = async (benchmarkTitle: string) => {
    setSelectedBenchmark(benchmarkTitle);
    setActiveTab('compare');
    setIsComparing(true);
    setComparisonResult(null);
    try {
      const result = await GeminiService.compareScriptWithBenchmark(comparingProject, benchmarkTitle, language);
      setComparisonResult(result);
    } catch (e) {
      alert("对标分析失败，请检查网络");
    } finally {
      setIsComparing(false);
    }
  };

  const handleGlobalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResult(null);
    try {
      const result = await GeminiService.searchMarketIntelligence(searchQuery, language);
      setSearchResult(result);
    } catch (e) {
      alert("情报检索失败");
    } finally {
      setIsSearching(false);
    }
  };

  const MetricRadar = ({ label, benchmarkVal, userVal, color }: { label: string, benchmarkVal: number, userVal: number, color: string }) => (
    <div className="mb-8 group">
      <div className="flex justify-between items-end mb-3">
        <span className="text-[12px] font-bold text-ink-100 tracking-wider">{label}</span>
        <div className="flex gap-4 font-mono text-[10px] font-black">
           <span className="text-ink-500 uppercase">标杆: {benchmarkVal}</span>
           <span style={{ color }} className="uppercase">本项目: {userVal}</span>
        </div>
      </div>
      <div className="h-3 bg-white/5 rounded-full overflow-hidden flex relative border border-white/5">
        <div className="h-full bg-ink-700 opacity-40 transition-all duration-1000" style={{ width: `${benchmarkVal}%` }}></div>
        <div className="h-full transition-all duration-1000 ease-out -ml-[100%] z-10 rounded-full" style={{ width: `${userVal}%`, backgroundColor: color, boxShadow: `0 0 20px ${color}80` }}></div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-ink-950 overflow-hidden animate-fadeIn font-sans">
      {/* 顶部高级导航栏 */}
      <div className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-ink-900/60 backdrop-blur-3xl shrink-0 z-50">
        <div className="flex bg-ink-950 p-1 rounded-2xl border border-white/10">
          <button 
            onClick={() => setActiveTab('trends')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all
              ${activeTab === 'trends' ? 'bg-accent-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'text-ink-500 hover:text-ink-200'}`}
          >
            <Flame size={14} /> 热度发现中心
          </button>
          <button 
            onClick={() => setActiveTab('compare')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all
              ${activeTab === 'compare' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'text-ink-500 hover:text-ink-200'}`}
          >
            <ArrowLeftRight size={14} /> AI 对标实验室
          </button>
          <button 
            onClick={() => setActiveTab('global')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all
              ${activeTab === 'global' ? 'bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'text-ink-500 hover:text-ink-200'}`}
          >
            <Globe2 size={14} /> 全网情报雷达
          </button>
        </div>
        
        <div className="hidden md:flex items-center gap-6">
           <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <div className="w-1.5 h-1.5 bg-accent-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-accent-500 uppercase tracking-widest">赛道数据实时同步中</span>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'trends' ? (
          <div className="p-12 max-w-7xl mx-auto space-y-16 animate-fadeIn pb-40">
             
             {/* 题材选择区域 - 始终显示直到开始分析 */}
             {!trendData && !isFetchingTrends && (
                 <div className="flex flex-col items-center justify-center min-h-[400px] animate-fadeIn">
                     <div className="mb-10 text-center">
                         <h2 className="text-4xl font-serif font-bold text-ink-100 mb-4">选择市场分析赛道</h2>
                         <p className="text-ink-400">请选择一个热门题材，或输入您想调研的特定类型</p>
                     </div>

                     <div className="flex flex-wrap justify-center gap-4 mb-8 max-w-2xl">
                        {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => { setSelectedCategory(cat); setCustomTopic(""); }}
                            className={`px-8 py-3 rounded-2xl text-sm font-bold transition-all border
                            ${selectedCategory === cat ? 'bg-white text-ink-950 border-white shadow-[0_15px_30px_rgba(255,255,255,0.1)] scale-105' : 'bg-transparent text-ink-500 border-white/10 hover:border-white/30 hover:text-ink-200'}`}
                        >
                            {cat}
                        </button>
                        ))}
                     </div>
                     
                     <div className="flex items-center gap-4 w-full max-w-md mb-8">
                        <div className="h-px bg-ink-800 flex-1"></div>
                        <span className="text-xs text-ink-600 font-bold uppercase">OR</span>
                        <div className="h-px bg-ink-800 flex-1"></div>
                     </div>

                     <div className="w-full max-w-md flex gap-2">
                        <input 
                            value={customTopic}
                            onChange={(e) => { setCustomTopic(e.target.value); setSelectedCategory(null); }}
                            placeholder="输入自定义题材 (如: 赛博朋克种田)..."
                            className="flex-1 bg-ink-900 border border-ink-800 rounded-xl px-4 py-3 text-ink-100 focus:border-accent-500 outline-none"
                        />
                        <button 
                            onClick={handleFetchTrends}
                            disabled={!selectedCategory && !customTopic}
                            className="px-8 py-3 bg-accent-600 text-white rounded-xl font-bold hover:bg-accent-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                        >
                            开始分析
                        </button>
                     </div>
                 </div>
             )}

             {isFetchingTrends ? (
                <div className="flex flex-col items-center justify-center py-40 space-y-8">
                   <div className="relative">
                      <div className="absolute inset-0 bg-accent-500/20 blur-[60px] animate-pulse"></div>
                      <Loader2 size={64} className="animate-spin text-accent-500 relative z-10" />
                   </div>
                   <div className="text-[12px] uppercase font-black text-ink-400 tracking-[0.8em] animate-pulse">正在深度同步全网赛道情报...</div>
                </div>
             ) : trendData ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fadeIn">
                   {/* 市场看板 */}
                   <div className="space-y-10">
                      <div className="flex items-center gap-4 mb-4">
                          <button onClick={() => setTrendData(null)} className="px-4 py-2 rounded-full border border-ink-700 text-ink-500 hover:text-ink-100 text-xs font-bold transition-all">
                             ← 切换赛道
                          </button>
                          <div className="text-xl font-bold text-accent-500">
                             当前分析: {customTopic || selectedCategory}
                          </div>
                      </div>

                      <div className="glass-card p-12 rounded-[60px] border-white/5 bg-gradient-to-br from-white/[0.05] to-transparent relative group">
                         <div className="absolute top-10 right-10 text-accent-500/5 group-hover:text-accent-500/10 transition-colors">
                            <TrendingUp size={160} />
                         </div>
                         <h3 className="text-accent-500 font-black text-[10px] uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
                            <Star size={16} /> 本周赛道综述 • MARKET SUMMARY
                         </h3>
                         <div className="relative mb-12">
                            <p className="text-3xl font-serif font-bold text-ink-50 leading-snug">
                               {trendData?.marketSummary || "情报解析中..."}
                            </p>
                         </div>
                         <div className="p-10 rounded-[40px] bg-ink-950/40 border border-white/5 shadow-inner">
                            <h4 className="text-[10px] font-black text-ink-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                               <Activity size={14}/> 观众偏好脉搏 • AUDIENCE PULSE
                            </h4>
                            <p className="text-lg text-ink-200 leading-loose italic font-serif">
                              {trendData?.audiencePulse}
                            </p>
                         </div>
                      </div>
                   </div>

                   {/* 爆款列表 */}
                   <div className="space-y-6">
                      <h3 className="text-ink-500 font-black text-[10px] uppercase tracking-[0.4em] px-6 mb-6 flex items-center justify-between">
                         <div className="flex items-center gap-2"><Trophy size={14} className="text-amber-500" /> 实时影响力剧目榜单</div>
                         <div className="text-accent-500 bg-accent-500/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Hot Tracker</div>
                      </h3>
                      <div className="space-y-4">
                        {trendData?.trendingDramas?.map((drama: any, i: number) => (
                          <div key={i} className="group relative glass-card p-8 rounded-[40px] border-white/5 hover:border-accent-500/30 transition-all flex items-center justify-between overflow-hidden">
                             <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent-500/20 group-hover:bg-accent-500 transition-all"></div>
                             <div className="flex-1 pr-8">
                                <div className="flex items-baseline gap-4 mb-4">
                                   <span className="text-3xl font-serif font-bold text-ink-50 tracking-tighter">《{drama.title}》</span>
                                   <div className="text-accent-500 text-[11px] font-black font-mono">热度分 {drama.hotScore}</div>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-6">
                                   {drama.tags?.map((t: string) => (
                                     <span key={t} className="text-[10px] text-ink-400 bg-white/5 px-3 py-1 rounded-full border border-white/10 font-bold uppercase">#{t}</span>
                                   ))}
                                </div>
                                <div className="bg-ink-950/40 p-5 rounded-3xl border border-white/5 group-hover:bg-ink-950/60 transition-colors">
                                   <p className="text-sm text-ink-200 leading-relaxed font-sans">{drama.analysis}</p>
                                </div>
                             </div>
                             <button 
                               onClick={() => handleStartComparison(drama.title)}
                               className="shrink-0 w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-ink-500 group-hover:bg-accent-500 group-hover:text-white transition-all shadow-xl active:scale-95 border border-white/10"
                             >
                                <ArrowRight size={28} />
                             </button>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
             ) : null}
          </div>
        ) : activeTab === 'compare' ? (
          <div className="p-12 max-w-7xl mx-auto space-y-16 animate-fadeIn pb-40">
             {!selectedBenchmark ? (
               <div className="flex flex-col items-center justify-center py-40 opacity-20">
                  <Target size={120} className="mb-8" />
                  <p className="text-sm uppercase font-black tracking-[0.8em] text-center">请在“热度发现中心”<br/>点击爆款剧目右侧按钮开启对标</p>
               </div>
             ) : (
               <>
                  {/* 对标实验室头部 - 增加剧本选择器 */}
                  <div className="flex flex-col xl:flex-row items-center justify-between gap-12 bg-white/[0.02] p-12 rounded-[70px] border border-white/5 relative overflow-hidden shadow-2xl">
                     <div className="absolute inset-0 bg-blue-600/5 animate-pulse pointer-events-none"></div>
                     <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                        {/* 标杆端 */}
                        <div className="text-center">
                           <div className="text-[10px] text-ink-500 font-bold uppercase tracking-widest mb-4">标杆爆款剧目</div>
                           <h3 className="text-5xl font-serif font-bold text-white tracking-tighter">《{selectedBenchmark}》</h3>
                        </div>

                        {/* 对比器 */}
                        <div className="relative">
                           <div className="absolute inset-0 bg-blue-500/30 blur-3xl animate-pulse"></div>
                           <div className="w-24 h-24 rounded-[32px] bg-ink-900 border border-blue-500/40 flex items-center justify-center relative z-10 shadow-2xl">
                              <ArrowLeftRight className="text-blue-500" size={40} />
                           </div>
                        </div>

                        {/* 剧本选择端 */}
                        <div className="text-center group">
                           <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                             <LayoutList size={12} /> 我的剧本库
                           </div>
                           <div className="relative inline-block">
                              <select 
                                value={comparingProjectId}
                                onChange={(e) => setComparingProjectId(e.target.value)}
                                className="appearance-none bg-white/5 border border-white/10 rounded-2xl px-6 py-3 pr-12 text-3xl font-serif font-bold text-ink-50 outline-none hover:border-blue-500 transition-all cursor-pointer min-w-[240px] text-center"
                              >
                                {projects.map(p => (
                                  <option key={p.id} value={p.id} className="bg-ink-900 text-base">{p.title}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" size={24} />
                           </div>
                        </div>
                     </div>
                     
                     <button 
                       onClick={() => handleStartComparison(selectedBenchmark)} 
                       disabled={isComparing}
                       className="px-12 py-5 bg-blue-600 text-white rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-500 transition-all shadow-[0_20px_40px_rgba(59,130,246,0.3)] flex items-center gap-4 active:scale-95 disabled:opacity-20 shrink-0"
                     >
                       {isComparing ? <Loader2 size={24} className="animate-spin" /> : <Dna size={24} />}
                       {isComparing ? "分析引擎处理中..." : "重新运行 AI 对标报告"}
                     </button>
                  </div>

                  {isComparing ? (
                     <div className="py-40 flex flex-col items-center gap-10">
                        <div className="w-96 h-2 bg-white/5 rounded-full overflow-hidden relative shadow-inner">
                           <div className="h-full bg-blue-500 animate-progress shadow-[0_0_20px_#3b82f6]"></div>
                        </div>
                        <div className="text-[12px] text-blue-500 font-black uppercase tracking-[1em] animate-pulse">正在拆解叙事基因与爽点节奏...</div>
                     </div>
                  ) : comparisonResult ? (
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                       {/* 指标面板 */}
                       <div className="xl:col-span-4 space-y-8">
                          <div className="glass-card p-12 rounded-[60px] border-white/5 bg-gradient-to-b from-blue-600/[0.08] to-transparent">
                             <h4 className="text-blue-400 font-black uppercase text-[10px] tracking-[0.4em] mb-12 flex items-center gap-3">
                                <BarChart3 size={18} /> 基因对标数据可视化 • METRICS
                             </h4>
                             <div className="space-y-4">
                                <MetricRadar label="剧情爽感强度 (Excitement)" benchmarkVal={comparisonResult.comparisonMetrics.benchmark.excitement} userVal={comparisonResult.comparisonMetrics.user.excitement} color="#3b82f6" />
                                <MetricRadar label="题材创新程度 (Innovation)" benchmarkVal={comparisonResult.comparisonMetrics.benchmark.innovation} userVal={comparisonResult.comparisonMetrics.user.innovation} color="#10b981" />
                                <MetricRadar label="情感共鸣深度 (Emotion)" benchmarkVal={comparisonResult.comparisonMetrics.benchmark.emotion} userVal={comparisonResult.comparisonMetrics.user.emotion} color="#f43f5e" />
                                <MetricRadar label="叙事节奏密度 (Pacing)" benchmarkVal={comparisonResult.comparisonMetrics.benchmark.pacing} userVal={comparisonResult.comparisonMetrics.user.pacing} color="#fbbf24" />
                                <MetricRadar label="商业爆发潜力 (ROI)" benchmarkVal={comparisonResult.comparisonMetrics.benchmark.roi} userVal={comparisonResult.comparisonMetrics.user.roi} color="#8b5cf6" />
                             </div>
                          </div>
                       </div>

                       {/* 分析详情 */}
                       <div className="xl:col-span-8 space-y-12">
                          <div>
                             <h4 className="text-blue-400 font-black uppercase text-[10px] tracking-[0.4em] mb-10 flex items-center gap-3 px-6">
                                <AlertCircle size={18} /> 核心差距诊断与补全建议 • GAP ANALYSIS
                             </h4>
                             <div className="grid grid-cols-1 gap-8">
                                {comparisonResult.gapAnalysis?.map((gap: any, i: number) => (
                                   <div key={i} className="glass-card p-10 rounded-[50px] border-white/5 hover:border-blue-500/20 transition-all bg-white/[0.01]">
                                      <div className="text-2xl font-serif font-bold text-ink-50 mb-8 flex items-center justify-between border-b border-white/10 pb-6">
                                         {gap.aspect}
                                         <span className="text-[10px] font-mono text-blue-500 uppercase tracking-widest font-bold">Node #{i+1}</span>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-8">
                                         <div className="space-y-4">
                                            <div className="text-[10px] font-black text-ink-500 uppercase tracking-widest">爆款标杆处理方案</div>
                                            <div className="text-sm text-ink-200 bg-white/5 p-6 rounded-[24px] italic leading-relaxed border-l-4 border-accent-500/30">"{gap.benchmarkExpressed}"</div>
                                         </div>
                                         <div className="space-y-4">
                                            <div className="text-[10px] font-black text-red-500/50 uppercase tracking-widest">本项目当前短板</div>
                                            <div className="text-sm text-ink-200 bg-red-500/5 p-6 rounded-[24px] italic leading-relaxed border-l-4 border-red-500/30">"{gap.userDeficiency}"</div>
                                         </div>
                                      </div>
                                      <div className="p-8 rounded-[32px] bg-blue-600/10 border border-blue-500/20 shadow-inner">
                                         <div className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <MousePointer2 size={14}/> 补全执行方案 • DIRECTIVE
                                         </div>
                                         <p className="text-lg text-blue-50 font-bold leading-relaxed">{gap.fixAdvice}</p>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          </div>

                          {/* 专家寄语 */}
                          <div className="p-14 rounded-[60px] bg-gradient-to-br from-blue-600/20 to-transparent border border-blue-500/20 relative shadow-2xl">
                             <div className="absolute top-10 right-10 text-white/5">
                                <Quote size={120} />
                             </div>
                             <h4 className="text-blue-400 font-black uppercase text-[10px] tracking-[0.4em] mb-8">制片人专家终审意见 • FINAL VERDICT</h4>
                             <p className="text-2xl font-serif leading-relaxed text-ink-50 italic font-bold relative z-10">
                                "{comparisonResult.finalVerdict}"
                             </p>
                          </div>
                       </div>
                    </div>
                  ) : null}
               </>
             )}
          </div>
        ) : (
          <div className="p-12 max-w-6xl mx-auto flex flex-col items-center">
             <div className="text-center mb-20 space-y-6">
                <h2 className="text-6xl font-serif font-bold text-white tracking-tighter">全网爆款情报雷达</h2>
                <p className="text-ink-500 text-lg max-w-xl mx-auto leading-relaxed">
                  通过 Google Search 实时聚合全网数据，分析任意短剧的市场表现，辅助您的立项决策。
                </p>
             </div>

             <div className="w-full max-w-3xl mb-24">
               <form onSubmit={handleGlobalSearch} className="relative group">
                  <div className="absolute inset-0 bg-blue-500/10 rounded-[32px] blur-[80px] group-hover:bg-blue-500/20 transition-all"></div>
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="输入剧名，如《狂飙》或《逃出大英博物馆》..." 
                    className="relative w-full bg-ink-900/90 border border-white/10 rounded-[32px] pl-20 pr-8 py-8 text-2xl text-white focus:border-blue-500 outline-none transition-all placeholder:text-ink-700 shadow-2xl"
                  />
                  <Search size={32} className="absolute left-8 top-1/2 -translate-y-1/2 text-ink-600 group-hover:text-blue-500 transition-colors" />
                  <button 
                    type="submit" 
                    disabled={isSearching}
                    className="absolute right-6 top-1/2 -translate-y-1/2 px-10 py-4 bg-blue-600 text-white rounded-[20px] font-black text-xs uppercase hover:bg-blue-500 transition-all shadow-xl active:scale-95 disabled:opacity-30"
                  >
                    {isSearching ? <Loader2 size={20} className="animate-spin" /> : "扫描全网"}
                  </button>
               </form>
             </div>

             {searchResult ? (
               <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fadeIn pb-40">
                  <div className="lg:col-span-2 space-y-12">
                     <div className="glass-card p-14 rounded-[60px] border-white/5 bg-white/[0.01] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-5">
                           <Globe2 size={150} />
                        </div>
                        <div className="flex items-center gap-6 mb-12 pb-8 border-b border-white/10">
                           <div className="p-6 bg-blue-600/10 rounded-[30px]">
                              <Globe2 className="text-blue-500" size={40} />
                           </div>
                           <div>
                              <h3 className="text-4xl font-serif font-bold text-white tracking-tight">《{searchQuery}》情报报告</h3>
                              <div className="flex items-center gap-3 mt-4">
                                 <span className="text-[10px] text-blue-400 font-black uppercase tracking-[0.4em] bg-blue-500/10 px-3 py-1 rounded-full">SEMANTIC SCAN COMPLETED</span>
                                 <div className="w-1.5 h-1.5 bg-ink-700 rounded-full"></div>
                                 <span className="text-[10px] text-ink-500 font-mono font-bold uppercase tracking-widest">{new Date().toLocaleDateString()}</span>
                              </div>
                           </div>
                        </div>
                        <div className="prose prose-invert prose-blue max-w-none">
                           <div className="text-ink-200 text-xl leading-relaxed whitespace-pre-wrap font-serif">
                             {searchResult.text}
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-10">
                     <div className="glass-card p-10 rounded-[50px] border-white/5">
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
                           <Library size={18}/> 原始参考溯源 • SOURCES
                        </h4>
                        <div className="space-y-4">
                           {searchResult.sources.map((src, i) => (
                             <a key={i} href={src.uri} target="_blank" rel="noopener noreferrer" className="block p-6 bg-white/[0.03] rounded-[28px] border border-white/5 hover:border-blue-500/50 hover:bg-blue-600/5 transition-all group">
                                <div className="text-sm text-ink-100 font-bold mb-3 line-clamp-2 group-hover:text-blue-400 transition-colors">{src.title}</div>
                                <div className="text-[10px] text-ink-600 flex items-center gap-2 uppercase font-mono group-hover:text-ink-300 transition-colors">
                                   <ExternalLink size={12} /> {new URL(src.uri).hostname}
                                </div>
                              </a>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
             ) : isSearching ? (
                <div className="py-40 flex flex-col items-center gap-10 opacity-50">
                   <div className="w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                   <div className="text-[12px] uppercase font-black tracking-[1em] animate-pulse">正在解析全球语义节点...</div>
                </div>
             ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
