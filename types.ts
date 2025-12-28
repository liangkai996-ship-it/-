
export enum ModuleType {
  HUB = 'HUB',                 // 顶级入口（作品馆）
  PROJECT_ANALYSIS = 'ANALYSIS', // 项目分析
  ORIGINAL_STORY = 'ORIGINAL',   // 原创故事
  NOVEL_ADAPTATION = 'ADAPT',    // 小说改编
  
  DASHBOARD = 'DASHBOARD',
  NOVEL = 'NOVEL',
  CHARACTERS = 'CHARACTERS',
  OUTLINE = 'OUTLINE',
  PLOT = 'PLOT',
  SCRIPT = 'SCRIPT',
  DOCTOR = 'DOCTOR',
}

export enum ProductionStyle {
  COMIC_DRAMA = 'COMIC_DRAMA',
  MOTION_COMIC = 'MOTION_COMIC',
  LIVE_ACTION = 'LIVE_ACTION'
}

export enum OriginalSubModule {
  LOGLINE = 'LOGLINE',
  CHARACTERS = 'CHARACTERS',
  OUTLINE = 'OUTLINE',
  PLOT = 'PLOT',
  SCRIPT = 'SCRIPT'
}

export type ThemeMode = 'day' | 'night';
export type AppLanguage = 'zh-CN' | 'zh-TW' | 'en' | 'ko' | 'ja';

export enum ScriptFormat {
  MOVIE = 'MOVIE',
  TV_SERIES = 'TV_SERIES',
  MID_FORM_SERIES = 'MID_FORM_SERIES',
  SHORT_VIDEO = 'SHORT_VIDEO',
  DYNAMIC_COMIC = 'DYNAMIC_COMIC',
  ANIMATION = 'ANIMATION',
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
  EXTREME_LONG_SHOT = 'EXTREME_LONG_SHOT',
  LONG_SHOT = 'LONG_SHOT',
  FULL_SHOT = 'FULL_SHOT',
  MEDIUM_SHOT = 'MEDIUM_SHOT',
  CLOSE_UP = 'CLOSE_UP',
  EXTREME_CLOSE_UP = 'EXTREME_CLOSE_UP',
}

export enum CameraAngle {
  EYE_LEVEL = 'EYE_LEVEL',
  LOW_ANGLE = 'LOW_ANGLE',
  HIGH_ANGLE = 'HIGH_ANGLE',
  DUTCH_ANGLE = 'DUTCH_ANGLE',
  OVER_SHOULDER = 'OVER_SHOULDER',
  BIRD_EYE = 'BIRD_EYE',
}

export enum CameraMovement {
  STATIC = 'STATIC',
  PAN = 'PAN',
  TILT = 'TILT',
  DOLLY = 'DOLLY',
  TRACKING = 'TRACKING',
  CRANE = 'CRANE',
  HANDHELD = 'HANDHELD',
  ZOOM = 'ZOOM',
}

export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

export interface StoryboardData {
  shotType: ShotType;
  cameraAngle: CameraAngle;
  cameraMovement?: CameraMovement;
  aspectRatio?: AspectRatio;
  customFrameRatio?: number;
  focalLength?: string;
  visualDescription: string;
  imagePrompt: string;
  soundDesign?: string;
  generatedImage?: string;
  isLongTake?: boolean;
  startFrameDescription?: string;
  endFrameDescription?: string;
  visualStyle?: string;
}

export interface ScriptBlock {
  id: string;
  type: ScriptBlockType;
  content: string;
  storyboard?: StoryboardData;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  age: string;
  description: string;
  goal: string;
  conflict: string;
  arc: string;
  mapPosition: { x: number; y: number };
  visualDesign?: {
    clothing: string;
    pose: string;
    expression: string;
    style?: string;
    image?: string;
  };
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

export interface DoctorAnalysis {
  emotions: number[];
  infoDensity: number[];
  plotDensity: number[];
  diagnosis: string;
  suggestions: Array<{
    id: string;
    target: string;
    advice: string;
    revision: string;
  }>;
}

export interface OutlineSection {
  id: string;
  title: string;
  tips: string;
  content: string;
  scenes: OutlineScene[];
  doctorAnalysis?: DoctorAnalysis;
}

export interface PlotEvent {
  id: string;
  actId?: string;
  plotline: string;
  title: string;
  description: string;
  tensionLevel: number;
}

export interface NovelChapter {
  id: string;
  title: string;
  content: string;
  convertedBlocks: ScriptBlock[];
  analysis?: {
    summary: string;
    themes: string[];
    characters: Array<{ name: string; role: string; trait: string }>;
    storylines: string[];
    events: Array<{ title: string; description: string; tensionLevel: number }>;
  };
}

export interface ProjectData {
  id: string;
  title: string;
  logline: string;
  genre: string;
  coverImage?: string; // Base64 or URL
  updatedAt: number;
  productionStyle?: ProductionStyle;
  scriptFormat?: ScriptFormat;
  marketAnalysis: {
    targetAudience: string;
    marketPositioning: string;
    commercialsellingPoints: string;
  };
  novelChapters: NovelChapter[];
  characters: Character[];
  relationships: CharacterRelationship[];
  totalOutline: string;
  outline: OutlineSection[];
  plotEvents: PlotEvent[];
  script: ScriptBlock[];
}

export interface ProjectAction {
  type: 'ADD_CHARACTER' | 'ADD_CHARACTERS_BATCH' | 'UPDATE_RELATIONSHIPS' | 'UPDATE_OUTLINE_SECTION' | 'UPDATE_LOGLINE' | 'ADD_PLOT_EVENT';
  description: string;
  data: any;
}

export interface AIMessage {
  role: 'user' | 'model';
  text: string;
  actions?: ProjectAction[];
  actionStatuses?: { [key: number]: 'pending' | 'applied' | 'ignored' };
}
