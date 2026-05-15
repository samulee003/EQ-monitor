import React, { useMemo } from 'react';
import { type Quadrant } from '../data/emotionData';
import { type RulerStep } from '../types/RulerTypes';
import { useLanguage } from '../services/LanguageContext';
import './RulerProgress.css';

interface RulerProgressProps {
    currentStep: RulerStep;
    isFullFlow: boolean;
    selectedQuadrant: Quadrant | null | undefined;
}

// Map internal flow states to 知心四式 display moves.
const getDisplaySteps = (isFullFlow: boolean, t: (s: string) => string) => {
    if (isFullFlow) {
        return [
            { key: 'recognizing', label: t('心照'), letter: '1', color: 'red' },
            { key: 'labeling', label: t('喚名'), letter: '2', color: 'yellow' },
            { key: 'understanding', label: t('安神'), letter: '3', color: 'blue' },
            { key: 'regulating', label: t('動念'), letter: '4', color: 'green' },
        ];
    }
    // Quick mode
    return [
        { key: 'recognizing', label: t('心照'), letter: '1', color: 'red' },
        { key: 'labeling', label: t('喚名'), letter: '2', color: 'yellow' },
    ];
};

// Map current internal step to display index
const getStepIndex = (step: RulerStep, isFullFlow: boolean, t: (s: string) => string): number => {
    const displaySteps = getDisplaySteps(isFullFlow, t);

    // Map intermediate steps to their parent display step
    const stepMapping: Record<string, string> = {
        'recognizing': 'recognizing',
        'centering': 'recognizing',
        'bodyScan': 'recognizing',
        'labeling': 'labeling',
        'understanding': 'understanding',
        'expressing': 'understanding',
        'regulating': 'regulating',
        'neuroCheck': 'regulating',
        'summary': 'regulating',
    };

    const mappedStep = stepMapping[step] || step;
    const index = displaySteps.findIndex(s => s.key === mappedStep);
    return Math.max(0, index);
};

const RulerProgress: React.FC<RulerProgressProps> = ({ currentStep, isFullFlow, selectedQuadrant }) => {
    const { t } = useLanguage();
    const displaySteps = useMemo(() => getDisplaySteps(isFullFlow, t), [isFullFlow, t]);
    const currentIndex = useMemo(() => getStepIndex(currentStep, isFullFlow, t), [currentStep, isFullFlow, t]);
    const progressPercent = displaySteps.length > 1
        ? (currentIndex / (displaySteps.length - 1)) * 100
        : 100;

    // Get the accent color based on selected quadrant or current step
    const getAccentColor = () => {
        if (selectedQuadrant) {
            return `var(--color-${selectedQuadrant})`;
        }
        return 'var(--color-yellow)';
    };

    return (
        <div className="ruler-progress" data-testid="ruler-progress" data-current-step={currentStep}>
            <div className="progress-track">
                <div className="progress-track-bg" />
                <div
                    className="progress-track-fill"
                    style={{
                        width: `${progressPercent}%`,
                        background: `linear-gradient(90deg, ${getAccentColor()}, ${getAccentColor()}88)`
                    }}
                />
            </div>

            <div className="progress-steps">
                {displaySteps.map((step, index) => {
                    const isActive = index <= currentIndex;
                    const isCurrent = index === currentIndex;

                    return (
                        <div
                            key={step.key}
                            className={`progress-step ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}
                        >
                            <div
                                className="step-circle"
                                style={isCurrent ? {
                                    borderColor: getAccentColor(),
                                    boxShadow: `0 0 20px ${getAccentColor()}66`
                                } : {}}
                            >
                                <span className="step-letter">{step.letter}</span>
                                {isCurrent && <div className="step-pulse" style={{ background: getAccentColor() }} />}
                            </div>
                            <span className="step-label">{step.label}</span>
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

export default RulerProgress;
