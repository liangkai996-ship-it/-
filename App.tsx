
import React, { useState, useEffect } from 'react';
import { AICopilot } from './components/AICopilot';
import { ModuleType, ProjectData, ScriptBlockType, AppLanguage, ScriptFormat, ThemeMode, OriginalSubModule, ProjectMetadata, Character, PlotEvent, AppNotification } from './types';
import { GeminiService } from './services/geminiService';
import { 
  Plus, Library, PenTool, Sparkles, BookText, Globe2, 
  History, Save, RotateCcw, Trash2, Clock, Clapperboard, 
  Search, Loader2, X, ExternalLink, ShieldCheck, TrendingUp,
  ArrowRight, Layout, Zap, Settings, FileText, PieChart,
  Users2, Target, BarChart4, BoxSelect, Home, ChevronRight,
  LayoutDashboard, PlayCircle, Menu, CheckCircle2, AlertTriangle, Info,
  Eye, Sun
} from 'lucide-react';

import { OriginalStoryModule } from './components/modules/OriginalStory';
import { NovelAdaptationModule } from './components/modules/NovelAdaptation';
import { MarketAnalysisModule } from './components/modules/MarketAnalysis';
import { StoryboardProduction } from './components/modules/StoryboardProduction';
import { Navigation } from './components/Navigation';

const STORAGE_KEY = 'maliang_v3_store';

type ProjectSourceType = 'original' | 'adaptation' | 'storyboard' | 'market_analysis';

