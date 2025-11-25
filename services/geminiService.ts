
import { GoogleGenAI, Schema } from "@google/genai";
import { Character, OutlineSection, PlotEvent, ScriptBlock, ScriptBlockType, ProjectData, NovelAnalysis, AppLanguage, ScriptFormat, StoryboardData, ShotType, CameraAngle } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getLanguageName = (lang: AppLanguage) => {
  switch (lang) {
    case 'zh-CN': return 'Simplified Chinese';
    case 'zh-TW': return 'Traditional Chinese';
    case 'en': return 'English';
    case 'ko': return 'Korean';
    case 'ja': return 'Japanese';
    default: return 'Simplified Chinese';
  }
};

const getCoachSystemInstruction = (lang: AppLanguage) => `
You are a world-class screenwriting coach and co-writer (InkFlow Copilot). 
Your goal is to help the user create compelling stories for movies, TV series, or web shorts.
You are knowledgeable about "Save the Cat", "The Hero's Journey", and standard screenplay formatting.
Always provide constructive feedback.

IMPORTANT: You MUST interact and generate content in ${getLanguageName(lang)}.

*** DATA SYNC PROTOCOL ***
If the user asks you to create, modify, or suggest specific content for the project, you MUST provide structured Action Blocks at the end of your response.
You can provide MULTIPLE action blocks if needed (e.g., one for characters, one for relationships).

Format EACH Action Block exactly like this:
:::ACTION_START:::
{
  "type": "ACTION_TYPE",
  "description": "Short description of change",
  "data": { ... }
}
:::ACTION_END:::

Supported Actions:

1. "ADD_CHARACTERS_BATCH": (Use this for adding one or multiple characters)
   data: { 
     "characters": [
       { "name": "Name", "role": "Role", "age": "20", "description": "...", "goal": "...", "conflict": "...", "arc": "...", "visualDesign": { "clothing": "...", "pose": "...", "expression": "...", "style": "..." } },
       ...
     ]
   }

2. "UPDATE_RELATIONSHIPS": (Use this to connect characters in the map)
   *Important: Use exact character NAMES for sourceName and targetName. The system will link them.*
   data: {
     "relationships": [
       { "sourceName": "Romeo", "targetName": "Juliet", "label": "Lovers" },
       { "sourceName": "Mercutio", "targetName": "Romeo", "label": "Best Friend" }
     ]
   }

3. "UPDATE_OUTLINE_SECTION": 
   data: { "sectionId": "ID_FROM_CONTEXT", "content": "..." }

4. "ADD_PLOT_EVENT":
   data: { "title": "...", "description": "...", "tensionLevel": 5 }

5. "UPDATE_LOGLINE":
   data: { "logline": "..." }

Example for creating a full cast:
"Here are the main characters for your story...
:::ACTION_START:::
{
  "type": "ADD_CHARACTERS_BATCH",
  "description": "Add 3 Characters: Hero, Villain, Mentor",
  "data": { "characters": [ ... ] }
}
:::ACTION_END:::
:::ACTION_START:::
{
  "type": "UPDATE_RELATIONSHIPS",
  "description": "Update Relationship Map",
  "data": { "relationships": [ { "sourceName": "Hero", "targetName": "Villain", "label": "Enemies" } ] }
}
:::ACTION_END:::"
`;

