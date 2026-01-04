
import React, { useState, useEffect, useRef } from 'react';
import { GeminiService } from '../services/geminiService';
import { ProjectData, ModuleType, AIMessage, AppLanguage, ProjectAction } from '../types';
import { Sparkles, Send, Lightbulb, CheckCircle2, Bot, X } from 'lucide-react';
import { getTranslation } from '../utils/translations';

interface AICopilotProps {
  projectData: ProjectData;
  activeModule: ModuleType;
  updateProject: (data: Partial<ProjectData>) => void;
  language: AppLanguage;
  onClose?: () => void;
}

export const AICopilot: React.FC<AICopilotProps> = ({ projectData, activeModule, updateProject, language, onClose }) => {
  const t = getTranslation(language);
  const [messages, setMessages] = useState<AIMessage[]>([
    { role: 'model', text: '你好！我是你的剧本创作副驾。我们可以聊聊原著拆解、人物建模或者剧情反转建议。' }
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

    let context = `
      Project Title: ${projectData.title}
      Genre: ${projectData.genre}
      Logline: ${projectData.logline}
      Outline Sections: ${projectData.outline.map(o => o.title).join(', ')}
      Characters: ${projectData.characters.map(c => c.name).join(', ')}
    `;

    try {
      const aiResponseText = await GeminiService.chatWithCoach(
        messages.map(m => ({ role: m.role, text: m.text })),
        userMsg.text, 
        context, 
        language
      );
      
      const { text, actions } = parseAIResponse(aiResponseText);
      setMessages(prev => [...prev, { 
          role: 'model', 
          text: text, 
          actions: actions,
          actionStatuses: {} 
      }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: '抱歉，连接实验室服务器失败，请检查网络或 API Key。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const parseAIResponse = (responseText: string): { text: string, actions: ProjectAction[] } => {
    const actionRegex = /:::ACTION_START:::([\s\S]*?):::ACTION_END:::/g;
    const actions: ProjectAction[] = [];
    const matches = [...responseText.matchAll(actionRegex)];
    
    if (matches.length > 0) {
        matches.forEach(match => {
            try {
                if (match[1]) actions.push(JSON.parse(match[1]));
            } catch (e) { console.error("Action parse error", e); }
        });
        const cleanText = responseText.replace(actionRegex, '').trim();
        return { text: cleanText, actions };
    }
    return { text: responseText, actions: [] };
  };

  const handleApplyAction = (msgIndex: number, actionIndex: number, action: ProjectAction) => {
    // Action implementation placeholder
    setMessages(prev => prev.map((msg, i) => i === msgIndex ? { ...msg, actionStatuses: { ...(msg.actionStatuses || {}), [actionIndex]: 'applied' } } : msg));
  };

  return (
    <div className="w-80 lg:w-96 bg-ink-900/90 backdrop-blur-xl border-l border-ink-800 flex flex-col h-full shadow-2xl z-20">
      <div className="h-16 border-b border-ink-800 flex items-center justify-between px-6 bg-ink-900/50">
        <div className="flex items-center">
            <Bot className="text-accent-500 mr-2" size={20} />
            <h2 className="font-serif font-bold text-ink-100 tracking-tight">AI 创作副驾终端</h2>
        </div>
        {onClose && (
            <button onClick={onClose} className="text-ink-500 hover:text-ink-100 p-1 rounded-md hover:bg-ink-800 transition-colors">
                <X size={16} />
            </button>
        )}
      </div>

      <div className="bg-amber-500/10 p-4 border-b border-amber-500/20 flex items-start gap-3">
        <Lightbulb className="text-amber-500 shrink-0 mt-0.5" size={16} />
        <p className="text-[10px] text-amber-200/90 font-medium leading-relaxed uppercase tracking-wider">提示：随时可隐藏此终端，在左下角重新唤起。</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent custom-scrollbar" ref={scrollRef}>
        {messages.map((msg, msgIdx) => (
          <div key={msgIdx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start animate-fadeIn'}`}>
            <div 
              className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg
                ${msg.role === 'user' 
                  ? 'bg-accent-600 text-white rounded-br-none shadow-accent-900/20' 
                  : 'bg-ink-800 text-ink-100 border border-ink-700 rounded-bl-none'}`}
            >
              {msg.text}
            </div>

            {msg.role === 'model' && msg.actions && msg.actions.length > 0 && (
                <div className="flex flex-col gap-2 mt-3 w-full max-w-[90%]">
                    {msg.actions.map((action, actionIdx) => (
                        <div key={actionIdx} className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 shadow-xl">
                            <div className="flex items-center gap-2 mb-2 text-purple-400 font-bold text-[10px] uppercase tracking-widest">
                                <Sparkles size={12} /> 指令同步建议
                            </div>
                            <div className="text-xs text-ink-300 mb-3 leading-relaxed">
                                {action.description}
                            </div>
                            {msg.actionStatuses?.[actionIdx] === 'applied' ? (
                                 <div className="flex items-center justify-center gap-2 text-accent-400 text-xs font-bold py-2">
                                     <CheckCircle2 size={14} /> 已同步至剧本工程
                                 </div>
                            ) : (
                                <button 
                                   onClick={() => handleApplyAction(msgIdx, actionIdx, action)}
                                   className="w-full bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold py-2 rounded-lg transition-all shadow-lg"
                                >
                                    执行同步指令
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-ink-800 border border-ink-700 rounded-2xl rounded-bl-none px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-accent-500 rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 bg-accent-500 rounded-full animate-pulse delay-75"></div>
                <div className="w-1.5 h-1.5 bg-accent-500 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-ink-900 border-t border-ink-800">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="输入创作指令..."
            className="w-full bg-ink-950 border border-ink-800 rounded-xl pl-4 pr-12 py-3 text-sm text-ink-100 focus:outline-none focus:border-accent-500/50 resize-none h-20 transition-all placeholder:text-ink-600"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute bottom-3 right-3 p-2 bg-accent-500 text-white rounded-lg hover:bg-accent-400 disabled:opacity-20 transition-all shadow-lg shadow-accent-950/20"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
