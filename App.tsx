
import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { AICopilot } from './components/AICopilot';
import { ModuleType, ProjectData, ScriptBlockType, AppLanguage, ScriptFormat, ThemeMode, OriginalSubModule, ProductionStyle } from './types';
import { GeminiService } from './services/geminiService';
import { 
  BarChart3, 
  Sparkles, 
  ArrowRight, 
  BrainCircuit, 
  PenTool,
  Plus,
  Trash2,
  Image as ImageIcon,
  Clock,
  Loader2,
  LayoutGrid,
  Library,
  Layers,
  Search,
  BookOpen
} from 'lucide-react';

// Modules
import { OriginalStoryModule } from './components/modules/OriginalStory';
import { NovelAdaptationModule } from './components/modules/NovelAdaptation';
import { ScriptDoctorModule } from './components/modules/ScriptDoctor';

const STORAGE_KEY = 'maliang_projects_v2';

const createEmptyProject = (title = '未命名灵感'): ProjectData => ({
  id: crypto.randomUUID(),
  title,
  logline: '',
  genre: '剧情',
  updatedAt: Date.now(),
  scriptFormat: ScriptFormat.MOVIE,
  marketAnalysis: { targetAudience: '', marketPositioning: '', commercialsellingPoints: '' },
  novelChapters: [],
  characters: [],
  relationships: [],
  totalOutline: '',
  outline: [],
  plotEvents: [],
  script: [
    { id: 'b1', type: ScriptBlockType.SCENE_HEADING, content: '1-1 内景. 故事起点 - 日' },
    { id: 'b2', type: ScriptBlockType.ACTION, content: '在这个深邃的故事里，一切都始于...' },
  ]
});

