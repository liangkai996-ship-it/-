
import React, { useState } from 'react';
import { ProjectData, PlotEvent, AppLanguage, ScriptBlock, ScriptBlockType } from '../../types';
import { GeminiService } from '../../services/geminiService';
import { MoreHorizontal, Plus, Wand2, MapPin, Layout, Activity, RefreshCcw, GripHorizontal, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
import { getTranslation } from '../../utils/translations';

interface PlotProps {
  data: ProjectData;
  update: (data: Partial<ProjectData>) => void;
  language: AppLanguage;
}

export const PlotModule: React.FC<PlotProps> = ({ data, update, language }) => {
  const t = getTranslation(language);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingScriptActId, setGeneratingScriptActId] = useState<string | null>(null);
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);

  const addEvent = (actId?: string) => {
    const newEvent: PlotEvent = {
      id: crypto.randomUUID(),
      actId: actId,
      title: '新事件',
      description: '',
      tensionLevel: 5
    };
    update({ plotEvents: [...data.plotEvents, newEvent] });
  };

  const handleGenerateEvents = async () => {
    setIsGenerating(true);
    const context = `Title: ${data.title}\nLogline: ${data.logline}\nGenre: ${data.genre}`;
    try {
      const events = await GeminiService.generatePlotEvents(context, language);
      if (events.length > 0) {
        const firstActId = data.outline.length > 0 ? data.outline[0].id : undefined;
        const eventsWithAct = events.map(e => ({ ...e, actId: firstActId }));
        update({ plotEvents: [...data.plotEvents, ...eventsWithAct] });
      }
    } catch (e) {
      alert("生成事件失败");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSyncFromOutline = () => {
    // Sync scenes from outline to plot events
    const existingTitles = new Set(data.plotEvents.map(e => e.title));
    const newEvents: PlotEvent[] = [];

    data.outline.forEach(section => {
        section.scenes.forEach(scene => {
            if (!existingTitles.has(scene.title)) {
                newEvents.push({
                    id: crypto.randomUUID(),
                    actId: section.id,
                    title: scene.title,
                    description: scene.summary || '',
                    tensionLevel: 5
                });
            }
        });
    });

    if (newEvents.length > 0) {
        update({ plotEvents: [...data.plotEvents, ...newEvents] });
        alert(`已同步 ${newEvents.length} 个场景到事件列表。`);
    } else {
        alert("所有大纲场景已存在于事件列表中。");
    }
  };

  const handleGenerateScript = async (actId: string) => {
    const act = data.outline.find(a => a.id === actId);
    if (!act) return;

    setGeneratingScriptActId(actId);
    const actEvents = getEventsForAct(actId);
    
    try {
        const scriptBlocks = await GeminiService.generateScriptFromAct(
            act.title,
            act.content,
            actEvents,
            data.characters,
            language
        );

        if (scriptBlocks.length > 0) {
            // Add a Scene Heading Divider for the new Episode if needed
            const headerBlock: ScriptBlock = {
                id: crypto.randomUUID(),
                type: ScriptBlockType.SCENE_HEADING,
                content: `### ${act.title.toUpperCase()} ###`
            };
            
            update({ script: [...data.script, headerBlock, ...scriptBlocks] });
            alert(t.plot.scriptGenerated);
        } else {
            alert("生成失败，请重试。");
        }
    } catch (e) {
        alert("生成剧本失败");
    } finally {
        setGeneratingScriptActId(null);
    }
  };

  const updateEvent = (id: string, field: keyof PlotEvent, value: any) => {
    const updated = data.plotEvents.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    );
    update({ plotEvents: updated });
  };

  const deleteEvent = (id: string) => {
    update({ plotEvents: data.plotEvents.filter(e => e.id !== id) });
  };

  const getEventsForAct = (actId?: string) => {
    return data.plotEvents.filter(e => e.actId === actId);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedEventId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetActId?: string) => {
    e.preventDefault();
    if (!draggedEventId) return;

    // Update the event's actId
    const updated = data.plotEvents.map(evt => 
        evt.id === draggedEventId ? { ...evt, actId: targetActId } : evt
    );
    update({ plotEvents: updated });
    setDraggedEventId(null);
  };

  const renderEventCard = (event: PlotEvent) => (
    <div 
        key={event.id} 
        className="relative group mb-4 transition-transform duration-200"
        draggable
        onDragStart={(e) => handleDragStart(e, event.id)}
    >
      <div 
        className="absolute top-6 w-3 h-3 rounded-full bg-white border-2 z-10 transition-colors"
        style={{ 
          borderColor: event.tensionLevel > 7 ? '#ef4444' : event.tensionLevel < 4 ? '#3b82f6' : '#9ca3af',
          left: '-19px'
        }}
      ></div>
      
      <div className="absolute top-7 left-[-14px] w-4 h-0.5 bg-ink-200"></div>

      <div className="bg-white rounded-xl border border-ink-200 shadow-sm p-4 hover:shadow-md transition-all cursor-grab active:cursor-grabbing">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 flex-1">
             <GripHorizontal size={14} className="text-ink-300" />
            <input 
              value={event.title}
              onChange={(e) => updateEvent(event.id, 'title', e.target.value)}
              className="font-bold text-ink-800 text-base w-full outline-none focus:text-accent-600 bg-transparent"
              placeholder="事件标题"
            />
          </div>
          <button onClick={() => deleteEvent(event.id)} className="text-ink-300 hover:text-red-500 p-1">
            <MoreHorizontal size={14} />
          </button>
        </div>

        <textarea 
          value={event.description}
          onChange={(e) => updateEvent(event.id, 'description', e.target.value)}
          className="w-full text-xs text-ink-600 bg-ink-50 rounded p-2 border-transparent focus:bg-white focus:border-ink-200 outline-none resize-none h-16 mb-2"
          placeholder="..."
        />

        <div className="flex items-center justify-between gap-2">
           <div className="flex items-center gap-2 flex-1">
             <Activity size={12} className="text-ink-400"/>
             <input 
               type="range" min="1" max="10" 
               value={event.tensionLevel}
               onChange={(e) => updateEvent(event.id, 'tensionLevel', parseInt(e.target.value))}
               className="w-full h-1 bg-ink-200 rounded-lg appearance-none cursor-pointer accent-ink-700"
             />
           </div>
           
           <span className="text-[10px] text-ink-400 bg-ink-50 px-2 py-0.5 rounded">
             Lv.{event.tensionLevel}
           </span>
        </div>
      </div>
    </div>
  );

  const unassignedEvents = getEventsForAct(undefined);

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-serif font-bold text-ink-900">{t.plot.title}</h2>
          <p className="text-ink-500 mt-1">{t.plot.subtitle}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSyncFromOutline}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 transition-colors font-medium text-sm"
          >
            <RefreshCcw size={16} />
            {t.plot.syncFromOutline}
          </button>
          <button 
            onClick={handleGenerateEvents}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium text-sm"
          >
            <Wand2 size={16} className={isGenerating ? "animate-spin" : ""} />
            {t.plot.aiGenEvents}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto pb-20">
        
        {/* Unassigned Section - Droppable */}
        <div 
            className={`mb-12 bg-ink-100/50 p-6 rounded-xl border-2 border-dashed transition-colors
                ${unassignedEvents.length > 0 ? 'border-ink-200' : 'border-ink-200/50'}
            `}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, undefined)}
        >
          <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <MoreHorizontal size={14}/> {t.plot.unassigned}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[50px]">
            {unassignedEvents.map(event => (
              <div key={event.id} className="pl-4 border-l-2 border-ink-300">
                 {renderEventCard(event)}
              </div>
            ))}
            {unassignedEvents.length === 0 && (
                <div className="col-span-full text-center text-ink-400 text-xs py-4">
                    {t.plot.unassigned}空 (Drag events here to unassign)
                </div>
            )}
          </div>
        </div>

        {/* Acts Loop */}
        <div className="space-y-0 relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-ink-200 transform -translate-x-1/2 hidden md:block"></div>

          {data.outline.map((act, index) => (
            <div key={act.id} className="relative pb-16">
              
              <div className="flex justify-center mb-8 relative z-10">
                <div className="bg-ink-900 text-white px-6 py-2 rounded-full font-serif font-bold shadow-lg flex items-center gap-2">
                  <MapPin size={16} className="text-accent-500" />
                  {act.title}
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8 md:gap-16">
                
                {/* Left Column: Outline Scenes (Structure) - Read Only Reference */}
                <div className="flex-1 md:text-right">
                  <div className="md:pr-8 md:border-r-0 border-ink-200 h-full relative">
                    <h4 className="text-xs font-bold text-ink-400 uppercase tracking-widest mb-4 flex items-center md:justify-end gap-2">
                      <Layout size={12} /> {t.outline.sceneDetail}
                    </h4>
                    
                    <div className="space-y-4">
                      {act.scenes && act.scenes.length > 0 ? (
                        act.scenes.map((scene, sIdx) => (
                          <div key={scene.id} className="bg-ink-50 border border-ink-200 rounded-lg p-3 opacity-60 hover:opacity-100 transition-opacity">
                            <div className="text-[10px] font-bold text-ink-400 mb-1">SCENE {sIdx + 1}</div>
                            <div className="font-bold text-ink-800 text-sm mb-1">{scene.title}</div>
                            <div className="text-xs text-ink-500 line-clamp-2">{scene.summary}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-ink-300 italic py-4 md:text-right">
                          -
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Plot Events (Beats) - Droppable Area */}
                <div className="flex-1">
                  <div 
                    className="md:pl-8 h-full relative min-h-[150px] rounded-lg border border-transparent transition-colors hover:bg-ink-50/50"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, act.id)}
                  >
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-bold text-ink-400 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={12} /> {t.plot.beats}
                        </h4>
                        <button 
                            onClick={() => handleGenerateScript(act.id)}
                            disabled={generatingScriptActId === act.id}
                            className="flex items-center gap-1.5 px-3 py-1 bg-ink-800 text-white rounded shadow-sm text-[10px] font-bold hover:bg-accent-600 transition-colors disabled:opacity-50"
                        >
                            {generatingScriptActId === act.id ? (
                                <><RefreshCw size={10} className="animate-spin" /> {t.common.loading}</>
                            ) : (
                                <><FileText size={10} /> {t.plot.genScript}</>
                            )}
                        </button>
                    </div>

                    <div className="space-y-2">
                      {getEventsForAct(act.id).map(event => renderEventCard(event))}
                      
                      <button 
                        onClick={() => addEvent(act.id)}
                        className="mt-4 flex items-center gap-2 text-xs font-medium text-ink-400 hover:text-accent-600 transition-colors px-2 py-1 rounded hover:bg-ink-50 w-fit"
                      >
                        <Plus size={14} /> {t.common.add}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
