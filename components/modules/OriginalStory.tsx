
import React from 'react';
import { ProjectData, OriginalSubModule, AppLanguage, ScriptBlockType } from '../../types';
import { 
  Quote, 
  BookOpen, 
  Users, 
  GitMerge, 
  FileText,
  Workflow
} from 'lucide-react';

// Sub-components
import { OutlineModule } from './Outline'; // Includes Logline Expansion as per previous update
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
  
  const tabs = [
    { id: OriginalSubModule.LOGLINE, label: '灵感大纲', icon: <Quote size={18} /> },
    { id: OriginalSubModule.CHARACTERS, label: '人物建模', icon: <Users size={18} /> },
    { id: OriginalSubModule.PLOT, label: '事件矩阵', icon: <GitMerge size={18} /> },
    { id: OriginalSubModule.SCRIPT, label: '剧本沉浸', icon: <FileText size={18} /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case OriginalSubModule.LOGLINE:
      case OriginalSubModule.OUTLINE:
        return <OutlineModule data={data} update={update} language={language} />;
      case OriginalSubModule.CHARACTERS:
        return <CharactersModule data={data} update={update} language={language} />;
      case OriginalSubModule.PLOT:
        return <PlotModule data={data} update={update} language={language} />;
      case OriginalSubModule.SCRIPT:
        return <ScriptEditor data={data} update={update} undo={()=>{}} redo={()=>{}} language={language} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-ink-950">
      {/* Workflow Navigation */}
      <div className="h-12 bg-ink-900/50 border-b border-white/5 flex items-center px-4 shrink-0">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all
                ${activeTab === tab.id 
                  ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/20' 
                  : 'text-ink-400 hover:text-ink-200 hover:bg-white/5'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Creation Space */}
      <div className="flex-1 overflow-hidden relative">
        {renderContent()}
      </div>
    </div>
  );
};
