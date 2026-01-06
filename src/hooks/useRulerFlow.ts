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
    const [selectedQuadrants, setSelectedQuadrants] = useState<Quadrant[]>([]);
    const [selectedEmotions, setSelectedEmotions] = useState<Emotion[]>([]);
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

    // Effect - Aura Color (Supports multiple colors via gradient or just the first one)
    useEffect(() => {
        if (selectedQuadrants.length > 0) {
            const colors: Record<Quadrant, string> = { red: '#C58B8A', yellow: '#D5C1A5', blue: '#97A6B4', green: '#AAB09B' };
            // For now use the first selected or a neutral if mixed
            const color = selectedQuadrants.length === 1
                ? colors[selectedQuadrants[0]]
                : '#D1CECA'; // Neutral Morandi
            document.documentElement.style.setProperty('--aura-color', `${color}44`);
        } else {
            document.documentElement.style.setProperty('--aura-color', 'transparent');
        }
    }, [selectedQuadrants]);

    // Effect - Save Draft
    useEffect(() => {
        if (step === 'summary') {
            storageService.clearDraft();
        } else {
            const draft: RulerDraft = {
                step,
                selectedQuadrants,
                selectedEmotions,
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
    }, [step, selectedQuadrants, selectedEmotions, emotionIntensity, understandingData, expressingData, regulatingData, isFullFlow, postRegulationMood]);

    // Actions
    const resumeDraft = () => {
        if (pendingDraft) {
            setStep(pendingDraft.step);
            setSelectedQuadrants(pendingDraft.selectedQuadrants || []);
            setSelectedEmotions(pendingDraft.selectedEmotions || []);
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

    const toggleQuadrant = (q: Quadrant) => {
        setSelectedQuadrants(prev =>
            prev.includes(q) ? prev.filter(item => item !== q) : [...prev, q]
        );
    };

    const handleMoodComplete = (quadrants: Quadrant[], intensity: number) => {
        setSelectedQuadrants(quadrants);
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

    const saveData = (emotions: Emotion[], u: UnderstandingData | null, e: ExpressingData | null, r: RegulatingData | null, p: string = '', intensity: number = 5) => {
        const fullData: RulerLogEntry = {
            emotions: emotions.length > 0 ? emotions : selectedEmotions,
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

    const toggleEmotion = (e: Emotion) => {
        setSelectedEmotions(prev => {
            const exists = prev.find(item => item.id === e.id);
            if (exists) return prev.filter(item => item.id !== e.id);
            return [...prev, e];
        });
    };

    const handleEmotionSelect = (emotions: Emotion[]) => {
        setSelectedEmotions(emotions);
        if (isFullFlow) {
            setStep('understanding');
        } else {
            setStep('summary');
            saveData(emotions, null, null, null, '', emotionIntensity);
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
        saveData(selectedEmotions, null, null, regulatingData, postRegulationMood);
        setStep('summary');
    };

    const resetFlow = () => {
        storageService.clearDraft();
        setStep('recognizing');
        setSelectedQuadrants([]);
        setSelectedEmotions([]);
        setUnderstandingData(null);
        setExpressingData(null);
        setRegulatingData(null);
        setPostRegulationMood('');
        setIsFullFlow(false);
    };

    return {
        // State
        step,
        selectedQuadrants,
        selectedEmotions,
        showResumePrompt,
        isFullFlow,
        postRegulationMood,
        currentStepIndex,

        // Actions
        setStep,
        setIsFullFlow,
        setPostRegulationMood,
        setShowResumePrompt,
        resumeDraft,
        resetFlow,
        toggleQuadrant,
        toggleEmotion,
        handleMoodComplete,
        handleBodyScanComplete,
        handleEmotionSelect,
        handleUnderstandingComplete,
        handleExpressingComplete,
        handleRegulatingComplete,
        handleNeuroCheckComplete
    };
};
