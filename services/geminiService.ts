
// GeminiService implementation providing AI-powered scriptwriting assistance using Google GenAI SDK.
import { GoogleGenAI, Type } from "@google/genai";
import { Character, PlotEvent, ScriptBlock, ScriptBlockType, AppLanguage, ScriptFormat, OutlineSection, DoctorAnalysis, ProductionStyle } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getLanguageName = (lang: AppLanguage) => {
  switch (lang) {
    case 'zh-CN': return 'Simplified Chinese';
    case 'en': return 'English';
    default: return 'Simplified Chinese';
  }
};

const STANDARD_SCRIPT_PROMPT = `
你是一位精通爆款短剧与电影结构的资深编剧。你的剧本创作必须严格遵循以下标准格式：

1. 场景标题 (SCENE_HEADING) 规范：
   - 必须包含序号，格式为“集数-场景序号”，例如：“1-1 内景. 客厅 - 日”。
   - 结构：[序号] [内/外景]. [拍摄地点] - [时间（日/夜/黄昏等）]
   - 示例：1-5 外景. 繁华街道 - 夜

2. 正文结构要求：
   - 场景标题 (SCENE_HEADING)
   - 动作描述 (ACTION)：注重视觉化，简洁有力，描述画面中发生的动作。
   - 角色姓名 (CHARACTER)：对白上方的角色名字。
   - 对白 (DIALOGUE)：角色台词，需符合人设。
   - 括号 (PARENTHETICAL)：情绪或动作微调。
   - 转场 (TRANSITION)：如“切至：”、“淡出”。

3. 创作建议：
   - 保持高节奏，尤其针对短剧赛道。
   - 每一场戏都应有明确的冲突或钩子。
`;

