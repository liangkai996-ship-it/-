
import React from 'react';
import { ProjectData, OriginalSubModule, AppLanguage } from '../../types';
import { Quote, Users, GitMerge, FileText, Layers, ChevronRight, Layout } from 'lucide-react';

import { OutlineModule } from './Outline';
import { CharactersModule } from './Characters';
import { PlotModule } from './Plot';
import { ScriptEditor } from './ScriptEditor';

interface OriginalStoryModuleProps {
  data: ProjectData;
  update: (data: Partial<ProjectData>) => void;
  language: AppLanguage;
  activeTab: OriginalSubModule;
  setActiveTab: (tab: OriginalSubModule) => void;
}

export const OriginalStoryModule: React.FC<OriginalStoryModuleProps> = ({ data, update, language, activeTab, setActiveTab }) => {
  
  const navItems = [
    { id: OriginalSubModule.OUTLINE, label: '故事大纲', icon: Quote, desc: '生成分集结构与摘要' },
    { id: OriginalSubModule.CHARACTERS, label: '人物图谱', icon: Users, desc: '建立角色关系与弧光' },
    { id: OriginalSubModule.PLOT, label: '事件矩阵', icon: GitMerge, desc: '梳理关键情节点' },
    { id: OriginalSubModule.SCRIPT, label: '剧本正文', icon: FileText, desc: '沉浸式创作与排版' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case OriginalSubModule.CHARACTERS:
        return <CharactersModule data={data} update={update} language={language} />;
      case OriginalSubModule.PLOT:
        return <PlotModule data={data} update={update} language={language} />;
      case OriginalSubModule.OUTLINE:
      case OriginalSubModule.LOGLINE:
        return <OutlineModule data={data} update={update} language={language} />;
      case OriginalSubModule.SCRIPT:
        return <ScriptEditor data={data} update={update} undo={()=>{}} redo={()=>{}} language={language} />;
      default:
        return <OutlineModule data={data} update={update} language={language} />;
    }
  };

  return (
    <div className="h-full flex bg-ink-950 overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-ink-900/50 border-r border-ink-800 flex flex-col shrink-0 animate-fadeIn">
        <div className="h-16 flex items-center px-6 border-b border-ink-800">
           <div className="flex items-center gap-2 text-ink-100 font-bold font-serif">
              <Layers className="text-accent-500" size={20} />
              <span>创作工作流</span>
           </div>
        </div>
        
        <div className="p-4 space-y-2">
           {navItems.map((item) => {
             // Handle LOGLINE mapping to OUTLINE for visual selection
             const isActive = activeTab === item.id || (activeTab === OriginalSubModule.LOGLINE && item.id === OriginalSubModule.OUTLINE);
             return (
               <button
                 key={item.id}
                 onClick={() => setActiveTab(item.id)}
                 className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group text-left
                   ${isActive ? 'bg-accent-600 text-white shadow-lg shadow-accent-900/20' : 'hover:bg-ink-800 text-ink-500 hover:text-ink-200'}`}
               >
                 <item.icon size={18} className={isActive ? 'text-white' : 'text-ink-500 group-hover:text-accent-500 transition-colors'} />
                 <div>
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className={`text-[9px] ${isActive ? 'text-white/70' : 'text-ink-600'}`}>{item.desc}</div>
                 </div>
                 {isActive && <ChevronRight size={14} className="ml-auto opacity-50 animate-fadeIn" />}
               </button>
             );
           })}
        </div>

        {/* 底部进度指示器 (装饰性) */}
        <div className="mt-auto p-6 border-t border-ink-800">
           <div className="bg-ink-950 rounded-xl p-4 border border-ink-800">
              <div className="flex justify-between items-center mb-2">
                 <div className="text-[10px] font-black text-ink-500 uppercase tracking-widest">项目完成度</div>
                 <div className="text-[10px] font-mono text-accent-500">
                    {data.script.length > 5 ? '35%' : '10%'}
                 </div>
              </div>
              <div className="h-1 bg-ink-800 rounded-full overflow-hidden">
                 <div className="h-full bg-accent-500 transition-all duration-1000" style={{ width: data.script.length > 5 ? '35%' : '10%' }}></div>
              </div>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col bg-ink-950">
        {renderContent()}
      </div>
    </div>
  );
};
