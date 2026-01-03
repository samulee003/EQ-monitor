import { Emotion, Quadrant } from '../data/emotionData';

export interface BodyScanData {
    location: string;
    sensation: string;
}

export interface UnderstandingData {
    trigger: string;
    message: string; // Kept for compatibility
    what: string;
    who: string;
    where: string;
    need: string | null;
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
    emotion: Emotion;
    intensity: number;
    bodyScan: BodyScanData | null;
    understanding: UnderstandingData | null;
    expressing: ExpressingData | null;
    regulating: RegulatingData | null;
    postMood: string;
    timestamp: string;
    isFullFlow?: boolean;
}

export type RulerStep = 'recognizing' | 'centering' | 'bodyScan' | 'labeling' | 'understanding' | 'expressing' | 'regulating' | 'neuroCheck' | 'summary';

export interface RulerDraft {
    step: RulerStep;
    selectedQuadrant: Quadrant | null;
    selectedEmotion: Emotion | null;
    emotionIntensity: number;
    bodyScanData: BodyScanData | null;
    understandingData: UnderstandingData | null;
    expressingData: ExpressingData | null;
    regulatingData: RegulatingData | null;
    isFullFlow: boolean;
    postRegulationMood: string;
}