// --- Global Toast Component ---
const ToastContainer: React.FC<{ notifications: AppNotification[], remove: (id: string) => void }> = ({ notifications, remove }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {notifications.map(n => (
        <div 
          key={n.id} 
          className="pointer-events-auto bg-ink-900/90 backdrop-blur-xl border border-ink-800 text-ink-100 p-4 rounded-2xl shadow-2xl shadow-black/10 min-w-[320px] max-w-sm animate-fadeIn flex items-start gap-4 transform transition-all hover:scale-[1.02]"
        >
          <div className="shrink-0 mt-1">
            {n.type === 'loading' && <Loader2 size={20} className="animate-spin text-accent-500" />}
            {n.type === 'success' && <CheckCircle2 size={20} className="text-green-500" />}
            {n.type === 'error' && <AlertTriangle size={20} className="text-red-500" />}
            {n.type === 'info' && <Info size={20} className="text-blue-500" />}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-ink-50">{n.title}</h4>
            {n.message && <p className="text-xs text-ink-400 mt-1 leading-relaxed">{n.message}</p>}
            {n.action && (
              <button 
                onClick={() => { n.action?.onClick(); remove(n.id); }}
                className="mt-3 text-xs font-bold text-accent-500 hover:text-accent-600 uppercase tracking-widest flex items-center gap-1 transition-colors"
              >
                {n.action.label} <ArrowRight size={10} />
              </button>
            )}
          </div>
          <button onClick={() => remove(n.id)} className="text-ink-400 hover:text-ink-100 transition-colors">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

// --- 预设数据生成器 ---
const generatePresetData = (sourceType: ProjectSourceType): Partial<ProjectData> => {
    const base: Partial<ProjectData> = {
        title: '未命名项目',
        logline: '',
        genre: '',
        characters: [],
        relationships: [],
        script: [],
        outline: [],
        plotEvents: [],
        storyboardRows: [],
        snapshots: []
    };

    if (sourceType === 'original') {
        return {
            ...base,
            title: '新原创故事',
            totalOutline: '',
        };
    } else if (sourceType === 'adaptation') {
        return {
            ...base,
            title: '新小说改编',
            novelFullText: "",
            novelChapters: [],
            novelUploadChunks: [],
            novelDeepAnalysis: {
                worldView: '',
                mainPlot: '',
                characterProfiles: '',
                characterCards: []
            },
            novelAdaptationPlan: []
        };
    } else if (sourceType === 'storyboard') {
        return {
            ...base,
            title: '新分镜项目'
        };
    } else if (sourceType === 'market_analysis') {
        return {
            ...base,
            title: '新市场分析'
        };
    }
    return base;
};

const App: React.FC = () => {
  const [language, setLanguage] = useState<AppLanguage>('zh-CN');
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.HUB);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [originalSubModule, setOriginalSubModule] = useState<OriginalSubModule>(OriginalSubModule.OUTLINE);

  // Load from storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProjects(parsed);
      } catch (e) {
        console.error("Failed to load projects", e);
      }
    }
  }, []);

  // Save to storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const addNotification = (title: string, type: 'info' | 'success' | 'error' | 'loading', message?: string) => {
    const id = crypto.randomUUID();
    setNotifications(prev => [...prev, { id, title, type, message }]);
    if (type !== 'loading') {
      setTimeout(() => removeNotification(id), 5000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const updateProject = (updates: Partial<ProjectData>) => {
    if (!projectData) return;
    const updated = { ...projectData, ...updates, updatedAt: Date.now() };
    setProjectData(updated);
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const createProject = (sourceType: ProjectSourceType) => {
    const preset = generatePresetData(sourceType);
    const newProject: ProjectData = {
      id: crypto.randomUUID(),
      title: preset.title || '未命名项目',
      logline: preset.logline || '',
      genre: preset.genre || '',
      updatedAt: Date.now(),
      metadata: {
        sourceType,
        targetAudience: '',
        projectHighlights: '',
        marketBenchmark: ''
      },
      characters: [],
      relationships: [],
      script: [],
      outline: [],
      plotEvents: [],
      storyboardRows: [],
      novelChapters: [],
      novelFullText: '',
      totalOutline: '',
      ...preset
    } as ProjectData;

    setProjects(prev => [...prev, newProject]);
    setProjectData(newProject);
    
    // Redirect to appropriate module immediately, skipping Dashboard
    if (sourceType === 'original') setActiveModule(ModuleType.ORIGINAL_STORY);
    else if (sourceType === 'adaptation') setActiveModule(ModuleType.NOVEL_ADAPTATION);
    else if (sourceType === 'storyboard') setActiveModule(ModuleType.STORYBOARD_PRODUCTION);
    else if (sourceType === 'market_analysis') setActiveModule(ModuleType.MARKET_ANALYSIS);
    else setActiveModule(ModuleType.ORIGINAL_STORY);
  };

  const deleteProject = (id: string) => {
    if (window.confirm("⚠️ 警告：确定要永久删除此项目吗？\n\n此操作无法撤销，所有剧本、人物和分析数据将丢失。")) {
        const updatedProjects = projects.filter(p => p.id !== id);
        setProjects(updatedProjects);
        if (projectData?.id === id) {
            setProjectData(null);
            setActiveModule(ModuleType.HUB);
        }
        addNotification("项目已删除", "success");
    }
  };

  // Theme effect - simplified to just handle classes
  useEffect(() => {
    document.body.className = `font-sans antialiased overflow-hidden h-screen theme-${themeMode} transition-colors duration-500`;
  }, [themeMode]);

  if (!projectData || activeModule === ModuleType.HUB) {
    return (
      <div className={`min-h-screen bg-ink-950 text-ink-100 font-sans selection:bg-accent-500/30 transition-colors duration-500`}>
        <div className="max-w-7xl mx-auto p-12">
            <header className="mb-24 text-center relative pt-10">
                {/* Background Ambient Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-500/5 rounded-full blur-[120px] pointer-events-none"></div>
                
                {/* Logo Area */}
                <div className="relative inline-flex flex-col items-center mb-8 group cursor-default">
                    <div className="relative">
                        <h1 className="text-[10rem] leading-none font-serif font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-ink-950 to-ink-400 dark:from-ink-50 dark:to-ink-500 drop-shadow-2xl relative z-10" style={{ fontFamily: '"Noto Serif SC", serif' }}>
                            神笔
                        </h1>
                        <div className="absolute -top-2 -right-8 text-accent-500 opacity-80 rotate-12 transform group-hover:rotate-6 transition-transform duration-500">
                            <PenTool size={56} strokeWidth={1.5} className="drop-shadow-lg" />
                        </div>
                    </div>
                    <div className="text-xs font-mono font-bold text-accent-500 tracking-[1em] uppercase mt-4 ml-4 opacity-60">
                        SHENBI MALIANG
                    </div>
                </div>

                {/* Tagline Area */}
                <div className="flex items-center justify-center gap-6 mb-10 opacity-0 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                    <div className="h-px w-16 bg-gradient-to-r from-transparent via-ink-300 to-transparent opacity-50"></div>
                    <p className="text-xl md:text-2xl text-ink-400 font-light tracking-[0.15em] font-serif">
                        你的一站式专业编剧创意工作站
                    </p>
                    <div className="h-px w-16 bg-gradient-to-r from-transparent via-ink-300 to-transparent opacity-50"></div>
                </div>

                <button 
                    onClick={() => setThemeMode(themeMode === 'light' ? 'eye-care' : 'light')}
                    className="text-[10px] text-ink-400 hover:text-accent-500 transition-all flex items-center justify-center gap-2 mx-auto uppercase font-bold tracking-widest border border-transparent hover:border-accent-500/20 rounded-full px-6 py-2 hover:bg-white/5"
                >
                    {themeMode === 'light' ? <Eye size={12} /> : <Sun size={12} />} 
                    {themeMode === 'light' ? '开启护眼模式' : '返回默认外观'}
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <button onClick={() => createProject('original')} className="group relative bg-ink-900 border border-ink-800 p-8 rounded-[40px] hover:bg-accent-600 transition-all text-left overflow-hidden hover:border-transparent hover:shadow-2xl">
                    <PenTool size={40} className="mb-6 text-ink-500 group-hover:text-white" />
                    <h3 className="text-2xl font-bold text-ink-100 group-hover:text-white mb-2">原创故事</h3>
                    <p className="text-sm text-ink-500 group-hover:text-white/80">从零开始构建世界观、人物与剧本。</p>
                </button>
                <button onClick={() => createProject('adaptation')} className="group relative bg-ink-900 border border-ink-800 p-8 rounded-[40px] hover:bg-blue-600 transition-all text-left overflow-hidden hover:border-transparent hover:shadow-2xl">
                    <BookText size={40} className="mb-6 text-ink-500 group-hover:text-white" />
                    <h3 className="text-2xl font-bold text-ink-100 group-hover:text-white mb-2">小说改编</h3>
                    <p className="text-sm text-ink-500 group-hover:text-white/80">导入小说文本，AI 辅助拆解与改编。</p>
                </button>
                <button onClick={() => createProject('storyboard')} className="group relative bg-ink-900 border border-ink-800 p-8 rounded-[40px] hover:bg-amber-500 transition-all text-left overflow-hidden hover:border-transparent hover:shadow-2xl">
                    <Clapperboard size={40} className="mb-6 text-ink-500 group-hover:text-white" />
                    <h3 className="text-2xl font-bold text-ink-100 group-hover:text-white mb-2">分镜制作</h3>
                    <p className="text-sm text-ink-500 group-hover:text-white/80">AI 生成影视级分镜画面与提示词。</p>
                </button>
                <button onClick={() => createProject('market_analysis')} className="group relative bg-ink-900 border border-ink-800 p-8 rounded-[40px] hover:bg-purple-600 transition-all text-left overflow-hidden hover:border-transparent hover:shadow-2xl">
                    <LayoutDashboard size={40} className="mb-6 text-ink-500 group-hover:text-white" />
                    <h3 className="text-2xl font-bold text-ink-100 group-hover:text-white mb-2">市场分析</h3>
                    <p className="text-sm text-ink-500 group-hover:text-white/80">爆款对标与题材热度大数据分析。</p>
                </button>
            </div>
            
            {projects.length > 0 && (
                <div className="mt-20">
                    <h2 className="text-sm font-bold text-ink-500 uppercase tracking-widest mb-8">最近项目</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {projects.map(p => (
                            <div key={p.id} onClick={() => { setProjectData(p); setActiveModule(ModuleType.ORIGINAL_STORY); }} className="bg-ink-900 border border-ink-800 p-6 rounded-3xl hover:border-accent-500/50 transition-all text-left group cursor-pointer relative hover:shadow-xl">
                                <div className="text-lg font-bold text-ink-100 mb-1 group-hover:text-accent-500 transition-colors pr-8 truncate">{p.title}</div>
                                <div className="text-xs text-ink-500 font-mono">{new Date(p.updatedAt).toLocaleDateString()}</div>
                                <div className="text-[10px] text-ink-400 mt-2 line-clamp-2">{p.logline || "暂无梗概"}</div>
                                
                                <button 
                                    onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                                    className="absolute top-4 right-4 p-2 text-ink-400 hover:text-red-500 hover:bg-ink-100 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                    title="永久删除项目"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden bg-ink-950 text-ink-100`}>
      <Navigation 
        currentModule={activeModule}
        setModule={setActiveModule}
        language={language}
        setLanguage={setLanguage}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        isCopilotOpen={isCopilotOpen}
        setIsCopilotOpen={setIsCopilotOpen}
        onBackToHome={() => { setProjectData(null); setActiveModule(ModuleType.HUB); }}
      />
      
      <main className="flex-1 flex overflow-hidden relative">
         <div className="flex-1 overflow-hidden relative z-0">
            {activeModule === ModuleType.ORIGINAL_STORY && (
                <OriginalStoryModule 
                    data={projectData} 
                    update={updateProject} 
                    language={language} 
                    activeTab={originalSubModule}
                    setActiveTab={setOriginalSubModule}
                />
            )}
            {activeModule === ModuleType.NOVEL_ADAPTATION && (
                <NovelAdaptationModule 
                    data={projectData} 
                    update={updateProject} 
                    language={language}
                    addNotification={addNotification}
                />
            )}
            {activeModule === ModuleType.STORYBOARD_PRODUCTION && (
                <StoryboardProduction 
                    data={projectData} 
                    update={updateProject} 
                    language={language}
                />
            )}
            {activeModule === ModuleType.MARKET_ANALYSIS && (
                <MarketAnalysisModule 
                    data={projectData} 
                    projects={projects}
                    update={updateProject} 
                    language={language}
                />
            )}
         </div>

         {isCopilotOpen && (
             <AICopilot 
                projectData={projectData}
                activeModule={activeModule}
                updateProject={updateProject}
                language={language}
                onClose={() => setIsCopilotOpen(false)}
             />
         )}
      </main>

      <ToastContainer notifications={notifications} remove={removeNotification} />
    </div>
  );
};

export default App;
