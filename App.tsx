
import React, { useState } from 'react';
import { Navigation } from './components/Navigation';
import { AICopilot } from './components/AICopilot';
import { CharactersModule } from './components/modules/Characters';
import { NovelAdaptationModule } from './components/modules/NovelAdaptation';
import { OutlineModule } from './components/modules/Outline';
import { PlotModule } from './components/modules/Plot';
import { ScriptEditor } from './components/modules/ScriptEditor';
import { StoryboardModule } from './components/modules/Storyboard';
import { ModuleType, ProjectData, ScriptBlockType, AppLanguage, ScriptFormat } from './types';
import { TrendingUp, Users, Target, BarChart3, BookText } from 'lucide-react';
import { getTranslation } from './utils/translations';

const INITIAL_DATA: ProjectData = {
  title: '无标题作品',
  logline: '',
  genre: '剧情',
  scriptFormat: ScriptFormat.MOVIE, // Explicitly initialize script format
  marketAnalysis: {
    targetAudience: '',
    marketPositioning: '',
    commercialsellingPoints: ''
  },
  novelChapters: [],
  characters: [],
  relationships: [],
  totalOutline: '', // Initial empty total outline
  outline: [
    { 
      id: '1', 
      title: '第一幕：铺垫', 
      content: '', 
      tips: '介绍主角及其所处的世界，引发激励事件。 (0-30min)',
      scenes: []
    },
    { 
      id: '2', 
      title: '第二幕：对抗', 
      content: '', 
      tips: '主角追求目标过程中冲突升级，遭遇重重阻碍。 (30-90min)',
      scenes: []
    },
    { 
      id: '3', 
      title: '第三幕：结局', 
      content: '', 
      tips: '冲突解决后的余波，展现新的常态。 (90min+)',
      scenes: []
    },
  ],
  plotEvents: [],
  script: [
    { id: '0', type: ScriptBlockType.SCENE_HEADING, content: '内景. 地点 - 日' },
    { id: '1', type: ScriptBlockType.ACTION, content: '动作描述...' },
  ]
};

