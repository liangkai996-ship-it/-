
import React, { useState } from 'react';
import { ModuleType, AppLanguage } from '../types';
import { LayoutDashboard, Users, BookOpen, GitMerge, FileText, Clapperboard, BookText, Globe } from 'lucide-react';
import { getTranslation } from '../utils/translations';

interface NavigationProps {
  currentModule: ModuleType;
  setModule: (m: ModuleType) => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentModule, setModule, language, setLanguage }) => {
  const t = getTranslation(language);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const navItems = [
    { type: ModuleType.DASHBOARD, label: t.nav.dashboard, icon: <LayoutDashboard size={20} /> },
    { type: ModuleType.NOVEL, label: t.nav.novel, icon: <BookText size={20} /> },
    { type: ModuleType.CHARACTERS, label: t.nav.characters, icon: <Users size={20} /> },
    { type: ModuleType.OUTLINE, label: t.nav.outline, icon: <BookOpen size={20} /> },
    { type: ModuleType.PLOT, label: t.nav.plot, icon: <GitMerge size={20} /> },
    { type: ModuleType.SCRIPT, label: t.nav.script, icon: <FileText size={20} /> },
    { type: ModuleType.STORYBOARD, label: t.nav.storyboard, icon: <Clapperboard size={20} /> },
  ];

  const languages: { code: AppLanguage, label: string }[] = [
    { code: 'zh-CN', label: '简体中文' },
    { code: 'zh-TW', label: '繁體中文' },
    { code: 'en', label: 'English' },
    { code: 'ko', label: '한국어' },
    { code: 'ja', label: '日本語' },
  ];

  return (
    <nav className="w-20 lg:w-64 bg-ink-900 text-ink-100 flex flex-col justify-between h-full border-r border-ink-800 shadow-xl transition-all duration-300 z-50">
      <div>
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-ink-800">
          <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center font-bold text-white mr-0 lg:mr-3 shrink-0">
            IF
          </div>
          <span className="font-serif font-bold text-lg hidden lg:block tracking-wide">InkFlow 灵感剧本</span>
        </div>

        <ul className="py-6 space-y-2">
          {navItems.map((item) => (
            <li key={item.type}>
              <button
                onClick={() => setModule(item.type)}
                className={`w-full flex items-center px-4 lg:px-6 py-3 transition-all duration-200 group
                  ${currentModule === item.type 
                    ? 'bg-ink-800 text-accent-500 border-r-4 border-accent-500' 
                    : 'text-ink-400 hover:bg-ink-800 hover:text-ink-100'}`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className={`ml-3 text-sm font-medium hidden lg:block ${currentModule === item.type ? 'text-white' : ''}`}>
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 border-t border-ink-800 relative">
        {/* Language Selector */}
        <div className="mb-4">
          <button 
             onClick={() => setShowLangMenu(!showLangMenu)}
             className="w-full flex items-center justify-center lg:justify-start p-2 rounded hover:bg-ink-800 text-ink-400 hover:text-white transition-colors gap-2"
          >
             <Globe size={18} />
             <span className="hidden lg:inline text-xs">{languages.find(l => l.code === language)?.label}</span>
          </button>
          
          {showLangMenu && (
             <div className="absolute bottom-16 left-4 right-4 bg-ink-800 rounded-lg shadow-xl border border-ink-700 overflow-hidden z-50">
                {languages.map(l => (
                  <button 
                     key={l.code}
                     onClick={() => {
                        setLanguage(l.code);
                        setShowLangMenu(false);
                     }}
                     className={`w-full text-left px-4 py-2 text-xs hover:bg-ink-700 transition-colors ${language === l.code ? 'text-accent-500 font-bold' : 'text-ink-300'}`}
                  >
                     {l.label}
                  </button>
                ))}
             </div>
          )}
        </div>

        <div className="text-xs text-ink-500 text-center lg:text-left hidden lg:block">
          <p>v1.3.0 测试版</p>
          <p className="mt-1">由 Gemini 强力驱动</p>
        </div>
      </div>
    </nav>
  );
};
