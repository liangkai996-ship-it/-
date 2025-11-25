
export enum ModuleType {
  DASHBOARD = 'DASHBOARD',
  CHARACTERS = 'CHARACTERS',
  NOVEL = 'NOVEL', // New module
  OUTLINE = 'OUTLINE',
  PLOT = 'PLOT',
  SCRIPT = 'SCRIPT',
  STORYBOARD = 'STORYBOARD',
}

export type AppLanguage = 'zh-CN' | 'zh-TW' | 'en' | 'ko' | 'ja';

export enum ScriptFormat {
  MOVIE = 'MOVIE', // 90min+
  TV_SERIES = 'TV_SERIES', // 45min
  MID_FORM_SERIES = 'MID_FORM_SERIES', // 15-20min (中剧)
  SHORT_VIDEO = 'SHORT_VIDEO', // 1-3min (短剧/抖音)
  DYNAMIC_COMIC = 'DYNAMIC_COMIC', // 动态漫
  ANIMATION = 'ANIMATION', // 动漫
}

export interface CharacterVisuals {
  clothing: string;
  pose: string;
  expression: string;
  style?: string; // Added style field
  image?: string; // Base64 image string
}

export interface Character {
  id: string;
  name: string;
  role: string; // Protagonist, Antagonist, Supporting
  age: string;
  description: string;
  goal: string;
  conflict: string;
  arc: string;
  mapPosition?: { x: number; y: number };
  visualDesign?: CharacterVisuals;
}

export interface CharacterRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
}

export interface OutlineScene {
  id: string;
  title: string;
  summary: string;
}

export interface OutlineSection {
  id: string;
  title: string; // e.g., Act 1, Inciting Incident, Episode 1
  content: string;
  tips: string;
  scenes: OutlineScene[];
}

export interface PlotEvent {
  id: string;
  actId?: string; // Links to OutlineSection.id
  title: string;
  description: string;
  tensionLevel: number; // 1-10
}

export enum ScriptBlockType {
  SCENE_HEADING = 'SCENE_HEADING',
  ACTION = 'ACTION',
  CHARACTER = 'CHARACTER',
  DIALOGUE = 'DIALOGUE',
  PARENTHETICAL = 'PARENTHETICAL',
  TRANSITION = 'TRANSITION',
}

export enum ShotType {
  EXTREME_LONG_SHOT = 'ELS', // 大远景
  LONG_SHOT = 'LS', // 远景
  FULL_SHOT = 'FS', // 全景
  MEDIUM_SHOT = 'MS', // 中景
  CLOSE_UP = 'CU', // 特写
  EXTREME_CLOSE_UP = 'ECU', // 大特写
}

export enum CameraAngle {
  EYE_LEVEL = 'EYE', // 平视
  LOW_ANGLE = 'LOW', // 仰视
  HIGH_ANGLE = 'HIGH', // 俯视
  DUTCH_ANGLE = 'DUTCH', // 倾斜
  OVER_SHOULDER = 'OTS', // 过肩
  BIRD_EYE = 'BIRD', // 鸟瞰
}

export enum CameraMovement {
  STATIC = 'STATIC', // 固定
  PAN = 'PAN', // 摇摄
  TILT = 'TILT', // 俯仰
  DOLLY = 'DOLLY', // 推拉
  TRACKING = 'TRACKING', // 跟随
  CRANE = 'CRANE', // 升降
  HANDHELD = 'HANDHELD', // 手持
  ZOOM = 'ZOOM', // 变焦
}

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';

export interface StoryboardData {
  shotNumber?: number;
  shotType: ShotType;
  cameraAngle: CameraAngle;
  cameraMovement?: CameraMovement;
  focalLength?: string; // e.g., "35mm", "85mm", "Wide Angle"
  
  aspectRatio?: AspectRatio; // String for API (e.g., "16:9")
  customFrameRatio?: number; // Numeric for UI Slider (e.g., 1.77)
  
  visualStyle?: string; // Style override for specific shots

  visualDescription: string; // Detailed visual description for the artist/camera
  imagePrompt?: string; // AI Image Generation Prompt
  generatedImage?: string; // Base64 image string
  
  // Sound & Dialogue Hints
  soundDesign?: string; // Music, SFX
  dialogueSnippet?: string; // Key dialogue line for this shot

  // Long Take Support
  isLongTake?: boolean;
  startFrameDescription?: string;
  endFrameDescription?: string;
}

export interface ScriptBlock {
  id: string;
  type: ScriptBlockType;
  content: string;
  storyboard?: StoryboardData;
}

export interface MarketAnalysis {
  targetAudience: string; // 受众分析
  marketPositioning: string; // 市场定位/对标
  commercialsellingPoints: string; // 商业卖点
}

export interface NovelAnalysis {
  summary: string; // Core summary
  characters: { name: string; role: string; trait: string }[]; // Extracted characters
  storylines: string[]; // Key plot points/storylines
  themes: string[]; // Core themes
}

export interface NovelChapter {
  id: string;
  title: string;
  content: string;
  convertedBlocks?: ScriptBlock[]; // Stores the temp converted script
  analysis?: NovelAnalysis; // New analysis data
}

export interface ProjectData {
  title: string;
  logline: string;
  genre: string;
  scriptFormat?: ScriptFormat; // New field for format selection
  marketAnalysis: MarketAnalysis;
  novelChapters: NovelChapter[];
  characters: Character[];
  relationships: CharacterRelationship[];
  
  totalOutline: string; // New field for the macro story summary
  outline: OutlineSection[]; // Breakdown into episodes/acts
  
  plotEvents: PlotEvent[];
  script: ScriptBlock[];
}

// AI Synchronization Types
export type ProjectActionType = 
  | 'ADD_CHARACTER' 
  | 'ADD_CHARACTERS_BATCH' // New: Batch add characters
  | 'UPDATE_RELATIONSHIPS' // New: Update relationship map
  | 'UPDATE_OUTLINE_SECTION' 
  | 'ADD_PLOT_EVENT' 
  | 'UPDATE_LOGLINE'
  | 'UPDATE_TITLE';

export interface ProjectAction {
  type: ProjectActionType;
  data: any; // Dynamic data based on type
  description: string; // Description of the action for the UI
}

export interface AIMessage {
  role: 'user' | 'model';
  text: string;
  actions?: ProjectAction[]; // Changed from optional single action to optional array of actions
  actionStatuses?: { [key: number]: 'pending' | 'applied' | 'ignored' }; // Track status by index
}
