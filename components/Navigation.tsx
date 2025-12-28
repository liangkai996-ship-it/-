
import React, { useState } from 'react';
import { ModuleType, AppLanguage, ThemeMode } from '../types';
import { LayoutDashboard, PenTool, FileText, BookText, Globe, Stethoscope, Sun, Moon } from 'lucide-react';
import { getTranslation } from '../utils/translations';

interface NavigationProps {
  currentModule: ModuleType;
  setModule: (m: ModuleType) => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentModule, setModule, language, setLanguage, themeMode, setThemeMode }) => {
  const t = getTranslation(language);
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Removed ModuleType.PLOT from navItems
  const navItems = [
    { type: ModuleType.DASHBOARD, label: t.nav.dashboard, icon: <LayoutDashboard size={20} /> },
    { type: ModuleType.NOVEL, label: t.nav.novel, icon: <BookText size={20} /> },
    { type: ModuleType.OUTLINE, label: t.nav.outline, icon: <PenTool size={20} /> },
    { type: ModuleType.SCRIPT, label: t.nav.script, icon: <FileText size={20} /> },
    { type: ModuleType.DOCTOR, label: t.nav.doctor, icon: <Stethoscope size={20} /> },
  ];

  const languages: { code: AppLanguage, label: string }[] = [
    { code: 'zh-CN', label: '简体中文' },
    { code: 'zh-TW', label: '繁體中文' },
    { code: 'en', label: 'English' },
    { code: 'ko', label: '한국어' },
    { code: 'ja', label: '日本語' },
  ];

  return (
    <nav className="w-20 lg:w-64 bg-ink-950 text-ink-100 flex flex-col justify-between h-full border-r border-ink-900 shadow-xl transition-all duration-300 z-50">
      <div>
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-ink-900">
          <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center font-bold text-white mr-0 lg:mr-3 shrink-0 shadow-lg shadow-accent-500/20">
            M
          </div>
          <span className="font-serif font-bold text-lg hidden lg:block tracking-wide">神笔马良</span>
        </div>

        <ul className="py-6 space-y-2">
          {navItems.map((item) => (
            <li key={item.type}>
              <button
                onClick={() => setModule(item.type)}
                className={`w-full flex items-center px-4 lg:px-6 py-3 transition-all duration-200 group
                  ${currentModule === item.type 
                    ? 'bg-ink-900 text-accent-500 border-r-4 border-accent-500' 
                    : 'text-ink-600 hover:bg-ink-900 hover:text-ink-100'}`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className={`ml-3 text-sm font-medium hidden lg:block ${currentModule === item.type ? 'text-ink-100 font-bold' : ''}`}>
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 border-t border-ink-900 relative space-y-2">
        <div>
           <button 
             onClick={() => setThemeMode(themeMode === 'night' ? 'day' : 'night')}
             className="w-full flex items-center justify-center lg:justify-start p-3 rounded-xl hover:bg-ink-900 text-ink-600 hover:text-ink-100 transition-all gap-3 bg-transparent border border-transparent hover:border-ink-800"
             title={themeMode === 'night' ? '白天创作模式' : '晚上创作模式'}
           >
             {themeMode === 'night' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-blue-500" />}
             <span className="hidden lg:inline text-xs font-bold">
                {themeMode === 'night' ? '白天创作' : '晚上创作'}
             </span>
           </button>
        </div>

        <div className="relative">
          <button 
             onClick={() => setShowLangMenu(!showLangMenu)}
             className="w-full flex items-center justify-center lg:justify-start p-3 rounded-xl hover:bg-ink-900 text-ink-600 hover:text-ink-100 transition-all gap-3"
          >
             <Globe size={18} />
             <span className="hidden lg:inline text-xs font-bold">{languages.find(l => l.code === language)?.label}</span>
          </button>
          
          {showLangMenu && (
             <div className="absolute bottom-full left-0 w-full mb-2 bg-ink-900 rounded-xl shadow-2xl border border-ink-800 overflow-hidden z-50">
                {languages.map(l => (
                  <button 
                     key={l.code}
                     onClick={() => {
                        setLanguage(l.code);
                        setShowLangMenu(false);
                     }}
                     className={`w-full text-left px-4 py-3 text-xs hover:bg-white/5 transition-colors ${language === l.code ? 'text-accent-400 font-bold' : 'text-ink-600'}`}
                  >
                     {l.label}
                  </button>
                ))}
             </div>
          )}
        </div>

        <div className="text-[10px] text-ink-800 text-center lg:text-left hidden lg:block pt-2 font-mono uppercase tracking-widest">
          <p>Maliang Lab v1.5.0</p>
          <p className="mt-1">Powered by Gemini</p>
        </div>
      </div>
    </nav>
  );
};
