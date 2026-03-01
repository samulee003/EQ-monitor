import React from 'react';
import { useLanguage } from '../../services/LanguageContext';
import { Quadrant } from '../../data/emotionData';

interface CenteringStepProps {
    quadrant: Quadrant;
}

export const CenteringStep: React.FC<CenteringStepProps> = ({ quadrant }) => {
    const { t } = useLanguage();

    return (
        <div className="centering-state">
            <div 
                className="centering-circle" 
                style={{ backgroundColor: `var(--color-${quadrant})` }}
            ></div>
            <h2>{t('沉靜，並感受...')}</h2>
            <p>
                {t('閉上雙眼，深呼吸一次。')}<br />
                {t('捕捉身體當下的細微信號。')}
            </p>
        </div>
    );
};

export default CenteringStep;
