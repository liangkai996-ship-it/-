
import React, { useState, useEffect, useRef } from 'react';
import { GeminiService } from '../services/geminiService';
import { ProjectData, ModuleType, AIMessage, AppLanguage, ProjectAction, Character, CharacterRelationship } from '../types';
import { Sparkles, Send, Lightbulb, CheckCircle2, ArrowRightCircle, Users, Network } from 'lucide-react';
import { getTranslation } from '../utils/translations';

interface AICopilotProps {
  projectData: ProjectData;
  activeModule: ModuleType;
  updateProject: (data: Partial<ProjectData>) => void;
  language: AppLanguage;
}

export const AICopilot: React.FC<AICopilotProps> = ({ projectData, activeModule, updateProject, language }) => {
  const t = getTranslation(language);
  const [messages, setMessages] = useState<AIMessage[]>([
    { role: 'model', text: '你好！我是你的剧本创作助手。' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: AIMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Prepare context
    let context = `
      Project Title: ${projectData.title}
      Genre: ${projectData.genre}
      Logline: ${projectData.logline}
      
      Outline Sections (Structure):
      ${projectData.outline.map(o => `- ID: ${o.id}, Title: ${o.title}, Summary Length: ${o.content.length} chars`).join('\n')}
      
      Characters:
      ${projectData.characters.map(c => `- ${c.name} (${c.role})`).join('\n')}
    `;

    if (activeModule === ModuleType.CHARACTERS) {
      context += `\nViewing Character List.`;
    } else if (activeModule === ModuleType.SCRIPT) {
      context += `\nCurrently writing the script. Last few lines: ${projectData.script.slice(-5).map(b => b.content).join(' | ')}`;
    } else if (activeModule === ModuleType.OUTLINE) {
        context += `\nFocusing on Outline. Detailed summaries: ${projectData.outline.map(o => `${o.title}: ${o.content}`).join(' | ')}`;
    }

    const aiResponseText = await GeminiService.chatWithCoach(
      messages.map(m => ({ role: m.role, text: m.text })), // Strip action objects for API history
      userMsg.text, 
      context, 
      language
    );
    
    // Parse response for Multiple Actions
    const { text, actions } = parseAIResponse(aiResponseText);

    setMessages(prev => [...prev, { 
        role: 'model', 
        text: text, 
        actions: actions,
        actionStatuses: {} 
    }]);
    setIsLoading(false);
  };

  const parseAIResponse = (responseText: string): { text: string, actions: ProjectAction[] } => {
    const actionRegex = /:::ACTION_START:::([\s\S]*?):::ACTION_END:::/g;
    const actions: ProjectAction[] = [];
    
    // Find all matches
    const matches = [...responseText.matchAll(actionRegex)];
    
    if (matches.length > 0) {
        matches.forEach(match => {
            try {
                if (match[1]) {
                    const actionJson = JSON.parse(match[1]);
                    actions.push(actionJson);
                }
            } catch (e) {
                console.error("Failed to parse AI action JSON", e);
            }
        });
        const cleanText = responseText.replace(actionRegex, '').trim();
        return { text: cleanText, actions };
    }
    
    return { text: responseText, actions: [] };
  };

  const handleApplyAction = (msgIndex: number, actionIndex: number, action: ProjectAction) => {
    if (!action) return;

    switch (action.type) {
        case 'ADD_CHARACTER':
            const newChar: Character = {
                id: crypto.randomUUID(),
                name: action.data.name || 'New Character',
                role: action.data.role || 'Unknown',
                age: action.data.age || 'Unknown',
                description: action.data.description || '',
                goal: action.data.goal || '',
                conflict: action.data.conflict || '',
                arc: action.data.arc || '',
                mapPosition: { x: 100, y: 100 },
                visualDesign: action.data.visualDesign || { clothing: '', pose: '', expression: '' }
            };
            updateProject({ characters: [...projectData.characters, newChar] });
            break;

        case 'ADD_CHARACTERS_BATCH':
             if (action.data.characters && Array.isArray(action.data.characters)) {
                const newChars: Character[] = action.data.characters.map((c: any, i: number) => ({
                    id: crypto.randomUUID(),
                    name: c.name || 'New Character',
                    role: c.role || 'Unknown',
                    age: c.age || 'Unknown',
                    description: c.description || '',
                    goal: c.goal || '',
                    conflict: c.conflict || '',
                    arc: c.arc || '',
                    // Offset new characters visually
                    mapPosition: { x: 100 + (i * 60) % 500, y: 100 + (i * 40) }, 
                    visualDesign: c.visualDesign || { clothing: '', pose: '', expression: '' }
                }));
                updateProject({ characters: [...projectData.characters, ...newChars] });
             }
             break;

        case 'UPDATE_RELATIONSHIPS':
             if (action.data.relationships && Array.isArray(action.data.relationships)) {
                 const newRels: CharacterRelationship[] = [];
                 // Important: We need to map Name -> ID.
                 // We use the LATEST state of characters (which might have just been updated)
                 // Note: projectData used inside this closure is captured from render cycle. 
                 // However, updateProject updates state asynchronously. 
                 // In a real generic react flow this might race, but for this copilot sequence we assume user syncs chars first.
                 
                 const charMap = new Map<string, string>(); // Name -> ID
                 projectData.characters.forEach(c => charMap.set(c.name.trim().toLowerCase(), c.id));

                 action.data.relationships.forEach((rel: any) => {
                     const sName = rel.sourceName?.trim().toLowerCase();
                     const tName = rel.targetName?.trim().toLowerCase();
                     const sId = charMap.get(sName);
                     const tId = charMap.get(tName);
                     
                     if (sId && tId) {
                         newRels.push({
                             id: crypto.randomUUID(),
                             sourceId: sId,
                             targetId: tId,
                             label: rel.label || 'Connected'
                         });
                     } else {
                         console.warn(`Could not find character IDs for relationship: ${rel.sourceName} -> ${rel.targetName}`);
                     }
                 });
                 
                 // Merge with existing or replace? Let's append.
                 updateProject({ relationships: [...(projectData.relationships || []), ...newRels] });
             }
             break;

        case 'UPDATE_OUTLINE_SECTION':
            if (action.data.sectionId) {
                const updatedOutline = projectData.outline.map(o => 
                    o.id === action.data.sectionId ? { ...o, content: action.data.content } : o
                );
                updateProject({ outline: updatedOutline });
            }
            break;
            
        case 'UPDATE_LOGLINE':
            if (action.data.logline) {
                updateProject({ logline: action.data.logline });
            }
            break;

        case 'ADD_PLOT_EVENT':
             const newEvent = {
                 id: crypto.randomUUID(),
                 title: action.data.title || 'New Event',
                 description: action.data.description || '',
                 tensionLevel: action.data.tensionLevel || 5
             };
             updateProject({ plotEvents: [...projectData.plotEvents, newEvent] });
             break;
    }

    // Update message status specific to this action index
    setMessages(prev => prev.map((msg, i) => {
        if (i === msgIndex) {
            return {
                ...msg,
                actionStatuses: {
                    ...(msg.actionStatuses || {}),
                    [actionIndex]: 'applied'
                }
            };
        }
        return msg;
    }));
  };

  return (
    <div className="w-80 lg:w-96 bg-white border-l border-ink-200 flex flex-col h-full shadow-lg z-20">
      <div className="h-16 border-b border-ink-100 flex items-center px-6 bg-ink-50">
        <Sparkles className="text-accent-500 mr-2" size={20} />
        <h2 className="font-serif font-bold text-ink-800">AI 创作助手</h2>
      </div>

      <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-start gap-3">
        <Lightbulb className="text-amber-500 shrink-0 mt-0.5" size={18} />
        <p className="text-xs text-ink-600 font-medium leading-relaxed">{t.common.tips}: 遇到卡顿可以随时问我。</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-ink-50/50" ref={scrollRef}>
        {messages.map((msg, msgIdx) => (
          <div key={msgIdx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap
                ${msg.role === 'user' 
                  ? 'bg-ink-800 text-white rounded-br-none' 
                  : 'bg-white text-ink-700 border border-ink-200 rounded-bl-none'}`}
            >
              {msg.text}
            </div>

            {/* Render Multiple Actions */}
            {msg.role === 'model' && msg.actions && msg.actions.length > 0 && (
                <div className="flex flex-col gap-2 mt-2 max-w-[85%] w-full">
                    {msg.actions.map((action, actionIdx) => {
                        const status = msg.actionStatuses?.[actionIdx];
                        const isBatch = action.type === 'ADD_CHARACTERS_BATCH';
                        const isRel = action.type === 'UPDATE_RELATIONSHIPS';

                        return (
                            <div key={actionIdx} className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 shadow-sm animate-fadeIn">
                                <div className="flex items-center gap-2 mb-2 text-indigo-700 font-bold text-xs uppercase tracking-wide">
                                    {isBatch ? <Users size={12}/> : isRel ? <Network size={12}/> : <Sparkles size={12} />} 
                                    {t.copilot.suggestion}
                                </div>
                                <div className="text-xs text-ink-600 mb-3 bg-white/50 p-2 rounded border border-white/50">
                                    {action.description}
                                </div>
                                
                                {status === 'applied' ? (
                                     <div className="flex items-center justify-center gap-2 text-green-600 text-xs font-bold bg-green-50 py-1.5 rounded border border-green-100">
                                         <CheckCircle2 size={14} /> {t.copilot.actionApplied}
                                     </div>
                                ) : (
                                    <button 
                                       onClick={() => handleApplyAction(msgIdx, actionIdx, action)}
                                       className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white text-xs font-bold py-2 rounded hover:bg-indigo-700 transition-colors shadow-sm"
                                    >
                                        <ArrowRightCircle size={14} /> {t.copilot.syncToWorkflow}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-ink-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-ink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-ink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-ink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-ink-200 bg-white">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="输入您的问题..."
            className="w-full bg-ink-50 border border-ink-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 resize-none h-24"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute bottom-3 right-3 p-2 bg-ink-900 text-white rounded-lg hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
