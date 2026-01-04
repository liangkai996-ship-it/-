
export type AppLanguage = 'zh-CN' | 'zh-TW' | 'en';
export type ThemeMode = 'light' | 'eye-care';
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

export enum ModuleType {
  HUB = 'HUB',                 
  PROJECT_ANALYSIS = 'ANALYSIS', 
  ORIGINAL_STORY = 'ORIGINAL',   
  NOVEL_ADAPTATION = 'ADAPT_NOVEL', 
  DASHBOARD = 'DASHBOARD',
  CHARACTERS = 'CHARACTERS',
  MARKET_ANALYSIS = 'MARKET_ANALYSIS',
  STORYBOARD_PRODUCTION = 'STORYBOARD_PRODUCTION',
}

export interface AppNotification {
  id: string;
  title: string;
  message?: string;
  type: 'info' | 'success' | 'error' | 'loading';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface AIMessage {
  role: 'user' | 'model';
  text: string;
  actions?: ProjectAction[];
  actionStatuses?: Record<number, 'applied' | 'pending'>;
}

export interface ProjectAction {
  type: string;
  description: string;
  data: any;
}

export interface ProjectSnapshot {
  id: string;
  timestamp: number;
  note: string;
  data: string; 
}

export interface StoryboardRow {
  id: string;
  shotIndex: string;
  sceneName: string;
  character: string;
  props: string; 
  visualContent: string;
  shotType: string;
  movement: string;
  sound: string;
  dialogue: string;
  duration: string;
  aiPrompt: string; 
}

export interface PlotEvent {
  id: string;
  title: string;
  description: string;
  tension: number;
  actId?: string;
  plotline?: string;
  emotions?: string; // Character emotions for this specific event
}

export interface PlotlineDefinition {
  id: string;
  label: string;
  color: string; // Tailwind class string or hex
  isRemovable?: boolean;
}

export interface CharacterRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  bidirectional?: boolean;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  importance: number; 
  description?: string;
  age?: string;
  origins?: { family: string; genes: string; background: string; };
  stages?: { setup: string; struggle: string; resolution: string; };
  mapPosition: { x: number; y: number };
  visualDesign?: { clothing: string; pose: string };
}

export enum ScriptFormat {
  MOVIE = 'MOVIE',
  TV_SERIES = 'TV_SERIES',
  MID_FORM_SERIES = 'MID_FORM_SERIES',
  LIVE_ACTION_SHORT = 'LIVE_ACTION_SHORT', // 真人短剧 (2-3min)
  COMIC_DRAMA = 'COMIC_DRAMA',             // 漫剧 (1.5-3min)
  SHORT_VIDEO = 'SHORT_VIDEO',             // 短视频 (1min)
}

export enum ProductionStyle {
  COMIC_DRAMA = 'COMIC_DRAMA',
  MOTION_COMIC = 'MOTION_COMIC',
  LIVE_ACTION = 'LIVE_ACTION',
}

export interface NovelAudit {
  tropeInventory: { name: string; weight: number; description: string }[];
  emotionalHeatmap: number[];
}

export interface AdaptationBlueprint {
  pacingStrategy: string;
  visualDirectives: { from: string; to: string }[];
}

export enum ScriptBlockType {
  SCENE_HEADING = 'SCENE_HEADING',
  ACTION = 'ACTION',
  CHARACTER = 'CHARACTER',
  PARENTHETICAL = 'PARENTHETICAL',
  DIALOGUE = 'DIALOGUE',
  TRANSITION = 'TRANSITION',
}

export enum ShotType {
  EXTREME_LONG_SHOT = 'ELS',
  LONG_SHOT = 'LS',
  FULL_SHOT = 'FS',
  MEDIUM_SHOT = 'MS',
  CLOSE_UP = 'CU',
  EXTREME_CLOSE_UP = 'ECU',
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

export interface StoryboardData {
  shotType: ShotType;
  cameraAngle: CameraAngle;
  cameraMovement: CameraMovement;
  aspectRatio: AspectRatio;
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

export interface OutlineScene {
  id: string;
  title: string;
  summary: string;
  visualKeywords?: string; 
  hook?: string;          
}

export interface DoctorAnalysis {
  emotions: number[];
  plotDensity: number[];
  diagnosis: string;
  suggestions: { advice: string; revision: string }[];
}

export interface OutlineSection {
  id: string;
  title: string;
  content: string;
  scenes: OutlineScene[];
  tips?: string;
  doctorAnalysis?: DoctorAnalysis;
  visualKeywords?: string;
  emotionalArc?: string; // New field for character emotion analysis
}

export interface DramaStage {
  id: string;
  range: string;
  label: string;
  strategy: string;
}

export enum OriginalSubModule {
  LOGLINE = 'LOGLINE',
  CHARACTERS = 'CHARACTERS',
  PLOT = 'PLOT',
  SCRIPT = 'SCRIPT',
  OUTLINE = 'OUTLINE', 
}

export interface NovelChapter {
  id: string;
  index: number;
  rawContent: string;
  summary: string; 
  keyElements?: string[];
}

export interface ProjectMetadata {
  sourceType: 'original' | 'adaptation' | 'storyboard' | 'market_analysis';
  targetAudience: string;
  projectHighlights: string;
  marketBenchmark: string;
}

export interface NovelUploadChunk {
  id: string;
  fileName: string;
  content: string;
  wordCount: number;
  uploadTime: number;
  aiSummary?: string; 
}

export interface AnalysisCharacter {
  id: string;
  name: string;
  tagline: string; 
  archetype: string; 
  description: string;
  traits: string[]; 
  relationship: string; 
}

export interface NovelDeepAnalysis {
  worldView: string; 
  mainPlot: string;  
  characterProfiles: string; 
  characterCards?: AnalysisCharacter[]; 
  commercialVerdict?: string; 
}

export interface AdaptationBeat {
  name: string; 
  description: string;
  type: 'hook' | 'reversal' | 'climax' | 'normal';
}

export interface AdaptationEpisode {
  id: string;
  episodeNumber: number;
  title: string;
  summary: string;
  characters: string[];
  events: string[];
  emotions: string[];
  beats: AdaptationBeat[];
}

export interface ProjectData {
  id: string;
  title: string;
  logline: string;
  genre: string;
  updatedAt: number;
  scriptFormat?: ScriptFormat;
  
  metadata: ProjectMetadata;

  novelSource?: 'file' | 'library';
  novelFullText: string; 
  novelUploadChunks?: NovelUploadChunk[]; 
  novelDeepAnalysis?: NovelDeepAnalysis; 
  novelAdaptationPlan?: AdaptationEpisode[]; 
  
  novelChapters: NovelChapter[]; 
  novelAudit?: NovelAudit;
  adaptationBlueprint?: AdaptationBlueprint;
  novelAnalysis?: {
    mainPlotSummary: string;
    stages: DramaStage[];
  };
  
  characters: Character[];
  relationships: CharacterRelationship[];
  script: ScriptBlock[];
  outline: OutlineSection[];
  plotEvents: PlotEvent[];
  definedPlotlines?: PlotlineDefinition[]; // New: Customizable plotlines
  totalOutline: string;
  storyboardRows: StoryboardRow[]; 
  snapshots?: ProjectSnapshot[];
  productionStyle?: ProductionStyle;
}
