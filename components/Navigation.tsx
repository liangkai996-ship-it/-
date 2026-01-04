
import React from 'react';
import { ModuleType, AppLanguage, ThemeMode } from '../types';
import { PenTool, BookText, Clapperboard, ChevronRight, Home, Settings, Eye, Bot, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { getTranslation } from '../utils/translations';

interface NavigationProps {
  currentModule: ModuleType;
  setModule: (m: ModuleType) => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isCopilotOpen: boolean;
  setIsCopilotOpen: (isOpen: boolean) => void;
  onBackToHome: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  currentModule, setModule, language, setLanguage, 
  themeMode, setThemeMode, 
  isCopilotOpen, setIsCopilotOpen,
  onBackToHome 
}) => {
  const t = getTranslation(language);

  const navItems = [
    { type: ModuleType.ORIGINAL_STORY, label: '原创故事', icon: <PenTool size={18} /> },
    { type: ModuleType.NOVEL_ADAPTATION, label: '小说改编', icon: <BookText size={18} /> },
    { type: ModuleType.STORYBOARD_PRODUCTION, label: '分镜导演', icon: <Clapperboard size={18} /> },
    { type: ModuleType.MARKET_ANALYSIS, label: '爆款情报', icon: <LayoutDashboard size={18} /> },
  ];

  return (
    <nav className="w-20 lg:w-64 bg-ink-900 border-r border-ink-800 flex flex-col justify-between h-full z-50 shrink-0 transition-colors duration-500 shadow-sm">
      <div>
        <div className="h-24 flex items-center justify-center lg:justify-start px-6 mb-4">
          <button 
            onClick={onBackToHome}
            className="flex items-center gap-3 text-ink-500 hover:text-ink-100 transition-colors group w-full"
          >
             <div className="w-10 h-10 rounded-xl bg-ink-950 border border-ink-800 flex items-center justify-center text-ink-500 group-hover:border-accent-500 group-hover:text-accent-500 transition-all shadow-sm">
                <Home size={18} />
             </div>
             <div className="hidden lg:block text-left">
                <div className="text-[10px] font-black uppercase tracking-widest text-ink-500 group-hover:text-accent-500 transition-colors">Back to</div>
                <div className="text-xs font-bold text-ink-200 group-hover:text-ink-100">作品馆</div>
             </div>
          </button>
        </div>

        <div className="px-3 space-y-6">
           <div className="hidden lg:block px-4 pb-2 border-b border-ink-800/50">
              <span className="text-[10px] font-black text-ink-400 uppercase tracking-widest">Workflow</span>
           </div>
           
           <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = currentModule === item.type;
              return (
                <li key={item.type}>
                  <button
                    onClick={() => setModule(item.type)}
                    className={`w-full flex items-center justify-center lg:justify-between px-3 lg:px-4 py-3 rounded-xl transition-all duration-300 group relative
                      ${isActive 
                        ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/30' 
                        : 'text-ink-500 hover:bg-ink-950 hover:text-ink-100'}`}
                  >
                    <div className="flex items-center gap-3 relative z-10">
                      <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                        {item.icon}
                      </span>
                      <span className="text-xs font-bold hidden lg:block tracking-wide">
                        {item.label}
                      </span>
                    </div>
                    {isActive && <ChevronRight size={14} className="hidden lg:block animate-fadeIn opacity-80" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="p-4 space-y-3 border-t border-ink-800/50">
        {/* AI Copilot Toggle */}
        <button 
          onClick={() => setIsCopilotOpen(!isCopilotOpen)}
          className={`w-full flex items-center justify-center lg:justify-between p-3 rounded-xl border transition-all group
            ${isCopilotOpen 
              ? 'bg-accent-500/10 border-accent-500/30 text-accent-500' 
              : 'bg-ink-950 border-ink-800 text-ink-500 hover:text-ink-100 hover:border-ink-500'}`}
        >
          <div className="flex items-center gap-3">
            <Bot size={16} className={isCopilotOpen ? 'animate-pulse' : ''} />
            <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-wider">AI 创作副驾</span>
          </div>
          <div className={`w-2 h-2 rounded-full ${isCopilotOpen ? 'bg-accent-500' : 'bg-ink-300'}`}></div>
        </button>

        {/* Eye Care Toggle */}
        <button 
          onClick={() => setThemeMode(themeMode === 'light' ? 'eye-care' : 'light')}
          className={`w-full flex items-center justify-center lg:justify-between p-3 rounded-xl border transition-all group
            ${themeMode === 'eye-care' 
                ? 'bg-amber-100 border-amber-200 text-amber-800' 
                : 'bg-ink-950 border-ink-800 text-ink-500 hover:text-ink-100 hover:border-ink-500'}`}
        >
          <div className="flex items-center gap-3">
            {themeMode === 'eye-care' ? <Eye size={16} /> : <Sun size={16} />}
            <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-wider">
                {themeMode === 'eye-care' ? '护眼模式开启' : '默认外观'}
            </span>
          </div>
        </button>
      </div>
    </nav>
  );
};