export const GeminiService = {
  async chatWithCoach(history: any[], newMessage: string, context: string, lang: AppLanguage = 'zh-CN'): Promise<string> {
    const model = 'gemini-3-pro-preview';
    const response = await ai.models.generateContent({
      model,
      contents: [
        { role: 'user', parts: [{ text: `Current Context:\n${context}` }] },
        ...history.map(msg => ({ role: msg.role, parts: [{ text: msg.text }] })),
        { role: 'user', parts: [{ text: newMessage }] }
      ],
      config: { systemInstruction: STANDARD_SCRIPT_PROMPT + `\nRespond in ${getLanguageName(lang)}.` }
    });
    return response.text || "";
  },

  async analyzeMarketPerformance(title: string, genre: string, logline: string, style: ProductionStyle, lang: AppLanguage): Promise<any> {
    const model = 'gemini-3-pro-preview';
    const styleLabel = {
      [ProductionStyle.COMIC_DRAMA]: '漫剧',
      [ProductionStyle.MOTION_COMIC]: '动态漫',
      [ProductionStyle.LIVE_ACTION]: '真人短剧'
    }[style];

    const prompt = `
      作为专业的影视市场对标分析专家，请针对以下项目在“${styleLabel}”市场的表现进行深度分析。
      
      项目基本信息：
      标题：${title}
      题材：${genre}
      一句话故事：${logline}
      制作形式：${styleLabel}

      分析任务：
      1. 核心受众画像：针对该“制作形式”的具体受众属性（如漫剧受众更偏向二次元/女性向等）。
      2. 爆款对标分析：列举 2-3 个在“${styleLabel}”领域类似的爆款作品（可以是真实或模拟典型），并分析本项目与它们的“匹配度”。
      3. 竞争维度评分：在 爽感、创新、情感连接、制作性价比 四个维度打分（0-100）。
      4. 爆款差距 (Gap Analysis)：指出要达到该赛道顶尖水平，本项目目前最需要优化的 3 个点。
      5. 商业 ROI 预测。

      返回 JSON 格式：
      {
        "audience": { "gender": { "male": number, "female": number }, "ageGroups": [{ "group": string, "percentage": number }], "painPoints": [string] },
        "benchmarking": [
          { "title": string, "similarity": number, "keySuccessFactor": string }
        ],
        "metrics": { "excitement": number, "innovation": number, "emotion": number, "roiValue": number },
        "gaps": [{ "aspect": string, "description": string, "advice": string }],
        "finalVerdict": string
      }

      语言：${getLanguageName(lang)}
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              audience: {
                type: Type.OBJECT,
                properties: {
                  gender: {
                    type: Type.OBJECT,
                    properties: { male: { type: Type.NUMBER }, female: { type: Type.NUMBER } }
                  },
                  ageGroups: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: { group: { type: Type.STRING }, percentage: { type: Type.NUMBER } }
                    }
                  },
                  painPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              },
              benchmarking: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    similarity: { type: Type.NUMBER },
                    keySuccessFactor: { type: Type.STRING }
                  }
                }
              },
              metrics: {
                type: Type.OBJECT,
                properties: {
                  excitement: { type: Type.NUMBER },
                  innovation: { type: Type.NUMBER },
                  emotion: { type: Type.NUMBER },
                  roiValue: { type: Type.NUMBER }
                }
              },
              gaps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    aspect: { type: Type.STRING },
                    description: { type: Type.STRING },
                    advice: { type: Type.STRING }
                  }
                }
              },
              finalVerdict: { type: Type.STRING }
            }
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return null;
    }
  },

  async continueScript(previousBlocks: ScriptBlock[], sceneContext: string, lang: AppLanguage = 'zh-CN'): Promise<ScriptBlock[]> {
    const model = 'gemini-3-pro-preview';
    const prompt = `
      根据标准剧本格式续写剧本。
      注意场景标题必须包含集数-场景序号（如 1-1 内景. 街道 - 日）。
      上下文：${sceneContext}
      最近内容：${previousBlocks.slice(-5).map(b => b.content).join('\n')}

      返回 JSON 数组，包含 type 和 content 字段。
      type 可选值: SCENE_HEADING, ACTION, CHARACTER, DIALOGUE, PARENTHETICAL, TRANSITION。
    `;
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                content: { type: Type.STRING }
              },
              required: ['type', 'content']
            }
          }
        }
      });
      return JSON.parse(response.text || "[]").map((b: any) => ({
        id: crypto.randomUUID(),
        ...b
      }));
    } catch (e) { return []; }
  },

  async expandLoglineToOutline(logline: string, lang: AppLanguage): Promise<string> {
    const model = 'gemini-3-pro-preview';
    const prompt = `你是一位编剧。请根据以下“一句话故事”，将其扩写为一份逻辑严密的故事大纲。要求：目标字数在 800 字左右。一句话故事：${logline}。请使用 ${getLanguageName(lang)} 创作。`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "";
  },

  async generateImage(prompt: string, aspectRatio: string = '9:16'): Promise<string | null> {
    const model = 'gemini-2.5-flash-image'; 
    try {
      const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: aspectRatio as any } }
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
      return null;
    } catch (e) { return null; }
  },

  async editImage(base64ImageData: string, prompt: string): Promise<string | null> {
    const model = 'gemini-2.5-flash-image';
    try {
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            {
              inlineData: {
                data: base64ImageData,
                mimeType: 'image/png',
              },
            },
            { text: prompt },
          ],
        },
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
      return null;
    } catch (e) { return null; }
  },

  async generateCharacter(prompt: string, lang: AppLanguage = 'zh-CN'): Promise<any> {
    const model = 'gemini-3-pro-preview';
    const response = await ai.models.generateContent({
      model,
      contents: `Generate a character based on: ${prompt} in JSON. Language: ${getLanguageName(lang)}`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            role: { type: Type.STRING },
            age: { type: Type.STRING },
            description: { type: Type.STRING },
            goal: { type: Type.STRING },
            conflict: { type: Type.STRING },
            arc: { type: Type.STRING }
          },
          required: ['name', 'role', 'description']
        }
      }
    });
    return { id: crypto.randomUUID(), ...JSON.parse(response.text || "{}") };
  },

  async extractCharactersFromOutline(outline: string, lang: AppLanguage): Promise<Partial<Character>[]> {
    const model = 'gemini-3-pro-preview';
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `Extract characters from the following outline in JSON format: ${outline}. Language: ${getLanguageName(lang)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                role: { type: Type.STRING },
                age: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            }
          }
        }
      });
      return JSON.parse(response.text || "[]").map((c: any) => ({ ...c, id: crypto.randomUUID() }));
    } catch (e) { return []; }
  },

  async generateTotalOutline(context: string, lang: AppLanguage): Promise<string> {
    const model = 'gemini-3-pro-preview';
    const response = await ai.models.generateContent({
      model,
      contents: `Create a comprehensive story outline based on the following context: ${context}. Language: ${getLanguageName(lang)}`,
    });
    return response.text || "";
  },

  async generateEpisodeBreakdown(totalOutline: string, format: ScriptFormat, count: number, lang: AppLanguage): Promise<OutlineSection[]> {
    const model = 'gemini-3-pro-preview';
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `Break down the following story outline into ${count} episodes for ${format} format. Return as JSON array of sections. Language: ${getLanguageName(lang)}\nOutline: ${totalOutline}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                tips: { type: Type.STRING },
                content: { type: Type.STRING }
              },
              required: ['title', 'content']
            }
          }
        }
      });
      return JSON.parse(response.text || "[]").map((s: any) => ({
        id: crypto.randomUUID(),
        scenes: [],
        ...s
      }));
    } catch (e) { return []; }
  },

  async generateOutlineSection(title: string, context: string, lang: AppLanguage): Promise<string> {
    const model = 'gemini-3-pro-preview';
    const response = await ai.models.generateContent({
      model,
      contents: `Expand on the episode titled "${title}" using this context: ${context}. Language: ${getLanguageName(lang)}`,
    });
    return response.text || "";
  },

  async generateEpisodeBeats(sectionContent: string, format: ScriptFormat, lang: AppLanguage): Promise<any[]> {
    const model = 'gemini-3-pro-preview';
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `Generate structural beats for this episode content in ${format} format: ${sectionContent}. Return as JSON array. Language: ${getLanguageName(lang)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING }
              },
              required: ['title', 'summary']
            }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (e) { return []; }
  },

  async analyzeOutline(outline: OutlineSection[], lang: AppLanguage): Promise<string> {
    const model = 'gemini-3-pro-preview';
    const response = await ai.models.generateContent({
      model,
      contents: `Analyze the structural integrity and pacing of the following outline: ${JSON.stringify(outline)}. Language: ${getLanguageName(lang)}`,
    });
    return response.text || "";
  },

  async generatePlotEvents(context: string, lang: AppLanguage): Promise<Partial<PlotEvent>[]> {
    const model = 'gemini-3-pro-preview';
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `Generate a sequence of major plot events based on: ${context}. Return as JSON array. Language: ${getLanguageName(lang)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                tensionLevel: { type: Type.NUMBER }
              },
              required: ['title', 'description']
            }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (e) { return []; }
  },

  async generateScriptFromAct(actTitle: string, actContent: string, events: PlotEvent[], characters: Character[], lang: AppLanguage): Promise<ScriptBlock[]> {
    const model = 'gemini-3-pro-preview';
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `Write a full script for "${actTitle}" using this summary: ${actContent}. Plot events: ${JSON.stringify(events)}. Characters: ${JSON.stringify(characters)}. 
        注意：每个场景标题必须以“集数-场次”开头，例如：1-1 内景. 客厅 - 日。
        Return as JSON array of blocks. Language: ${getLanguageName(lang)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                content: { type: Type.STRING }
              },
              required: ['type', 'content']
            }
          }
        }
      });
      return JSON.parse(response.text || "[]").map((b: any) => ({
        id: crypto.randomUUID(),
        ...b
      }));
    } catch (e) { return []; }
  },

  async generateVisualPrompts(content: string, type: ScriptBlockType, style: string, charContext: string, lang: AppLanguage): Promise<any> {
    const model = 'gemini-3-pro-preview';
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `Generate visual storyboard prompts for this scene: ${content}. Type: ${type}. Style: ${style}. Characters: ${charContext}. Return as JSON. Language: ${getLanguageName(lang)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              visualDescription: { type: Type.STRING },
              imagePrompt: { type: Type.STRING },
              soundDesign: { type: Type.STRING },
              cameraMovement: { type: Type.STRING },
              focalLength: { type: Type.STRING }
            },
            required: ['visualDescription', 'imagePrompt']
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (e) { return {}; }
  },

  async analyzeNovelText(content: string, lang: AppLanguage): Promise<any> {
    const model = 'gemini-3-pro-preview';
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `Analyze this novel text for adaptation. Extract summary, themes, characters, storylines, AND specific concrete events/beats with tension levels (1-10). Return as JSON. Language: ${getLanguageName(lang)}. Text: ${content}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              themes: { type: Type.ARRAY, items: { type: Type.STRING } },
              characters: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    role: { type: Type.STRING },
                    trait: { type: Type.STRING }
                  }
                }
              },
              storylines: { type: Type.ARRAY, items: { type: Type.STRING } },
              events: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    tensionLevel: { type: Type.NUMBER }
                  }
                }
              }
            },
            required: ['summary', 'characters', 'events']
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (e) { return null; }
  },

  async adaptNovelToScript(content: string, lang: AppLanguage): Promise<ScriptBlock[]> {
    const model = 'gemini-3-pro-preview';
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `Adapt this novel excerpt into a script. 
        注意：每个场景标题必须以“集数-场次”开头，例如：1-1 内景. 客厅 - 日。
        Content: ${content}. Return as JSON array of blocks. Language: ${getLanguageName(lang)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                content: { type: Type.STRING }
              },
              required: ['type', 'content']
            }
          }
        }
      });
      return JSON.parse(response.text || "[]").map((b: any) => ({
        id: crypto.randomUUID(),
        ...b
      }));
    } catch (e) { return []; }
  },

  async analyzeScriptDoctor(title: string, content: string, scenes: any[], lang: AppLanguage): Promise<DoctorAnalysis> {
    const model = 'gemini-3-pro-preview';
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `Perform a script doctor analysis on "${title}" with summary: ${content}. Scenes: ${JSON.stringify(scenes)}. Return as JSON. Language: ${getLanguageName(lang)}`,
        config: {
          thinkingConfig: { thinkingBudget: 32768 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              emotions: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              infoDensity: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              plotDensity: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              diagnosis: { type: Type.STRING },
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    target: { type: Type.STRING },
                    advice: { type: Type.STRING },
                    revision: { type: Type.STRING }
                  }
                }
              }
            },
            required: ['emotions', 'diagnosis', 'suggestions']
          }
        }
      });
      const data = JSON.parse(response.text || "{}");
      return {
        emotions: data.emotions || [],
        infoDensity: data.infoDensity || [],
        plotDensity: data.plotDensity || [],
        diagnosis: data.diagnosis || "",
        suggestions: (data.suggestions || []).map((s: any) => ({ ...s, id: s.id || crypto.randomUUID() }))
      };
    } catch (e) { 
      throw new Error("Diagnosis failed");
    }
  }
};
