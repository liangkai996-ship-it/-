
import { GoogleGenAI, Type } from "@google/genai";
import { 
  AppLanguage, 
  ScriptFormat,
  OutlineSection,
  ProjectData,
  ScriptBlock,
  ScriptBlockType,
  Character,
  PlotEvent,
  AspectRatio,
  ProductionStyle,
  NovelChapter,
  DramaStage,
  NovelUploadChunk,
  NovelDeepAnalysis,
  AdaptationEpisode,
  AnalysisCharacter
} from "../types";

// 使用用户指定的 API 密钥
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'AIzaSyAt0HCtBFiE6nrOO2fRDKfB5aiJh8Be-CU' });

// --- 速率限制保护工具 ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const GeminiService = {
  // --- 辅助工具：文本切片 ---
  splitNovelIntoChunks(fullText: string): NovelChapter[] {
    const CHUNK_SIZE = 8000;
    const chunks: NovelChapter[] = [];
    let index = 0;
    
    for (let i = 0; i < fullText.length; i += CHUNK_SIZE) {
      const rawContent = fullText.slice(i, i + CHUNK_SIZE);
      chunks.push({
        id: crypto.randomUUID(),
        index: index + 1,
        rawContent,
        summary: ""
      });
      index++;
    }
    return chunks;
  },

  // --- 新功能：改编全案计划生成 (批量/分页) ---
  async generateNovelAdaptationPlanBatch(
    analysis: NovelDeepAnalysis, 
    format: ScriptFormat, 
    lang: AppLanguage,
    startEpisode: number = 1,
    batchSize: number = 5,
    existingContext: string = "",
    totalEpisodes: number = 10
  ): Promise<AdaptationEpisode[]> {
    const formatInstruction = format === ScriptFormat.LIVE_ACTION_SHORT 
      ? "每集时长2-3分钟。必须包含【黄金前3秒】、密集反转、情绪钩子和结尾悬念。节奏极快，情绪大起大落。"
      : format === ScriptFormat.COMIC_DRAMA
      ? "每集时长1.5-3分钟。强调画面张力、分镜感和道具特写。适合竖屏阅读节奏。"
      : "标准剧集结构。";

    const endEpisode = startEpisode + batchSize - 1;
    const isFinalBatch = endEpisode >= totalEpisodes;

    const prompt = `
    你是一位享誉全球的金牌短剧/影视编剧大师。基于以下小说深度分析报告，请严格把控全剧结构，制定改编分集大纲。

    【小说分析报告 (主线脉络)】：
    ${analysis.mainPlot.substring(0, 3000)}...

    【全剧结构要求】：
    1. 总集数设定为：**${totalEpisodes} 集**。
    2. 你必须时刻回顾小说的主线脉络，确保故事在第 ${totalEpisodes} 集能够完整结局（或达到阶段性大结局）。
    3. 不要自行延长故事，必须在规定的集数内讲完主线。

    【当前生成任务】：
    生成 **第 ${startEpisode} 集 到 第 ${Math.min(endEpisode, totalEpisodes)} 集** 的分集大纲。
    
    ${existingContext ? `【前情提要 (已生成部分)】：\n${existingContext}\n请紧接上述剧情，保持逻辑连贯。` : "这是故事的开篇，请从第一集开始，迅速切入核心冲突。"}
    
    ${isFinalBatch ? `**特别注意**：这是最后一部分！请务必在第 ${totalEpisodes} 集完成所有伏笔回收，推向最高潮并给出结局。` : `请注意故事的推进节奏，为后续剧情（直到第 ${totalEpisodes} 集）预留空间。`}

    【格式要求】：
    1. ${formatInstruction}
    2. 每一集必须包含：
       - **title**: 吸引眼球的标题。
       - **summary**: 200字剧情梗概。
       - **characters**: 本集出场关键人物。
       - **events**: 关键事件列表。
       - **emotions**: 【核心指导字段】列出本集主要角色的情绪状态。
       - **beats**: 【关键！】短剧节拍分析。

    请返回 JSON 数组格式 (仅包含第 ${startEpisode} 到 ${Math.min(endEpisode, totalEpisodes)} 集)：
    [
      {
        "episodeNumber": ${startEpisode},
        "title": "...",
        "summary": "...",
        "characters": ["人物A", "人物B"],
        "events": ["事件1", "事件2"],
        "emotions": ["主角：愤怒", "反派：嘲讽"],
        "beats": [
           { "name": "黄金前3秒", "description": "主角直接被退婚...", "type": "hook" }
        ]
      }
    ]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 6000 }
      }
    });

    try {
      const result = JSON.parse(response.text || "[]");
      return Array.isArray(result) ? result.map((ep: any) => ({ ...ep, id: crypto.randomUUID() })) : [];
    } catch (e) {
      console.error(e);
      throw new Error("改编计划生成失败");
    }
  },

  // 兼容旧接口，直接调用 batch
  async generateNovelAdaptationPlan(
    analysis: NovelDeepAnalysis, 
    format: ScriptFormat, 
    lang: AppLanguage,
    episodeCount: number = 10
  ): Promise<AdaptationEpisode[]> {
      // 默认生成前 5 集 (或更少，如果总集数少于5)
      return this.generateNovelAdaptationPlanBatch(analysis, format, lang, 1, Math.min(episodeCount, 5), "", episodeCount);
  },

  // --- 新功能：基于改编分集生成正文 (极简格式) ---
  async generateScriptFromAdaptationEpisode(
    episode: AdaptationEpisode,
    context: ProjectData,
    lang: AppLanguage
  ): Promise<ScriptBlock[]> {
    return this.generateFullEpisodeScript(
        { 
            id: episode.id, 
            title: episode.title, 
            content: episode.summary, 
            scenes: [], 
            emotionalArc: episode.emotions.join(', ') // 映射情绪字段
        }, 
        context, 
        lang
    );
  },

  // --- 原创故事分集生成 (UPDATED: Multi-threaded Plotlines) ---
  async generateEpisodeBatch(
    totalOutline: string, 
    format: ScriptFormat, 
    startEpisode: number, 
    count: number, 
    lang: AppLanguage,
    totalEpisodesTarget: number = 100
  ): Promise<any[]> {
    const prompt = `
    你是一位**影视剧/短剧的总编剧（Showrunner）**。请根据【深度故事总纲】进行精细化的分集拆解。

    【深度故事总纲】：
    ${totalOutline}

    【任务要求】：
    1. 严格遵守总集数限制：本剧共 **${totalEpisodesTarget}** 集。
    2. 当前生成范围：第 **${startEpisode}** 集 到 第 **${startEpisode + count - 1}** 集。
    
    【核心：多线叙事矩阵要求 (Multi-Threaded Plotting)】：
    你不仅要写出主线剧情，还必须**显性地设计**以下几类事件。请注意，“伏笔”和“人物弧光”不一定每一集都有，但要根据故事节奏在全剧中合理穿插布局：
    
    1. **主线剧情 (Main Plot)**: 推动故事发展的核心事件（必须有）。
    2. **角色冲突 (Conflict / Subplot A)**: 人物之间的具体对抗、误会、撕逼或情感纠葛（必须有，短剧重点）。
    3. **背景伏笔 (Secrets / Foreshadowing)**: 揭示世界观秘密、埋下未来反转的种子、或草蛇灰线的细节（可选，但要确保全剧有布局）。
    4. **人物弧光 (Character Arc)**: 角色的内心觉醒、动摇、黑化或成长的关键时刻（可选，关键节点出现）。

    【返回格式】：
    请返回一个 JSON 数组，每个对象代表一集。事件数组 'events' 中，**必须**用 'category' 字段区分事件类型：
    - 'main' (主线)
    - 'conflict' (角色冲突)
    - 'reveal' (背景伏笔)
    - 'arc' (人物弧光)

    JSON 结构示例：
    {
        "title": "第X集：[吸引眼球的标题]",
        "content": "本集详细剧情梗概...",
        "emotionalArc": "...",
        "visualKeywords": "...",
        "events": [
           { 
             "title": "事件名", 
             "description": "详细节拍...", 
             "emotions": "愤怒, 绝望",
             "tension": 9, 
             "category": "main" 
           },
           { 
             "title": "B线：旧照片", 
             "description": "男主无意间看到女主藏起来的照片...", 
             "emotions": "疑惑",
             "tension": 6, 
             "category": "reveal" 
           }
        ]
    }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    try {
      const result = JSON.parse(response.text || "[]");
      return Array.isArray(result) ? result : [];
    } catch (e) {
      return [];
    }
  },

  // --- 剧本正文生成 (UPDATED: Strict Adherence to Matrix Beats) ---
  async generateFullEpisodeScript(
    episode: OutlineSection, 
    context: ProjectData, 
    lang: AppLanguage, 
    onProgress?: any
  ): Promise<ScriptBlock[]> {
    
    const charContext = context.characters.map(c => `${c.name} (${c.role}): ${c.description}`).join('\n');
    
    // Find plot events associated with this episode to extract precise emotions
    const linkedEvents = context.plotEvents.filter(e => e.actId === episode.id);
    
    // Construct strict event directives
    const eventBreakdown = linkedEvents.map((e, idx) => 
        `>>> 事件 ${idx + 1} [${e.plotline || 'main'}]: ${e.title}
         【详细节拍指令 (STRICTLY FOLLOW)】: ${e.description}
         【人物情绪/潜台词指令】: ${e.emotions || "（请根据剧情自动推演，体现细腻的微表情和潜台词）"}`
    ).join('\n\n');

    const prompt = `
    你是一位**执行力极强的金牌短剧编剧**。你的任务是根据【分集大纲】和【事件矩阵指令】，将其转化为**可直接拍摄的短剧剧本**。

    【基本信息】：
    剧名：${context.title}
    集数：${episode.title}
    本集梗概：${episode.content}
    本集整体情绪基调：${episode.emotionalArc || "激烈、冲突、反转"}

    【人物小传】：
    ${charContext}

    【⭐ 核心指令：事件矩阵执行表 ⭐】：
    以下是本集必须严格执行的事件序列。**你必须将每一个事件的“详细节拍指令”和“情绪指令”精准地转化为剧本中的动作（Action）和对话（Dialogue）。不要遗漏任何一个节拍！**
    
    ${eventBreakdown || "暂无具体事件卡，请根据梗概进行专业发挥，保持短剧快节奏。"}

    【格式规范 - 极简短剧格式】：
    1. **场景头**：格式 "X-X 地点 时间 内/外"。
    2. **动作/画面**：必须以 "△" 开头。动作描写要短促有力，多写特写镜头和微表情。
    3. **对话**：格式为 "角色名：台词" 或 "角色名（情绪）：台词"。对话要口语化、有潜台词、避免长篇大论。
    
    【示例】：
    1-1 别墅客厅 夜 内
    人物：顾清、沈墨
    △顾清死死盯着手中的亲子鉴定书，指尖发白。
    顾清（颤抖）：这就是你给我的解释？
    △沈墨冷漠地整理袖口，看都不看她一眼。
    沈墨：事实摆在眼前。

    【输出格式】：
    请返回 JSON 数组，将剧本拆解为块：
    [
      { "type": "SCENE_HEADING", "content": "1-1 别墅客厅 夜 内" },
      { "type": "ACTION", "content": "人物：顾清、沈墨" },
      { "type": "ACTION", "content": "△顾清死死盯着手中的亲子鉴定书..." },
      { "type": "DIALOGUE", "content": "顾清（颤抖）：这就是你给我的解释？" }
    ]
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const blocks = JSON.parse(response.text || "[]");
      if (Array.isArray(blocks)) {
         return blocks.map((b: any) => ({ 
            id: crypto.randomUUID(),
            type: b.type || ScriptBlockType.ACTION, 
            content: b.content || "" 
         }));
      }
      return [];
    } catch (e) {
      console.error(e);
      return [{
          id: crypto.randomUUID(),
          type: ScriptBlockType.ACTION,
          content: "[AI 生成失败，请重试]"
      }];
    }
  },

  // --- Character Extraction (UPDATED: Deep Psychological & Background Analysis) ---
  async extractCharactersFromOutline(totalOutline: string, lang: AppLanguage): Promise<{ characters: any[], relationships: any[] }> {
    const prompt = `
    你是一位**世界级的小说人物侧写师和心理学家**。请基于以下【故事总纲】，对其中的每一个关键角色进行**深度心理分析与背景重构**。

    【故事总纲】：
    ${totalOutline}

    【分析要求】：
    请提取所有主要角色，并为每个人物构建一份**极度详细的深度档案**。请发挥合理的想象力补全细节，使人物立体、有血有肉。

    请严格按照以下 JSON 结构返回（不要Markdown格式，直接返回 JSON）：
    {
      "characters": [
        { 
           "name": "姓名", 
           "role": "角色定位 (主角/反派/核心配角)", 
           "age": "年龄", 
           "description": "【外貌与核心性格】。例如：身穿洗得发白的牛仔裤，眼角有一道浅疤。性格孤僻冷傲，外冷内热，极度洁癖。",
           "origins": { 
               "family": "【原生家庭与成长环境】。详细描述其原生家庭（如：单亲、财阀私生子、贫民窟），以及这如何导致了现在的性格缺陷。", 
               "background": "【社会背景与职业现状】。当前的社会地位、职业、经济状况及社会关系网。" 
           },
           "stages": { 
               "setup": "【初期：表面目标 (The Want)】。故事开始时，角色误以为自己想要什么？（例如：想要赚钱还债、想要向父亲证明自己）", 
               "struggle": "【中期：核心欲望 (The Need)】。在压力和冲突下，角色内心深处真正缺失和渴望的是什么？（例如：渴望被无条件接纳、渴望安全感）", 
               "resolution": "【结局：蜕变状态 (The Result)】。经历故事后，角色发生了什么本质改变？（例如：放下了仇恨，学会了爱）" 
           }
        }
      ],
      "relationships": [
        { "source": "人物A", "target": "人物B", "label": "【关系定义】。例如：宿敌、貌合神离的盟友、暗恋" }
      ]
    }
    `;
    const response = await ai.models.generateContent({ 
        model: 'gemini-3-pro-preview', 
        contents: prompt, 
        config: { responseMimeType: "application/json" } 
    });
    return JSON.parse(response.text || "{}");
  },

  // --- Other existing methods remain unchanged ---
  async deepAnalyzeNovelFullReport(chunks: NovelUploadChunk[], lang: AppLanguage): Promise<NovelDeepAnalysis> {
    // ... existing implementation
    const fullContentSample = chunks.map(c => `【文件：${c.fileName}】\n${c.content}`).join('\n\n');
    const safeContent = fullContentSample.substring(0, 800000); 

    const prompt = `
    你是一位资深的网文IP改编专家。请阅读以下小说内容，撰写一份深度IP评估报告。

    【小说正文】：
    ${safeContent}
    ${fullContentSample.length > 800000 ? "\n...(内容过长，已截断)..." : ""}

    【输出要求】：
    请返回 JSON 对象，包含：
    1. **worldView**: 世界观 Markdown 文本。
    2. **mainPlot**: 主线剧情 Markdown 文本 (3000字以上详细梗概)。
    3. **characterCards**: 关键人物卡片数组。每个对象包含：
       - "name": 姓名
       - "tagline": 一句话标签 (如"复仇千金")
       - "archetype": 原型 (如"美强惨")
       - "description": 外貌与性格描述
       - "traits": [性格关键词数组]
       - "relationship": 与主角或核心剧情的关系简述

    返回 JSON 格式：
    {
      "worldView": "...",
      "mainPlot": "...",
      "characterCards": [
         { "name": "...", "tagline": "...", "archetype": "...", "description": "...", "traits": ["..."], "relationship": "..." }
      ]
    }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 12000 }
      }
    });

    try {
      const res = JSON.parse(response.text || "[]");
      return {
        worldView: res.worldView || "分析失败",
        mainPlot: res.mainPlot || "分析失败",
        characterProfiles: "", 
        characterCards: res.characterCards || []
      };
    } catch (e) {
      console.error(e);
      throw new Error("报告生成失败");
    }
  },
  
  async analyzeSingleChapter(chunk: NovelChapter): Promise<string> {
    const prompt = `请快速阅读以下小说片段（第 ${chunk.index} 部分），提炼出核心摘要。
    【片段内容】：${chunk.rawContent.substring(0, 15000)}...
    直接返回摘要文本。`;
    await delay(1000);
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text || "无内容";
  },

  async analyzeNovelAdaptationStrategies(chapters: NovelChapter[], lang: AppLanguage): Promise<any> { return {}; },
  async adaptStageToEpisodeOutline(stage: DramaStage, fullSummaryContext: string, lang: AppLanguage): Promise<OutlineSection> { return { id: '', title: '', content: '', scenes: [] }; },
  async expandLoglineToOutline(logline: string, format: ScriptFormat, lang: AppLanguage): Promise<string> {
    const prompt = `将以下梗概扩写为1000字深度故事总纲：${logline}`;
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
    return response.text || "";
  },
  async generateTotalOutline(context: string, lang: AppLanguage, format?: ScriptFormat): Promise<string> {
    return this.expandLoglineToOutline(context, format || ScriptFormat.SHORT_VIDEO, lang);
  },
  async generateEpisodeBreakdown(totalOutline: string, format: ScriptFormat, count: number, lang: AppLanguage): Promise<any> { return {}; },
  async extractProjectMetadata(data: ProjectData): Promise<any> { return {}; },
  async analyzeNovelAdaptation(text: string, lang: AppLanguage): Promise<any> { return {}; },
  async generateProfessionalScript(block: any, context: string, lang: AppLanguage): Promise<string> { return ""; },
  async chatWithCoach(messages: any[], userInput: string, context: string, lang: AppLanguage): Promise<string> { 
      // Basic chat implementation
      const prompt = `Context: ${context}\nUser: ${userInput}`;
      try {
          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: prompt
          });
          return response.text || "";
      } catch { return "Error connecting to coach."; }
  },
  async inferCharacterRelationships(characters: Character[], events: PlotEvent[], lang: AppLanguage): Promise<any[]> {
      const prompt = `Infer relationships between characters based on events. Return JSON array of CharacterRelationship.`;
      try {
        const response = await ai.models.generateContent({
             model: 'gemini-3-flash-preview',
             contents: prompt,
             config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "[]");
       } catch { return []; }
  },
  async generateVisualPrompts(content: string, type: ScriptBlockType, style: string, charContext: string, lang: AppLanguage): Promise<any> {
      const prompt = `Generate visual prompt for: ${content}. Style: ${style}. Return JSON: { visualDescription:string, imagePrompt:string, soundDesign:string, cameraMovement:string, focalLength:string }`;
      try {
        const response = await ai.models.generateContent({
             model: 'gemini-3-flash-preview',
             contents: prompt,
             config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "{}");
       } catch { return {}; }
  },
  async generateImage(prompt: string, aspectRatio: AspectRatio): Promise<string | undefined> {
      try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { 
                imageConfig: { aspectRatio: aspectRatio }
            }
        });
        // Find image part
        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
        }
        return undefined;
      } catch (e) { console.error(e); return undefined; }
  },
  async editImage(base64Image: string, prompt: string): Promise<string | undefined> {
      try {
          // Edit image using gemini-2.5-flash-image
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: {
                  parts: [
                      { inlineData: { mimeType: 'image/png', data: base64Image } },
                      { text: prompt }
                  ]
              }
          });
          const parts = response.candidates?.[0]?.content?.parts;
            if (parts) {
                for (const part of parts) {
                    if (part.inlineData) {
                        return part.inlineData.data;
                    }
                }
            }
          return undefined;
      } catch (e) { console.error(e); return undefined; }
  },
  async analyzeScriptDoctor(title: string, content: string, scenes: any[], lang: AppLanguage): Promise<any> {
      const prompt = `Analyze script "${title}". Return JSON: { emotions: number[], plotDensity: number[], diagnosis: string, suggestions: [{advice:string, revision:string}] }`;
      try {
        const response = await ai.models.generateContent({
             model: 'gemini-3-pro-preview',
             contents: prompt,
             config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "{}");
       } catch { return { emotions: [], plotDensity: [], diagnosis: "分析失败", suggestions: [] }; }
  },
  async analyzeMarketPerformance(title: string, genre: string, logline: string, style: ProductionStyle, lang: AppLanguage): Promise<any> {
     const prompt = `Analyze market performance for ${style} drama "${title}". Return JSON: { metrics: {excitement:number, innovation:number, emotion:number, roiValue:number}, audience: {gender:{male:number, female:number}, painPoints:string[]}, benchmarking: [{title:string, similarity:number, keySuccessFactor:string}], gaps: [{aspect:string, description:string, advice:string}], finalVerdict:string }`;
      try {
        const response = await ai.models.generateContent({
             model: 'gemini-3-pro-preview',
             contents: prompt,
             config: { responseMimeType: "application/json", tools: [{ googleSearch: {} }] }
        });
        return JSON.parse(response.text || "{}");
       } catch { return { metrics:{}, audience:{gender:{}}, benchmarking:[], gaps:[], finalVerdict: "分析失败" }; }
  },
  async fetchTrendingInsights(category: string, lang: AppLanguage): Promise<any> {
      const prompt = `Analyze current market trends for ${category} dramas. Return JSON: { marketSummary: string, audiencePulse: string, trendingDramas: [{ title: string, hotScore: number, tags: string[], analysis: string }] }`;
       try {
        const response = await ai.models.generateContent({
             model: 'gemini-3-pro-preview',
             contents: prompt,
             config: { responseMimeType: "application/json", tools: [{ googleSearch: {} }] }
        });
        return JSON.parse(response.text || "{}");
       } catch { return { marketSummary: "无法获取", audiencePulse: "", trendingDramas: [] }; }
  },
  async compareScriptWithBenchmark(project: ProjectData, benchmarkTitle: string, lang: AppLanguage): Promise<any> {
      const prompt = `Compare script "${project.title}" with benchmark "${benchmarkTitle}". Return JSON: { comparisonMetrics: { benchmark: {excitement:number, innovation:number, emotion:number, pacing:number, roi:number}, user: {excitement:number, innovation:number, emotion:number, pacing:number, roi:number} }, gapAnalysis: [{aspect:string, benchmarkExpressed:string, userDeficiency:string, fixAdvice:string}], finalVerdict:string }`;
      try {
        const response = await ai.models.generateContent({
             model: 'gemini-3-pro-preview',
             contents: prompt,
             config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "{}");
       } catch { return { comparisonMetrics: {benchmark:{}, user:{}}, gapAnalysis: [], finalVerdict: "分析失败" }; }
  },
  async searchMarketIntelligence(query: string, lang: AppLanguage): Promise<any> {
       const prompt = `Search for "${query}". Return market intelligence text and sources. JSON: { text: string, sources: [{uri:string, title:string}] }`;
       try {
        const response = await ai.models.generateContent({
             model: 'gemini-3-pro-preview',
             contents: prompt,
             config: { responseMimeType: "application/json", tools: [{ googleSearch: {} }] }
        });
        return JSON.parse(response.text || "{}");
       } catch { return { text: "Search failed", sources: [] }; }
  },
  async generateProductionStoryboard(blocks: ScriptBlock[], aesthetic: string, vision: string, title: string, lang: AppLanguage): Promise<any[]> {
      const prompt = `Generate storyboard rows for script blocks. Return JSON array of StoryboardRow objects.`;
      try {
        const response = await ai.models.generateContent({
             model: 'gemini-3-pro-preview',
             contents: prompt,
             config: { responseMimeType: "application/json" }
        });
        const res = JSON.parse(response.text || "[]");
        return Array.isArray(res) ? res : [];
       } catch { return []; }
  },
  async polishAiPrompt(row: any, aesthetic: string, vision: string, lang: AppLanguage): Promise<string> {
      const prompt = `Polish this image prompt: ${row.aiPrompt || row.visualContent}. Aesthetic: ${aesthetic}. Vision: ${vision}. Return only the polished prompt string.`;
      try {
        const response = await ai.models.generateContent({
             model: 'gemini-3-flash-preview',
             contents: prompt
        });
        return response.text || "";
       } catch { return ""; }
  }
};
