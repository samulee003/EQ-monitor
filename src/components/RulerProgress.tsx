import React from 'react';
import { Quadrant } from '../data/emotionData';
import { RulerStep } from '../types/RulerTypes';

interface RulerProgressProps {
    currentStep: RulerStep;
    isFullFlow: boolean;
    selectedQuadrant: Quadrant | null;
}

// Map internal steps to display steps
const getDisplaySteps = (isFullFlow: boolean) => {
    if (isFullFlow) {
        return [
            { key: 'recognizing', label: '辨別', letter: 'R', color: 'red' },
            { key: 'labeling', label: '標記', letter: 'L', color: 'yellow' },
            { key: 'understanding', label: '理解', letter: 'U', color: 'blue' },
            { key: 'expressing', label: '表達', letter: 'E', color: 'yellow' },
            { key: 'regulating', label: '調節', letter: 'R', color: 'green' },
        ];
    }
    // Quick mode: only R → L
    return [
        { key: 'recognizing', label: '辨別', letter: 'R', color: 'red' },
        { key: 'labeling', label: '標記', letter: 'L', color: 'yellow' },
    ];
};

// Map current internal step to display index
const getStepIndex = (step: RulerStep, isFullFlow: boolean): number => {
    const displaySteps = getDisplaySteps(isFullFlow);

    // Map intermediate steps to their parent display step
    const stepMapping: Record<string, string> = {
        'recognizing': 'recognizing',
        'centering': 'recognizing',
        'bodyScan': 'recognizing',
        'labeling': 'labeling',
        'understanding': 'understanding',
        'expressing': 'expressing',
        'regulating': 'regulating',
        'neuroCheck': 'regulating',
        'summary': 'regulating',
    };

    const mappedStep = stepMapping[step] || step;
    const index = displaySteps.findIndex(s => s.key === mappedStep);
    return Math.max(0, index);
};

const RulerProgress: React.FC<RulerProgressProps> = ({ currentStep, isFullFlow, selectedQuadrant }) => {
    const displaySteps = getDisplaySteps(isFullFlow);
    const currentIndex = getStepIndex(currentStep, isFullFlow);
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
        <div className="ruler-progress">
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

            <style>{`
                .ruler-progress {
                    margin-bottom: var(--s-10);
                    position: relative;
                    padding: 0 var(--s-2);
                }

                .progress-track {
                    position: absolute;
                    top: 18px;
                    left: 24px;
                    right: 24px;
                    height: 2px;
                    z-index: 1;
                }

                .progress-track-bg {
                    position: absolute;
                    inset: 0;
                    background: var(--glass-border);
                    border-radius: 2px;
                }

                .progress-track-fill {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    border-radius: 2px;
                    transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .progress-steps {
                    display: flex;
                    justify-content: space-between;
                    position: relative;
                    z-index: 2;
                }

                .progress-step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: var(--s-2);
                    opacity: 0.35;
                    transition: var(--transition-luxe);
                }

                .progress-step.active {
                    opacity: 1;
                }

                .step-circle {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: var(--bg-secondary);
                    border: 2px solid var(--glass-border);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    transition: var(--transition-luxe);
                    backdrop-filter: var(--glass-blur);
                }

                .progress-step.current .step-circle {
                    background: var(--bg-color);
                    transform: scale(1.15);
                }

                .step-letter {
                    font-size: 0.85rem;
                    font-weight: 800;
                    color: var(--text-primary);
                    z-index: 2;
                }

                .step-pulse {
                    position: absolute;
                    inset: -4px;
                    border-radius: 50%;
                    opacity: 0.3;
                    animation: stepPulse 2s ease-in-out infinite;
                    z-index: 1;
                }

                @keyframes stepPulse {
                    0%, 100% { 
                        transform: scale(1); 
                        opacity: 0.3; 
                    }
                    50% { 
                        transform: scale(1.3); 
                        opacity: 0; 
                    }
                }

                .step-label {
                    font-size: 0.7rem;
                    color: var(--text-secondary);
                    font-weight: 600;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                }

                .progress-step.current .step-label {
                    color: var(--text-primary);
                }

                /* Responsive adjustments */
                @media (max-width: 360px) {
                    .step-circle {
                        width: 30px;
                        height: 30px;
                    }
                    .step-letter {
                        font-size: 0.75rem;
                    }
                    .step-label {
                        font-size: 0.6rem;
                    }
                    .progress-track {
                        top: 15px;
                    }
                }
            `}</style>
        </div>
    );
};

export default RulerProgress;
