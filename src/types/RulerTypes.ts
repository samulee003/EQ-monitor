import { type Emotion, type Quadrant } from '../data/emotionData';

export interface BodyScanData {
    location: string;
    sensation: string;
}

// Heatmap data point for dashboard
export interface HeatmapDataPoint {
    date: string;
    hasData: boolean;
    quadrant?: Quadrant;
    intensity?: number;
}

// Intensity data for bar chart
export interface IntensityDataPoint {
    label: string;
    value: number;
}

// AI Analysis input data
export interface AIAnalysisData {
    emotion?: Emotion | { id?: string; name: string; quadrant: Quadrant; energy?: number; pleasantness?: number };
    intensity: number;
    understanding?: UnderstandingData | {
        trigger?: string;
        what?: string;
        who?: string;
    } | null;
    note?: string;
}

// Chat history entry
export interface ChatHistoryEntry {
    timestamp: string;
    emotions?: Emotion[];
    intensity?: number;
}

export interface InteractionCycle {
    myReaction: string;
    childReaction: string;
    reflection: string;
}

export interface UnderstandingData {
    trigger: string;
    message: string; // Kept for compatibility
    what: string;
    who: string;
    where: string;
    need: string | null;
    interactionCycle?: InteractionCycle;
}

export interface ExpressingData {
    expression: string;
    prompt: string;
    mode: string;
}

export interface RegulatingData {
    selectedStrategies: string[];
}

export interface RulerLogEntry {
    id: string;
    emotions: Emotion[];
    intensity: number;
    bodyScan: BodyScanData | null;
    understanding: UnderstandingData | null;
    expressing: ExpressingData | null;
    regulating: RegulatingData | null;
    physicalContext?: {
        sleepHours: number;
        activityLevel: number; // 1-5
    };
    postMood: string;
    timestamp: string;
    isFullFlow?: boolean;
}


export type RulerStep = 'recognizing' | 'centering' | 'bodyScan' | 'labeling' | 'understanding' | 'expressing' | 'regulating' | 'neuroCheck' | 'summary';

export interface RulerDraft {
    step: RulerStep;
    selectedQuadrants: Quadrant[];
    selectedEmotions: Emotion[];
    emotionIntensity: number;
    bodyScanData: BodyScanData | null;
    understandingData: UnderstandingData | null;
    expressingData: ExpressingData | null;
    regulatingData: RegulatingData | null;
    isFullFlow: boolean;
    postRegulationMood: string;
}