export const GeminiService = {
  /**
   * General Chat / Coaching function
   */
  async chatWithCoach(history: { role: string; text: string }[], newMessage: string, context: string, lang: AppLanguage = 'zh-CN'): Promise<string> {
    try {
      const model = 'gemini-2.5-flash';
      const response = await ai.models.generateContent({
        model,
        contents: [
          { role: 'user', parts: [{ text: `Current Project Context (Use IDs for updates):\n${context}` }] },
          ...history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
          })),
          { role: 'user', parts: [{ text: newMessage }] }
        ],
        config: {
          systemInstruction: getCoachSystemInstruction(lang),
        }
      });
      return response.text || "Thinking...";
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      return "Error: Unable to connect to AI assistant.";
    }
  },

  /**
   * Generate a character profile based on a brief description
   */
  async generateCharacter(prompt: string, lang: AppLanguage = 'zh-CN'): Promise<Character> {
    const model = 'gemini-2.5-flash';
    const jsonPrompt = `
      Create a character based on this description: "${prompt}".
      Return strictly JSON format.
      ALL VALUES MUST BE IN ${getLanguageName(lang)}.
      Fields: name, role, age, description, goal, conflict, arc.
    `;
    
    try {
      const response = await ai.models.generateContent({
        model,
        contents: jsonPrompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      
      const text = response.text || "{}";
      const data = JSON.parse(text);
      return {
        id: crypto.randomUUID(),
        ...data,
        visualDesign: {
           clothing: "Default",
           pose: "Neutral",
           expression: "Calm"
        }
      };
    } catch (error) {
      console.error("Character Gen Error:", error);
      throw new Error("Failed to generate character.");
    }
  },

  /**
   * Generate plot events (beats) for the story
   */
  async generatePlotEvents(context: string, lang: AppLanguage = 'zh-CN'): Promise<PlotEvent[]> {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Generate 5-8 key plot events (beats) for a story with the following context:
      ${context}
      
      Return a JSON array where each object has:
      - title: string (short title of the event in ${getLanguageName(lang)})
      - description: string (what happens in ${getLanguageName(lang)})
      - tensionLevel: number (1-10, estimating emotional intensity)
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text || "[]";
      const rawEvents = JSON.parse(text);

      return rawEvents.map((e: any) => ({
        id: crypto.randomUUID(),
        title: e.title,
        description: e.description,
        tensionLevel: e.tensionLevel
      }));

    } catch (error) {
      console.error("Plot Gen Error:", error);
      return [];
    }
  },

  /**
   * Suggest the next script blocks based on previous context
   */
  async continueScript(previousBlocks: ScriptBlock[], sceneContext: string, lang: AppLanguage = 'zh-CN'): Promise<ScriptBlock[]> {
    const model = 'gemini-2.5-flash';
    
    // Convert previous blocks to a readable script format for context
    const scriptText = previousBlocks.slice(-10).map(b => `[${b.type}] ${b.content}`).join('\n');

    const prompt = `
      Continue this screenplay scene. 
      Context: ${sceneContext}
      Previous lines:
      ${scriptText}

      Write the next 3-5 blocks of the script in ${getLanguageName(lang)}.
      Return a JSON array where each object has "type" (SCENE_HEADING, ACTION, CHARACTER, DIALOGUE, PARENTHETICAL) and "content".
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text || "[]";
      const rawBlocks = JSON.parse(text);

      return rawBlocks.map((b: any) => ({
        id: crypto.randomUUID(),
        type: (b.type as ScriptBlockType) || ScriptBlockType.ACTION,
        content: b.content || ""
      }));

    } catch (error) {
      console.error("Script Gen Error:", error);
      return [];
    }
  },

  /**
   * Generate a full script for a specific Act/Episode based on plot events
   */
  async generateScriptFromAct(
    actTitle: string,
    actSummary: string,
    plotEvents: PlotEvent[],
    characters: Character[],
    lang: AppLanguage = 'zh-CN'
  ): Promise<ScriptBlock[]> {
    const model = 'gemini-2.5-flash';
    
    const eventsText = plotEvents.map(e => `- ${e.title}: ${e.description}`).join('\n');
    const charsText = characters.map(c => `- ${c.name} (${c.role}): ${c.description}`).join('\n');

    const prompt = `
      Act as a professional screenwriter.
      Write the full screenplay script for the following Episode/Act: "${actTitle}".
      
      Language: ${getLanguageName(lang)}.
      Target Length: Detailed screenplay, approx 1500-2000 words.
      
      Episode Summary:
      ${actSummary}
      
      Detailed Plot Events (Beats):
      ${eventsText}
      
      Characters available:
      ${charsText}
      
      Format: Standard Screenplay (Scene Headings, Action, Dialogue).
      
      Output ONLY a JSON array of objects with 'type' and 'content'.
      Types allowed: SCENE_HEADING, ACTION, CHARACTER, DIALOGUE, PARENTHETICAL, TRANSITION.
      
      Do not output any markdown or explanation. Just the JSON array.
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text || "[]";
      // Cleanup json block markers if present
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      
      // Find the array start and end to avoid extra text
      const arrayStart = cleanJson.indexOf('[');
      const arrayEnd = cleanJson.lastIndexOf(']');
      
      if (arrayStart === -1 || arrayEnd === -1) {
          throw new Error("Invalid JSON format");
      }
      
      const finalJson = cleanJson.substring(arrayStart, arrayEnd + 1);
      
      const rawBlocks = JSON.parse(finalJson);

      return rawBlocks.map((b: any) => ({
        id: crypto.randomUUID(),
        type: (b.type as ScriptBlockType) || ScriptBlockType.ACTION,
        content: b.content || ""
      }));

    } catch (error) {
      console.error("Script From Act Error:", error);
      return [];
    }
  },

  /**
   * Analyze novel text to extract characters and storylines
   */
  async analyzeNovelText(text: string, lang: AppLanguage = 'zh-CN'): Promise<NovelAnalysis | null> {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Act as a professional literary editor and screenwriter. Analyze the following novel segment.
      The output must be in ${getLanguageName(lang)}.
      
      Task:
      1. Summarize the core conflict in 1-2 sentences.
      2. Extract main characters (name, role, key personality trait).
      3. Identify key storylines or plot beats (chronological).
      4. Identify 2-3 main themes/keywords.

      Return ONLY JSON format:
      {
        "summary": "...",
        "characters": [ {"name": "...", "role": "...", "trait": "..."} ],
        "storylines": [ "...", "..." ],
        "themes": ["...", "..."]
      }

      Novel Text:
      "${text.slice(0, 10000)}"
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const textRes = response.text || "{}";
      return JSON.parse(textRes) as NovelAnalysis;
    } catch (error) {
      console.error("Novel Analysis Error:", error);
      return null;
    }
  },

  /**
   * Adapt novel text into script format
   */
  async adaptNovelToScript(novelText: string, lang: AppLanguage = 'zh-CN'): Promise<ScriptBlock[]> {
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are an expert scriptwriter adapting a novel.
      Convert the following novel text into a standard screenplay format (JSON).
      The content MUST be in ${getLanguageName(lang)}.
      
      Rules:
      1. Extract SCENE_HEADINGs based on location/time changes.
      2. Convert descriptive prose into concise ACTION lines (visuals only).
      3. Extract DIALOGUE and assign to CHARACTERs.
      4. Output ONLY a JSON array of objects with 'type' and 'content'.
      
      Types allowed: SCENE_HEADING, ACTION, CHARACTER, DIALOGUE, PARENTHETICAL, TRANSITION.
      
      Novel Text:
      "${novelText.slice(0, 8000)}" 
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text || "[]";
      const rawBlocks = JSON.parse(text);

      return rawBlocks.map((b: any) => ({
        id: crypto.randomUUID(),
        type: (b.type as ScriptBlockType) || ScriptBlockType.ACTION,
        content: b.content || ""
      }));
    } catch (error) {
       console.error("Adaptation Error:", error);
       return [];
    }
  },

  /**
   * Batch analyze script blocks to generate storyboard outlines
   */
  async analyzeScriptForStoryboard(blocks: ScriptBlock[], lang: AppLanguage = 'zh-CN'): Promise<Record<string, Partial<StoryboardData>>> {
    const model = 'gemini-2.5-flash';
    
    // Filter only visual blocks (Scene Heading and Action)
    const targetBlocks = blocks.filter(b => b.type === ScriptBlockType.SCENE_HEADING || b.type === ScriptBlockType.ACTION);
    if (targetBlocks.length === 0) return {};

    // Limit to first 20 visual blocks to prevent token overflow in a single pass for this demo
    // In production, this would be chunked.
    const blocksToAnalyze = targetBlocks.slice(0, 20);

    const inputJson = blocksToAnalyze.map(b => ({ id: b.id, type: b.type, content: b.content }));

    const prompt = `
      Act as a Director of Photography. Analyze these script blocks.
      For each block, determine the best Shot Type, Camera Angle, and a concise Visual Description.
      
      Shot Types allowed: ELS, LS, FS, MS, CU, ECU.
      Camera Angles allowed: EYE, LOW, HIGH, DUTCH, OTS, BIRD.
      Visual Description language: ${getLanguageName(lang)}.

      Input JSON: ${JSON.stringify(inputJson)}

      Return a JSON Object where keys are Block IDs and values are objects containing:
      - shotType (string from allowed list)
      - cameraAngle (string from allowed list)
      - visualDescription (string)
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text || "{}";
      return JSON.parse(text);
    } catch (error) {
      console.error("Batch Storyboard Analysis Error:", error);
      return {};
    }
  },

  /**
   * Generate visual prompts for storyboard
   */
  async generateVisualPrompts(
    blockContent: string, 
    blockType: string, 
    visualStyle: string, 
    characterContext: string,
    lang: AppLanguage = 'zh-CN'
  ): Promise<{
    visualDescription: string, 
    imagePrompt: string, 
    soundDesign: string,
    cameraMovement: string,
    focalLength: string
  }> {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Act as a professional cinematographer and director. Analyze this script line (${blockType}): "${blockContent}".
      
      Context settings:
      - Visual Style / Vibe: "${visualStyle}"
      - Character Visuals appearing in scene: ${characterContext || "None specified"}
      
      Tasks:
      1. Create a "Visual Description" (visualDescription) in ${getLanguageName(lang)} explaining camera focus, lighting, composition.
      2. Create an "Image Prompt" (imagePrompt) in English suitable for AI image generators (like Midjourney).
      3. Suggest "Sound Design" (soundDesign) in ${getLanguageName(lang)}.
      4. Suggest "Camera Movement" (cameraMovement) in English.
      5. Suggest "Focal Length" (focalLength).
      
      Return JSON.
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text || "{}";
      return JSON.parse(text);
    } catch (error) {
      console.error("Visual Prompt Gen Error:", error);
      return { 
        visualDescription: "Error generating description", 
        imagePrompt: "",
        soundDesign: "",
        cameraMovement: "STATIC",
        focalLength: "35mm"
      };
    }
  },

  /**
   * Generate an image from a prompt with aspect ratio support
   */
  async generateImage(prompt: string, aspectRatio: string = '16:9'): Promise<string | null> {
    const model = 'gemini-2.5-flash-image'; 
    try {
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
           imageConfig: {
             aspectRatio: aspectRatio
           }
        }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return part.inlineData.data;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Image Gen Error:", error);
      return null;
    }
  },

  /**
   * Edit/Refine an existing image based on a prompt
   */
  async editImage(base64Image: string, prompt: string): Promise<string | null> {
    const model = 'gemini-2.5-flash-image';
    try {
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: 'image/png' // Assuming standard format
              }
            },
            { text: prompt }
          ],
        },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return part.inlineData.data;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Image Edit Error:", error);
      return null;
    }
  },

  /**
   * Generate content for a specific outline section (Episode/Act)
   */
  async generateOutlineSection(title: string, context: string, lang: AppLanguage = 'zh-CN'): Promise<string> {
    const model = 'gemini-2.5-flash';
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `
          Write a short, engaging plot summary for the section: "${title}" of a screenplay.
          Project Context (Characters, Logline, etc): ${context}
          
          Write about 3-5 sentences in ${getLanguageName(lang)}.
        `,
      });
      return response.text || "";
    } catch (error) {
      console.error("Outline Section Gen Error:", error);
      return "";
    }
  },

  /**
   * Generate the Total Story Outline (Macro level)
   */
  async generateTotalOutline(context: string, lang: AppLanguage = 'zh-CN'): Promise<string> {
    const model = 'gemini-2.5-flash';
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `
           Act as a professional screenwriter. Write a comprehensive "Story Outline" (Total Outline) for the following project.
           
           Project Context:
           ${context}
           
           Requirements:
           - Approx 300-500 words.
           - Cover the beginning, middle, and end.
           - Highlight key emotional beats and major plot turns.
           - Language: ${getLanguageName(lang)}.
        `,
      });
      return response.text || "";
    } catch (error) {
       console.error("Total Outline Gen Error:", error);
       return "";
    }
  },

  /**
   * Analyze the outline and provide feedback
   */
  async analyzeOutline(outline: OutlineSection[], lang: AppLanguage = 'zh-CN'): Promise<string> {
    const model = 'gemini-2.5-flash';
    const outlineText = outline.map(s => {
      let text = `### ${s.title}\nSummary: ${s.content}`;
      if (s.scenes && s.scenes.length > 0) {
        text += `\nDetailed Scenes:\n` + s.scenes.map(sc => `- ${sc.title}: ${sc.summary}`).join('\n');
      }
      return text;
    }).join('\n\n');
    
    const response = await ai.models.generateContent({
      model,
      contents: `Analyze this story outline for pacing, structure, and emotional stakes. 
      Consider both the main act summaries and the specific scene breakdowns.
      Provide 3 specific improvements in ${getLanguageName(lang)}.
      
      Outline:
      ${outlineText}`,
      config: {
        systemInstruction: getCoachSystemInstruction(lang)
      }
    });

    return response.text || "Unable to analyze outline.";
  },

  /**
   * Generate outline structure (Acts/Episodes) based on format
   */
  async generateStructureTemplate(
    format: ScriptFormat, 
    genre: string, 
    lang: AppLanguage = 'zh-CN'
  ): Promise<OutlineSection[]> {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Create a standard outline structure template for a "${format}" in the "${genre}" genre.
      Language: ${getLanguageName(lang)}.
      
      Format Requirements:
      - SHORT_VIDEO (1-3 min): Needs Hook (Golden 3s), Reversal, Climax.
      - MOVIE (90+ min): 3-Act Structure (Setup, Confrontation, Resolution).
      - TV_SERIES (45 min): Teaser, Act 1, 2, 3, 4.
      - MID_FORM_SERIES (15-20 min): Act 1 (Setup), Act 2 (Conflict), Act 3 (Cliffhanger).
      
      Return a JSON array of OutlineSection objects:
      [{ "title": "...", "tips": "..." }]
      (Note: content and scenes should be empty strings/arrays)
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const text = response.text || "[]";
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      const arrayStart = cleanJson.indexOf('[');
      const arrayEnd = cleanJson.lastIndexOf(']');
      const finalJson = arrayStart !== -1 && arrayEnd !== -1 ? cleanJson.substring(arrayStart, arrayEnd + 1) : "[]";
      
      const raw = JSON.parse(finalJson);
      
      return raw.map((s: any) => ({
        id: crypto.randomUUID(),
        title: s.title,
        tips: s.tips,
        content: '',
        scenes: []
      }));
    } catch (e) {
      console.error("Structure Gen Error:", e);
      return [
        { id: crypto.randomUUID(), title: 'Act 1', content: '', tips: 'Setup', scenes: [] },
        { id: crypto.randomUUID(), title: 'Act 2', content: '', tips: 'Conflict', scenes: [] },
        { id: crypto.randomUUID(), title: 'Act 3', content: '', tips: 'Resolution', scenes: [] },
      ];
    }
  },

  /**
   * Generate a breakdown of episodes/acts based on the Total Outline
   */
  async generateEpisodeBreakdown(
    totalOutline: string, 
    format: ScriptFormat, 
    count: number, 
    lang: AppLanguage = 'zh-CN'
  ): Promise<OutlineSection[]> {
    const model = 'gemini-2.5-flash';
    
    // NOTE: Simplified to NO LONGER generate scenes automatically.
    // The user wants summary first, then on-demand scene structure generation.

    const prompt = `
      Act as a TV Showrunner or Head Writer.
      
      Input Task:
      Break down the following "Total Story Outline" into exactly ${count} distinct sections (Episodes or Acts) based on the format "${format}".
      
      Language: ${getLanguageName(lang)}.
      
      Total Outline:
      "${totalOutline}"
      
      Requirements:
      1. Create ${count} sections.
      2. For each section, provide a Title, a Summary Content (what happens in this episode/act), and Pacing Tips.
      3. Leave the 'scenes' array EMPTY for now. We will generate it later on demand.
      
      Return JSON Array:
      [
        { 
          "title": "Episode 1: ...", 
          "content": "Summary...", 
          "tips": "Pacing advice...",
          "scenes": []
        },
        ...
      ]
      Do NOT include Markdown formatting. Just raw JSON.
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const text = response.text || "[]";
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      const arrayStart = cleanJson.indexOf('[');
      const arrayEnd = cleanJson.lastIndexOf(']');
      const finalJson = arrayStart !== -1 && arrayEnd !== -1 ? cleanJson.substring(arrayStart, arrayEnd + 1) : "[]";

      const raw = JSON.parse(finalJson);
      return raw.map((s: any) => ({
        id: crypto.randomUUID(),
        title: s.title,
        content: s.content,
        tips: s.tips,
        scenes: [] // Explicitly empty
      }));
    } catch (e) {
      console.error("Breakdown Gen Error:", e);
      return [];
    }
  },

  /**
   * Generate structural beats/scenes for a SPECIFIC episode/section
   */
  async generateEpisodeBeats(
    sectionSummary: string,
    format: ScriptFormat,
    lang: AppLanguage = 'zh-CN'
  ): Promise<{title: string, summary: string}[]> {
    const model = 'gemini-2.5-flash';

    // Define strict structural requirements for specific scenes based on format
    let sceneStructureInstructions = "";
    if (format === ScriptFormat.SHORT_VIDEO) {
        sceneStructureInstructions = `
        CRITICAL: You MUST generate EXACTLY these functional beats:
        1. "黄金3秒 (Hook)"
        2. "铺垫 (Setup)"
        3. "反转 (Twist)"
        4. "高潮 (Climax)"
        5. "钩子 (Ending/Call to Action)"
        The 'title' MUST be these exact beat names.
        `;
    } else if (format === ScriptFormat.MOVIE) {
        sceneStructureInstructions = `
        Identify key dramatic beats (e.g., "Inciting Incident", "Plot Point 1", "Midpoint", "Climax").
        `;
    } else {
        sceneStructureInstructions = `
        Identify key events. Label the 'title' with dramatic function (e.g., "Hook", "Turning Point", "Cliffhanger").
        `;
    }

    const prompt = `
      Act as a Script Consultant.
      
      Task: Break down this specific Episode/Act Summary into a list of structural Scenes/Beats based on the format "${format}".
      
      Episode Summary:
      "${sectionSummary}"

      Structure Instructions (${format}):
      ${sceneStructureInstructions}
      
      Language: ${getLanguageName(lang)}.

      Return a JSON Array of objects:
      [
        { "title": "Beat Title", "summary": "What happens..." }
      ]
      Do NOT include Markdown formatting. Just raw JSON.
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const text = response.text || "[]";
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      const arrayStart = cleanJson.indexOf('[');
      const arrayEnd = cleanJson.lastIndexOf(']');
      const finalJson = arrayStart !== -1 && arrayEnd !== -1 ? cleanJson.substring(arrayStart, arrayEnd + 1) : "[]";
      
      const raw = JSON.parse(finalJson);
      return raw.map((sc: any) => ({
           title: sc.title || "Beat",
           summary: sc.summary || ""
      }));
    } catch (e) {
      console.error("Beat Gen Error:", e);
      return [];
    }
  },

  /**
   * Extract characters from a story outline
   */
  async extractCharactersFromOutline(outline: string, lang: AppLanguage = 'zh-CN'): Promise<Character[]> {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Analyze the following Story Outline and extract the main characters.
      
      Task:
      Identify characters mentioned or implied. Create a profile for each.
      Language: ${getLanguageName(lang)}.
      
      Input Outline:
      "${outline}"
      
      Output JSON Format:
      Return an Array of Character objects with these fields:
      - name: string
      - role: string (e.g., Protagonist, Antagonist, Supporting)
      - age: string (estimate if not specified)
      - description: string (brief bio & appearance)
      - goal: string (what they want)
      - conflict: string (what stands in their way)
      - arc: string (how they might change)
      
      Example:
      [
        { "name": "Alice", "role": "Protagonist", "age": "20", ... }
      ]
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const text = response.text || "[]";
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      const arrayStart = cleanJson.indexOf('[');
      const arrayEnd = cleanJson.lastIndexOf(']');
      const finalJson = arrayStart !== -1 && arrayEnd !== -1 ? cleanJson.substring(arrayStart, arrayEnd + 1) : "[]";
      
      const raw = JSON.parse(finalJson);
      return raw.map((c: any) => ({
        id: crypto.randomUUID(),
        name: c.name || "Unknown",
        role: c.role || "Supporting",
        age: c.age || "Unknown",
        description: c.description || "",
        goal: c.goal || "",
        conflict: c.conflict || "",
        arc: c.arc || "",
        visualDesign: {
           clothing: "Default",
           pose: "Neutral",
           expression: "Calm"
        }
      }));
    } catch (e) {
      console.error("Character Extraction Error:", e);
      return [];
    }
  }
};