export default function App() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [currentModule, setCurrentModule] = useState<ModuleType>(ModuleType.HUB);
  const [activeOriginalTab, setActiveOriginalTab] = useState<OriginalSubModule>(OriginalSubModule.LOGLINE);
  const [isAiOpen, setIsAiOpen] = useState(true);
  const [language, setLanguage] = useState<AppLanguage>('zh-CN');
  const [themeMode, setThemeMode] = useState<ThemeMode>('night');
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load from LocalStorage
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

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  const updateActiveProject = (newData: Partial<ProjectData>) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => 
      p.id === activeProjectId 
        ? { ...p, ...newData, updatedAt: Date.now() } 
        : p
    ));
  };

  const createNewProject = () => {
    const newProj = createEmptyProject();
    setProjects(prev => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    setCurrentModule(ModuleType.DASHBOARD);
  };

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("确定要删除这份剧本吗？灵感一旦抹除将无法找回。")) {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (activeProjectId === id) setActiveProjectId(null);
    }
  };

  const handleGenerateCover = async () => {
    if (!activeProject) return;
    setIsGeneratingCover(true);
    try {
      const prompt = `A professional cinematic vertical movie poster (9:16) for a script titled "${activeProject.title}". Genre: ${activeProject.genre}. Theme: ${activeProject.logline}. High quality, atmospheric lighting, minimal typography.`;
      const base64 = await GeminiService.generateImage(prompt, '9:16');
      if (base64) {
        updateActiveProject({ coverImage: base64 });
      }
    } catch (e) {
      alert("封面生成失败，请检查网络或稍后重试。");
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleUploadCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      updateActiveProject({ coverImage: base64 });
    };
    reader.readAsDataURL(file);
  };

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderModule = () => {
    if (currentModule === ModuleType.HUB) {
      return (
        <div className="h-full overflow-y-auto px-10 py-16 flex flex-col bg-ink-950 transition-all">
          <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="animate-fadeIn">
              <div className="flex items-center gap-3 text-accent-500 mb-2">
                 <Library size={24} />
                 <span className="text-xs font-black uppercase tracking-[0.4em]">Personal Collection</span>
              </div>
              <h1 className="text-6xl font-serif font-bold text-ink-100 tracking-tighter">剧本作品馆</h1>
            </div>

            <div className="flex items-center gap-6 w-full md:w-auto">
               <div className="relative group flex-1 md:w-72">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-600 group-focus-within:text-accent-500 transition-colors" size={18} />
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索标题或类型..."
                    className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-sm text-ink-100 focus:outline-none focus:border-accent-500/50 transition-all placeholder:text-ink-700"
                  />
               </div>
               <button 
                onClick={createNewProject}
                className="px-8 py-4 bg-white text-ink-950 rounded-2xl font-black text-xs uppercase hover:bg-accent-500 hover:text-white transition-all shadow-2xl flex items-center gap-3 shrink-0 active:scale-95"
               >
                <Plus size={20} /> 开启新剧本
               </button>
            </div>
          </header>

          {filteredProjects.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-40 border-2 border-dashed border-white/5 rounded-[60px] animate-pulse">
               <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8">
                  <PenTool size={48} className="text-ink-800" />
               </div>
               <p className="font-serif italic text-ink-600 text-xl mb-4">“每个伟大的作品，都始于一张白纸。”</p>
               <p className="font-mono uppercase tracking-[0.5em] text-[10px] text-ink-800">No scripts found in your archives</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10 pb-32">
              {filteredProjects.map((project, idx) => (
                <div 
                  key={project.id}
                  onClick={() => {
                    setActiveProjectId(project.id);
                    setCurrentModule(ModuleType.DASHBOARD);
                  }}
                  className="group relative aspect-[9/16] glass-card rounded-[40px] overflow-hidden cursor-pointer hover:-translate-y-3 transition-all border-white/5 animate-fadeIn"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {project.coverImage ? (
                    <img 
                      src={`data:image/png;base64,${project.coverImage}`} 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-70 group-hover:opacity-100" 
                      alt={project.title}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-ink-900 to-ink-950 flex flex-col items-center justify-center p-8 text-center">
                       <LayoutGrid size={48} className="text-ink-800 mb-6" />
                       <span className="text-ink-700 text-[9px] uppercase font-black tracking-[0.3em]">No Visual Key Identified</span>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent p-10 flex flex-col justify-end transition-all">
                    <div className="mb-4">
                       <span className="text-[10px] font-black px-3 py-1 bg-accent-500 text-white rounded-lg uppercase tracking-widest shadow-lg shadow-accent-950/30">
                          {project.genre}
                       </span>
                    </div>
                    <h3 className="text-3xl font-serif font-bold text-white mb-3 leading-[1.1] tracking-tight group-hover:text-accent-400 transition-colors">
                      {project.title}
                    </h3>
                    <div className="flex items-center gap-4 text-ink-500 text-[10px] font-mono uppercase tracking-widest">
                       <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="mt-8 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                       <button className="flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-[0.2em]">
                          继续创作 <ArrowRight size={14} className="text-accent-500" />
                       </button>
                       <button 
                         onClick={(e) => deleteProject(project.id, e)}
                         className="p-3 bg-red-600/10 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all border border-red-500/20"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </div>
                  <div className="absolute top-0 left-0 w-full h-1 bg-accent-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (!activeProject) return null;

    switch (currentModule) {
      case ModuleType.DASHBOARD:
        return (
          <div className="h-full overflow-y-auto px-10 py-16 flex flex-col items-center animate-fadeIn">
            <header className="text-center mb-20 max-w-4xl w-full">
              <div className="relative group mx-auto mb-12 w-72 aspect-[9/16] glass-card rounded-[50px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.6)] border-white/5">
                 {activeProject.coverImage ? (
                   <img src={`data:image/png;base64,${activeProject.coverImage}`} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                 ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center opacity-10 bg-gradient-to-br from-ink-800 to-ink-950">
                      <ImageIcon size={64} />
                      <p className="mt-4 text-[10px] uppercase font-black tracking-widest">Visual DNA Pending</p>
                   </div>
                 )}
                 <div className="absolute inset-0 bg-ink-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-10 gap-5 backdrop-blur-sm">
                    <button 
                      onClick={handleGenerateCover}
                      disabled={isGeneratingCover}
                      className="w-full py-4 bg-accent-500 text-white rounded-[24px] font-black text-xs uppercase flex items-center justify-center gap-3 hover:bg-accent-400 transition-all shadow-xl active:scale-95"
                    >
                      {isGeneratingCover ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      AI 智能生成封面
                    </button>
                    <label className="w-full py-4 bg-white text-ink-950 rounded-[24px] font-black text-xs uppercase flex items-center justify-center gap-3 cursor-pointer hover:bg-ink-100 transition-all shadow-xl active:scale-95">
                      <ImageIcon size={16} /> 上传本地海报
                      <input type="file" accept="image/*" onChange={handleUploadCover} className="hidden" />
                    </label>
                    <p className="text-[9px] text-ink-500 uppercase tracking-widest font-mono">Recommend aspect ratio 9:16</p>
                 </div>
              </div>

              <div className="flex flex-col items-center max-w-2xl mx-auto">
                 <input 
                    value={activeProject.title}
                    onChange={(e) => updateActiveProject({ title: e.target.value })}
                    className="bg-transparent text-6xl font-serif font-bold text-center border-none focus:text-accent-400 outline-none transition-all w-full mb-8 tracking-tighter"
                    placeholder="请输入剧本标题"
                 />
                 <div className="flex items-center gap-4 mb-10">
                    <select 
                      value={activeProject.genre}
                      onChange={(e) => updateActiveProject({ genre: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded-full px-6 py-2 text-xs font-bold text-ink-400 outline-none hover:border-accent-500 transition-all cursor-pointer"
                    >
                       <option value="剧情">剧情</option>
                       <option value="科幻">科幻</option>
                       <option value="悬疑">悬疑</option>
                       <option value="喜剧">喜剧</option>
                       <option value="武侠">武侠</option>
                       <option value="爱情">爱情</option>
                    </select>
                    <div className="w-1.5 h-1.5 rounded-full bg-ink-800"></div>
                    <span className="text-[10px] font-mono text-ink-600 uppercase tracking-widest">Modified: {new Date(activeProject.updatedAt).toLocaleTimeString()}</span>
                 </div>
                 <textarea 
                    value={activeProject.logline}
                    onChange={(e) => updateActiveProject({ logline: e.target.value })}
                    className="w-full bg-transparent text-xl font-serif italic text-ink-400 text-center leading-relaxed outline-none resize-none h-24 placeholder:opacity-20"
                    placeholder="“此处输入一句话梗概，它是你作品的灵魂...”"
                 />
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full max-w-6xl pb-32">
              <button 
                onClick={() => setCurrentModule(ModuleType.PROJECT_ANALYSIS)}
                className="glass-card p-10 rounded-[50px] text-left transition-all hover:-translate-y-4 flex flex-col h-[400px] group border-white/5"
              >
                <div className="bg-blue-600/10 w-20 h-20 rounded-[28px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-xl shadow-blue-900/10">
                  <BarChart3 className="text-blue-500" size={36} />
                </div>
                <h3 className="text-3xl font-serif font-bold mb-4 text-ink-100 group-hover:text-blue-400 transition-colors">项目分析 Matrix</h3>
                <p className="text-ink-500 text-sm leading-relaxed mb-auto opacity-70">通过神经网络诊断剧本的结构性缺陷，并对比漫剧、动态漫与真人短剧的三大市场表现。</p>
                <div className="flex items-center text-blue-500 font-black text-xs uppercase tracking-widest mt-8">
                  进入分析终端 <ArrowRight size={18} className="ml-3 group-hover:translate-x-2 transition-transform" />
                </div>
              </button>

              <button 
                onClick={() => {
                  setCurrentModule(ModuleType.ORIGINAL_STORY);
                  setActiveOriginalTab(OriginalSubModule.LOGLINE);
                }}
                className="glass-card p-10 rounded-[50px] text-left transition-all hover:-translate-y-4 flex flex-col h-[400px] border-accent-500/20 group shadow-2xl shadow-accent-950/20"
              >
                <div className="bg-accent-500/10 w-20 h-20 rounded-[28px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-xl shadow-accent-950/10">
                  <PenTool className="text-accent-400" size={36} />
                </div>
                <h3 className="text-3xl font-serif font-bold mb-4 text-ink-100 group-hover:text-accent-400 transition-colors">原创故事 Creation</h3>
                <p className="text-ink-500 text-sm leading-relaxed mb-auto opacity-70">从灵感瞬间到完整分集。深度集成 Logline 扩写、人物建模、事件矩阵与沉浸式剧本编辑器。</p>
                <div className="flex items-center text-accent-400 font-black text-xs uppercase tracking-widest mt-8">
                  开启创作工坊 <ArrowRight size={18} className="ml-3 group-hover:translate-x-2 transition-transform" />
                </div>
              </button>

              <button 
                onClick={() => setCurrentModule(ModuleType.NOVEL_ADAPTATION)}
                className="glass-card p-10 rounded-[50px] text-left transition-all hover:-translate-y-4 flex flex-col h-[400px] group border-white/5"
              >
                <div className="bg-purple-600/10 w-20 h-20 rounded-[28px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-xl shadow-purple-900/10">
                  <BrainCircuit className="text-purple-400" size={36} />
                </div>
                <h3 className="text-3xl font-serif font-bold mb-4 text-ink-100 group-hover:text-purple-400 transition-colors">小说改编 Lab</h3>
                <p className="text-ink-500 text-sm leading-relaxed mb-auto opacity-70">将长篇原著重构为结构化的视听语言。利用 AI 自动提取关键节拍，实现网文到短剧的高效转化。</p>
                <div className="flex items-center text-purple-400 font-black text-xs uppercase tracking-widest mt-8">
                  启动改编套件 <ArrowRight size={18} className="ml-3 group-hover:translate-x-2 transition-transform" />
                </div>
              </button>
            </div>
            <div className="mt-12">
               <button 
                onClick={() => setCurrentModule(ModuleType.HUB)}
                className="flex items-center gap-2 text-ink-600 hover:text-ink-100 transition-colors text-xs font-black uppercase tracking-widest"
               >
                 <Library size={14} /> 返回剧本作品馆
               </button>
            </div>
          </div>
        );

      case ModuleType.ORIGINAL_STORY:
      case ModuleType.CHARACTERS:
      case ModuleType.OUTLINE:
      case ModuleType.PLOT:
      case ModuleType.SCRIPT: {
        let tab = activeOriginalTab;
        if (currentModule === ModuleType.CHARACTERS) tab = OriginalSubModule.CHARACTERS;
        else if (currentModule === ModuleType.OUTLINE) tab = OriginalSubModule.OUTLINE;
        else if (currentModule === ModuleType.PLOT) tab = OriginalSubModule.PLOT;
        else if (currentModule === ModuleType.SCRIPT) tab = OriginalSubModule.SCRIPT;

        return (
          <OriginalStoryModule 
            data={activeProject} 
            update={updateActiveProject} 
            language={language} 
            activeTab={tab} 
            setActiveTab={(newTab) => {
              setActiveOriginalTab(newTab);
              if (newTab === OriginalSubModule.CHARACTERS) setCurrentModule(ModuleType.CHARACTERS);
              else if (newTab === OriginalSubModule.OUTLINE) setCurrentModule(ModuleType.OUTLINE);
              else if (newTab === OriginalSubModule.PLOT) setCurrentModule(ModuleType.PLOT);
              else if (newTab === OriginalSubModule.SCRIPT) setCurrentModule(ModuleType.SCRIPT);
              else setCurrentModule(ModuleType.ORIGINAL_STORY);
            }} 
          />
        );
      }
      
      case ModuleType.NOVEL_ADAPTATION:
      case ModuleType.NOVEL:
        return <NovelAdaptationModule data={activeProject} update={updateActiveProject} language={language} />;

      case ModuleType.PROJECT_ANALYSIS:
      case ModuleType.DOCTOR:
        return <ScriptDoctorModule data={activeProject} update={updateActiveProject} language={language} />;

      default:
        return null;
    }
  };

  return (
    <div className={`flex h-screen w-full bg-ink-950 overflow-hidden transition-all duration-500 theme-${themeMode}`}>
      <Navigation 
        currentModule={currentModule} 
        setModule={(mod) => {
          setCurrentModule(mod);
          if (mod === ModuleType.CHARACTERS) setActiveOriginalTab(OriginalSubModule.CHARACTERS);
          else if (mod === ModuleType.OUTLINE) setActiveOriginalTab(OriginalSubModule.OUTLINE);
          else if (mod === ModuleType.PLOT) setActiveOriginalTab(OriginalSubModule.PLOT);
          else if (mod === ModuleType.SCRIPT) setActiveOriginalTab(OriginalSubModule.SCRIPT);
        }} 
        language={language} 
        setLanguage={setLanguage} 
        themeMode={themeMode} 
        setThemeMode={setThemeMode} 
      />
      
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-transparent">
        <div className="h-20 border-b border-ink-900 flex items-center justify-between px-10 bg-ink-950/40 backdrop-blur-2xl z-40 transition-colors">
          <div className="flex items-center gap-6">
             <button 
              onClick={() => setCurrentModule(ModuleType.HUB)} 
              className={`flex items-center gap-3 transition-all group ${currentModule === ModuleType.HUB ? 'text-accent-500' : 'text-ink-500 hover:text-ink-100'}`}
             >
               <div className={`p-2 rounded-xl transition-all ${currentModule === ModuleType.HUB ? 'bg-accent-500 text-white' : 'bg-white/5 group-hover:bg-white/10'}`}>
                  <LayoutGrid size={18} />
               </div>
               <span className="text-xs font-black uppercase tracking-widest">作品馆</span>
             </button>
             
             {activeProject && currentModule !== ModuleType.HUB && (
               <>
                 <div className="w-1.5 h-1.5 rounded-full bg-ink-800"></div>
                 <button 
                  onClick={() => setCurrentModule(ModuleType.DASHBOARD)} 
                  className={`flex items-center gap-2 transition-all group ${currentModule === ModuleType.DASHBOARD ? 'text-accent-400' : 'text-ink-500 hover:text-ink-100'}`}
                 >
                   <span className="text-xs font-black uppercase tracking-widest truncate max-w-[200px]">{activeProject.title}</span>
                 </button>
               </>
             )}
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsAiOpen(!isAiOpen)} 
              className={`flex items-center gap-3 px-6 py-2.5 rounded-full border transition-all text-[10px] font-black uppercase tracking-widest
                ${isAiOpen ? 'bg-accent-500 text-white border-accent-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-white/5 text-accent-500 border-accent-500/30'}`}
            >
              <Sparkles size={16} /> AI CO-PILOT {isAiOpen ? 'ACTIVE' : 'READY'}
            </button>
          </div>
        </div>

        <div className="flex-1 h-full overflow-hidden relative">
          {renderModule()}
        </div>
      </main>

      {isAiOpen && (
        <div className="w-[420px] border-l border-ink-900 z-50 bg-ink-950/90 backdrop-blur-3xl">
          <AICopilot projectData={activeProject || createEmptyProject()} activeModule={currentModule} updateProject={updateActiveProject} language={language} />
        </div>
      )}
    </div>
  );
}