export default function App() {
  const [currentModule, setCurrentModule] = useState<ModuleType>(ModuleType.DASHBOARD);
  const [projectData, setProjectData] = useState<ProjectData>(INITIAL_DATA);
  const [isAiOpen, setIsAiOpen] = useState(true);
  const [language, setLanguage] = useState<AppLanguage>('zh-CN');

  const t = getTranslation(language);

  const [history, setHistory] = useState<ProjectData[]>([]);
  const [future, setFuture] = useState<ProjectData[]>([]);

  const undo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    
    setFuture(prev => [projectData, ...prev]);
    setProjectData(previous);
    setHistory(newHistory);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    
    setHistory(prev => [...prev, projectData]);
    setProjectData(next);
    setFuture(newFuture);
  };

  const updateProject = (newData: Partial<ProjectData>, saveHistory: boolean = false) => {
    if (saveHistory) {
      setHistory(prev => [...prev, projectData]);
      setFuture([]);
    }
    setProjectData(prev => ({ ...prev, ...newData }));
  };

  const updateMarketAnalysis = (field: keyof typeof projectData.marketAnalysis, value: string) => {
    updateProject({
      marketAnalysis: {
        ...projectData.marketAnalysis,
        [field]: value
      }
    });
  };

  const renderModule = () => {
    switch (currentModule) {
      case ModuleType.DASHBOARD:
        return (
            <div className="p-8 flex flex-col items-center h-full text-center overflow-y-auto">
                <div className="w-full max-w-4xl flex flex-col items-center pt-8">
                    <input
                      value={projectData.title}
                      onChange={(e) => updateProject({ title: e.target.value })}
                      className="text-4xl font-serif font-bold text-ink-900 mb-4 text-center bg-transparent border-b-2 border-transparent hover:border-ink-200 focus:border-accent-500 focus:outline-none w-full transition-colors placeholder-ink-300"
                      placeholder={t.dashboard.titlePlaceholder}
                    />
                    
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">{t.dashboard.genre}</span>
                      <input 
                        value={projectData.genre}
                        onChange={(e) => updateProject({ genre: e.target.value })}
                        className="text-sm font-medium text-accent-600 bg-accent-50 px-3 py-1 rounded-full text-center w-32 focus:outline-none focus:ring-1 focus:ring-accent-500"
                        placeholder="..."
                      />
                    </div>

                    <div className="w-full max-w-2xl mb-12 relative group">
                        <textarea
                            value={projectData.logline}
                            onChange={(e) => updateProject({ logline: e.target.value })}
                            className="w-full text-xl text-ink-500 italic text-center bg-transparent border border-transparent hover:border-ink-200 focus:border-accent-500 focus:outline-none resize-none rounded-lg p-2 transition-all placeholder-ink-300 min-h-[100px]"
                            placeholder={t.dashboard.loglinePlaceholder}
                        />
                    </div>
                    
                    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left">
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-ink-100 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-ink-800 font-bold text-sm mb-1">
                                <Users size={16} className="text-blue-500"/>
                                {t.dashboard.audience}
                            </div>
                            <textarea 
                                value={projectData.marketAnalysis?.targetAudience || ''}
                                onChange={(e) => updateMarketAnalysis('targetAudience', e.target.value)}
                                className="w-full text-xs text-ink-600 bg-ink-50 p-2 rounded border-transparent focus:bg-white focus:border-ink-200 outline-none resize-none h-24"
                                placeholder="..."
                            />
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-ink-100 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-ink-800 font-bold text-sm mb-1">
                                <BarChart3 size={16} className="text-purple-500"/>
                                {t.dashboard.positioning}
                            </div>
                            <textarea 
                                value={projectData.marketAnalysis?.marketPositioning || ''}
                                onChange={(e) => updateMarketAnalysis('marketPositioning', e.target.value)}
                                className="w-full text-xs text-ink-600 bg-ink-50 p-2 rounded border-transparent focus:bg-white focus:border-ink-200 outline-none resize-none h-24"
                                placeholder="..."
                            />
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-ink-100 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-ink-800 font-bold text-sm mb-1">
                                <TrendingUp size={16} className="text-emerald-500"/>
                                {t.dashboard.sellingPoints}
                            </div>
                            <textarea 
                                value={projectData.marketAnalysis?.commercialsellingPoints || ''}
                                onChange={(e) => updateMarketAnalysis('commercialsellingPoints', e.target.value)}
                                className="w-full text-xs text-ink-600 bg-ink-50 p-2 rounded border-transparent focus:bg-white focus:border-ink-200 outline-none resize-none h-24"
                                placeholder="..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
                         <div className="bg-ink-50/50 p-6 rounded-xl border border-ink-200/50">
                            <div className="text-3xl font-bold text-ink-700 mb-1">{projectData.novelChapters?.length || 0}</div>
                            <div className="text-xs font-bold text-ink-400 uppercase tracking-wider">{t.nav.novel}</div>
                        </div>
                        <div className="bg-ink-50/50 p-6 rounded-xl border border-ink-200/50">
                            <div className="text-3xl font-bold text-ink-700 mb-1">{projectData.plotEvents.length}</div>
                            <div className="text-xs font-bold text-ink-400 uppercase tracking-wider">{t.plot.beats}</div>
                        </div>
                        <div className="bg-ink-50/50 p-6 rounded-xl border border-ink-200/50">
                            <div className="text-3xl font-bold text-ink-700 mb-1">{Math.ceil(projectData.script.length / 15)}</div>
                            <div className="text-xs font-bold text-ink-400 uppercase tracking-wider">页数 (Pages)</div>
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setCurrentModule(ModuleType.NOVEL)}
                        className="px-8 py-3 bg-white border border-ink-200 text-ink-800 rounded-full font-medium hover:bg-ink-50 transition-colors shadow-sm flex items-center gap-2"
                      >
                          <BookText size={18} />
                          <span>{t.nav.novel}</span>
                      </button>
                      <button 
                        onClick={() => setCurrentModule(ModuleType.SCRIPT)}
                        className="px-8 py-3 bg-ink-900 text-white rounded-full font-medium hover:bg-accent-600 transition-colors shadow-lg flex items-center gap-2"
                      >
                          <Target size={18} />
                          <span>{t.nav.script}</span>
                      </button>
                    </div>
                </div>
            </div>
        );
      case ModuleType.CHARACTERS:
        return <CharactersModule data={projectData} update={updateProject} language={language} />;
      case ModuleType.NOVEL:
        return <NovelAdaptationModule data={projectData} update={updateProject} language={language} />;
      case ModuleType.OUTLINE:
        return <OutlineModule data={projectData} update={updateProject} language={language} />;
      case ModuleType.PLOT:
        return <PlotModule data={projectData} update={updateProject} language={language} />;
      case ModuleType.SCRIPT:
        return <ScriptEditor data={projectData} update={updateProject} undo={undo} redo={redo} language={language} />;
      case ModuleType.STORYBOARD:
        return <StoryboardModule data={projectData} update={updateProject} language={language} />;
      default:
        return <div>模块开发中</div>;
    }
  };

  return (
    <div className="flex h-screen w-full bg-ink-50 overflow-hidden">
      <Navigation currentModule={currentModule} setModule={setCurrentModule} language={language} setLanguage={setLanguage} />
      
      <main className="flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-300">
        <button 
          onClick={() => setIsAiOpen(!isAiOpen)}
          className={`absolute top-4 right-4 z-30 p-2 rounded-full shadow-md bg-white border border-ink-200 text-ink-500 hover:text-accent-500 transition-colors ${isAiOpen ? 'bg-ink-100' : ''}`}
        >
          {isAiOpen ? 
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg> : 
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2-2z"/></svg>
          }
        </button>

        <div className="flex-1 h-full overflow-hidden relative">
          {renderModule()}
        </div>
      </main>

      <div 
        className={`fixed inset-y-0 right-0 transform transition-transform duration-300 ease-in-out shadow-2xl z-20 bg-white border-l border-ink-200
          ${isAiOpen ? 'translate-x-0' : 'translate-x-full'} 
          lg:relative lg:translate-x-0 ${isAiOpen ? 'lg:w-96' : 'lg:w-0 lg:hidden'}`}
      >
        <AICopilot 
            projectData={projectData} 
            activeModule={currentModule} 
            updateProject={updateProject} 
            language={language}
        />
      </div>
    </div>
  );
}
