import { useState, useEffect } from 'react';
import { storageService } from '../services/StorageService';
import { RulerStep, RulerDraft, RulerLogEntry, BodyScanData, UnderstandingData, ExpressingData, RegulatingData } from '../types/RulerTypes';
import { Quadrant, Emotion } from '../data/emotionData';

export const steps: { key: RulerStep; label: string; letter: string }[] = [
    { key: 'recognizing', label: '辨別', letter: 'R' },
    { key: 'labeling', label: '標記', letter: 'L' },
    { key: 'understanding', label: '理解', letter: 'U' },
    { key: 'expressing', label: '表達', letter: 'E' },
    { key: 'regulating', label: '調節', letter: 'R' },
];

export const useRulerFlow = () => {
    const [step, setStep] = useState<RulerStep>('recognizing');
    const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant | null>(null);
    const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
    const [emotionIntensity, setEmotionIntensity] = useState(5);
    const [bodyScanData, setBodyScanData] = useState<BodyScanData | null>(null);
    const [understandingData, setUnderstandingData] = useState<UnderstandingData | null>(null);
    const [expressingData, setExpressingData] = useState<ExpressingData | null>(null);
    const [regulatingData, setRegulatingData] = useState<RegulatingData | null>(null);
    const [isFullFlow, setIsFullFlow] = useState(false);
    const [postRegulationMood, setPostRegulationMood] = useState<string>('');
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [pendingDraft, setPendingDraft] = useState<RulerDraft | null>(null);

    const currentStepIndex = steps.findIndex(s => s.key === step);

    // Initialize - Load Draft
    useEffect(() => {
        const draft = storageService.getDraft();
        if (draft && draft.step && draft.step !== 'recognizing') {
            setPendingDraft(draft);
            setShowResumePrompt(true);
        }
    }, []);

    // Effect - Aura Color
    useEffect(() => {
        if (selectedQuadrant) {
            const colors: Record<Quadrant, string> = { red: '#C58B8A', yellow: '#D5C1A5', blue: '#97A6B4', green: '#AAB09B' };
            document.documentElement.style.setProperty('--aura-color', `${colors[selectedQuadrant]}44`);
        } else {
            document.documentElement.style.setProperty('--aura-color', 'transparent');
        }
    }, [selectedQuadrant]);

    // Effect - Save Draft
    useEffect(() => {
        if (step === 'summary') {
            storageService.clearDraft();
        } else {
            const draft: RulerDraft = {
                step,
                selectedQuadrant,
                selectedEmotion,
                emotionIntensity,
                bodyScanData,
                understandingData,
                expressingData,
                regulatingData,
                isFullFlow,
                postRegulationMood
            };
            storageService.saveDraft(draft);
        }
    }, [step, selectedQuadrant, selectedEmotion, emotionIntensity, understandingData, expressingData, regulatingData, isFullFlow, postRegulationMood]);

    // Actions
    const resumeDraft = () => {
        if (pendingDraft) {
            setStep(pendingDraft.step);
            setSelectedQuadrant(pendingDraft.selectedQuadrant);
            setSelectedEmotion(pendingDraft.selectedEmotion);
            setEmotionIntensity(pendingDraft.emotionIntensity);
            setBodyScanData(pendingDraft.bodyScanData);
            setUnderstandingData(pendingDraft.understandingData);
            setExpressingData(pendingDraft.expressingData);
            setRegulatingData(pendingDraft.regulatingData);
            setIsFullFlow(pendingDraft.isFullFlow);
            setPostRegulationMood(pendingDraft.postRegulationMood);
        }
        setShowResumePrompt(false);
    };

    const handleMoodComplete = (quadrant: Quadrant, intensity: number) => {
        setSelectedQuadrant(quadrant);
        setEmotionIntensity(intensity);
        setStep('centering');
        setTimeout(() => {
            setStep('bodyScan');
        }, 1500);
    };

    const handleBodyScanComplete = (data: BodyScanData) => {
        setBodyScanData(data);
        setStep('labeling');
    };

    const saveData = (emotion: Emotion | null, u: UnderstandingData | null, e: ExpressingData | null, r: RegulatingData | null, p: string = '', intensity: number = 5) => {
        const fullData: RulerLogEntry = {
            emotion: emotion || selectedEmotion!,
            intensity: intensity || emotionIntensity,
            bodyScan: bodyScanData,
            understanding: u || understandingData,
            expressing: e || expressingData,
            regulating: r || regulatingData,
            postMood: p || postRegulationMood,
            timestamp: new Date().toISOString(),
        };

        storageService.saveLog(fullData);
        storageService.clearDraft();
    };

    const handleEmotionSelect = (e: Emotion) => {
        setSelectedEmotion(e);
        if (isFullFlow) {
            setStep('understanding');
        } else {
            setStep('summary');
            saveData(e, null, null, null, '', emotionIntensity);
        }
    };

    const handleUnderstandingComplete = (data: UnderstandingData) => {
        setUnderstandingData(data);
        setStep('expressing');
    };

    const handleExpressingComplete = (data: ExpressingData) => {
        setExpressingData(data);
        setStep('regulating');
    };

    const handleRegulatingComplete = (data: RegulatingData) => {
        setRegulatingData(data);
        setStep('neuroCheck');
    };

    const handleNeuroCheckComplete = () => {
        saveData(null, null, null, regulatingData, postRegulationMood);
        setStep('summary');
    };

    const resetFlow = () => {
        storageService.clearDraft();
        setStep('recognizing');
        setSelectedQuadrant(null);
        setSelectedEmotion(null);
        setUnderstandingData(null);
        setExpressingData(null);
        setRegulatingData(null);
        setPostRegulationMood('');
        setIsFullFlow(false);
    };

    return {
        // State
        step,
        selectedQuadrant,
        selectedEmotion,
        showResumePrompt,
        isFullFlow,
        postRegulationMood,
        currentStepIndex,

        // Actions
        setStep,
        setIsFullFlow,
        setPostRegulationMood, // Alias if needed or used directly
        setShowResumePrompt,
        resumeDraft,
        resetFlow,
        handleMoodComplete,
        handleBodyScanComplete,
        handleEmotionSelect,
        handleUnderstandingComplete,
        handleExpressingComplete,
        handleRegulatingComplete,
        handleNeuroCheckComplete
    };
};
