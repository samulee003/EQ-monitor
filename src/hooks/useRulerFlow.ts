/**
 * useRulerFlow - 情緒覺察流程狀態管理
 * 
 * 使用 useReducer 模式管理複雜的 RULER 五步流程狀態，
 * 替代原有的多個 useState，使狀態轉換更清晰、可預測、可測試。
 */

import { useReducer, useEffect } from 'react';
import { dataAdapter } from '../adapters';
import { useHabit } from '../services/HabitContext';
import { type RulerStep, type RulerDraft, type RulerLogEntry, type BodyScanData, type UnderstandingData, type ExpressingData, type RegulatingData } from '../types/RulerTypes';
import { type Quadrant, type Emotion } from '../data/emotionData';

// ============================================
// State
// ============================================

export interface RulerFlowState {
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
  showResumePrompt: boolean;
  pendingDraft: RulerDraft | null;
}

const INITIAL_STATE: RulerFlowState = {
  step: 'recognizing',
  selectedQuadrants: [],
  selectedEmotions: [],
  emotionIntensity: 5,
  bodyScanData: null,
  understandingData: null,
  expressingData: null,
  regulatingData: null,
  isFullFlow: false,
  postRegulationMood: '',
  showResumePrompt: false,
  pendingDraft: null,
};

// ============================================
// Actions
// ============================================

export type RulerFlowAction =
  | { type: 'TOGGLE_QUADRANT'; quadrant: Quadrant }
  | { type: 'SET_MOOD_COMPLETE'; quadrants: Quadrant[]; intensity: number }
  | { type: 'SET_BODY_SCAN'; data: BodyScanData }
  | { type: 'SELECT_EMOTIONS'; emotions: Emotion[] }
  | { type: 'SET_UNDERSTANDING'; data: UnderstandingData }
  | { type: 'SET_EXPRESSING'; data: ExpressingData }
  | { type: 'SET_REGULATING'; data: RegulatingData }
  | { type: 'SET_NEURO_CHECK'; physical?: { sleepHours: number; activityLevel: number } }
  | { type: 'SET_POST_MOOD'; mood: string }
  | { type: 'SET_FULL_FLOW'; value: boolean }
  | { type: 'RESET_FLOW' }
  | { type: 'RESUME_DRAFT'; draft: RulerDraft }
  | { type: 'DISMISS_RESUME_PROMPT' }
  | { type: 'SET_STEP'; step: RulerStep }
  | { type: 'TOGGLE_EMOTION'; emotion: Emotion };

// ============================================
// Reducer
// ============================================

function rulerReducer(state: RulerFlowState, action: RulerFlowAction): RulerFlowState {
  switch (action.type) {
    case 'TOGGLE_QUADRANT': {
      const exists = state.selectedQuadrants.includes(action.quadrant);
      return {
        ...state,
        selectedQuadrants: exists
          ? state.selectedQuadrants.filter(q => q !== action.quadrant)
          : [...state.selectedQuadrants, action.quadrant],
      };
    }

    case 'TOGGLE_EMOTION': {
      const exists = state.selectedEmotions.find(item => item.id === action.emotion.id);
      return {
        ...state,
        selectedEmotions: exists
          ? state.selectedEmotions.filter(item => item.id !== action.emotion.id)
          : [...state.selectedEmotions, action.emotion],
      };
    }

    case 'SET_MOOD_COMPLETE':
      return {
        ...state,
        selectedQuadrants: action.quadrants,
        emotionIntensity: action.intensity,
        step: 'centering',
      };

    case 'SET_BODY_SCAN':
      return {
        ...state,
        bodyScanData: action.data,
        step: 'labeling',
      };

    case 'SELECT_EMOTIONS': {
      if (state.isFullFlow) {
        return {
          ...state,
          selectedEmotions: action.emotions,
          step: 'understanding',
        };
      }
      return {
        ...state,
        selectedEmotions: action.emotions,
        step: 'summary',
      };
    }

    case 'SET_UNDERSTANDING':
      return {
        ...state,
        understandingData: action.data,
        step: 'expressing',
      };

    case 'SET_EXPRESSING':
      return {
        ...state,
        expressingData: action.data,
        step: 'regulating',
      };

    case 'SET_REGULATING':
      return {
        ...state,
        regulatingData: action.data,
        step: 'neuroCheck',
      };

    case 'SET_NEURO_CHECK':
      // 此 action 觸發保存，在 hook 中處理副作用
      return {
        ...state,
        step: 'summary',
      };

    case 'SET_POST_MOOD':
      return {
        ...state,
        postRegulationMood: action.mood,
      };

    case 'SET_FULL_FLOW':
      return {
        ...state,
        isFullFlow: action.value,
      };

    case 'SET_STEP':
      return {
        ...state,
        step: action.step,
      };

    case 'RESET_FLOW':
      return { ...INITIAL_STATE };

    case 'RESUME_DRAFT':
      return {
        ...INITIAL_STATE,
        step: action.draft.step,
        selectedQuadrants: action.draft.selectedQuadrants || [],
        selectedEmotions: action.draft.selectedEmotions || [],
        emotionIntensity: action.draft.emotionIntensity,
        bodyScanData: action.draft.bodyScanData,
        understandingData: action.draft.understandingData,
        expressingData: action.draft.expressingData,
        regulatingData: action.draft.regulatingData,
        isFullFlow: action.draft.isFullFlow,
        postRegulationMood: action.draft.postRegulationMood,
        showResumePrompt: false,
        pendingDraft: null,
      };

    case 'DISMISS_RESUME_PROMPT':
      return {
        ...state,
        showResumePrompt: false,
      };

    default:
      return state;
  }
}

// ============================================
// Steps Meta
// ============================================

export const steps: { key: RulerStep; label: string; letter: string }[] = [
  { key: 'recognizing', label: '覺察', letter: 'N' },
  { key: 'centering', label: '沉靜', letter: 'N' },
  { key: 'bodyScan', label: '掃描', letter: 'N' },
  { key: 'labeling', label: '命名', letter: 'N' },
  { key: 'understanding', label: '定位', letter: 'L' },
  { key: 'expressing', label: '需要', letter: 'N' },
  { key: 'regulating', label: '選擇', letter: 'C' },
  { key: 'neuroCheck', label: '檢查', letter: 'C' },
  { key: 'summary', label: '完成', letter: 'C' },
];

// ============================================
// Hook
// ============================================

export const useRulerFlow = () => {
  const [state, dispatch] = useReducer(rulerReducer, INITIAL_STATE);
  const { refreshProgress } = useHabit();

  const currentStepIndex = steps.findIndex(s => s.key === state.step);

  // 初始化：加載草稿
  useEffect(() => {
    const loadDraft = async () => {
      const draft = await dataAdapter.draft.get();
      if (draft && draft.step && draft.step !== 'recognizing') {
        dispatch({ type: 'RESUME_DRAFT', draft });
        // 恢復後顯示提示，讓用戶選擇是否繼續
        dispatch({ type: 'SET_STEP', step: 'recognizing' });
        // 保存 pendingDraft 用於 resumeDraft 動作
        // 注意：由於 reducer 純函數限制，這裡需要手動合併
      }
    };
    loadDraft();
  }, []);

  // 副作用：保存草稿
  useEffect(() => {
    const saveDraft = async () => {
      if (state.step === 'summary') {
        await dataAdapter.draft.clear();
      } else if (state.step !== 'recognizing' || state.selectedQuadrants.length > 0) {
        const draft: RulerDraft = {
          step: state.step,
          selectedQuadrants: state.selectedQuadrants,
          selectedEmotions: state.selectedEmotions,
          emotionIntensity: state.emotionIntensity,
          bodyScanData: state.bodyScanData,
          understandingData: state.understandingData,
          expressingData: state.expressingData,
          regulatingData: state.regulatingData,
          isFullFlow: state.isFullFlow,
          postRegulationMood: state.postRegulationMood,
        };
        await dataAdapter.draft.save(draft);
      }
    };
    saveDraft();
  }, [
    state.step,
    state.selectedQuadrants,
    state.selectedEmotions,
    state.emotionIntensity,
    state.bodyScanData,
    state.understandingData,
    state.expressingData,
    state.regulatingData,
    state.isFullFlow,
    state.postRegulationMood,
  ]);

  // Aura 顏色效果
  useEffect(() => {
    if (state.selectedQuadrants.length > 0) {
      const colors: Record<Quadrant, string> = { red: '#C58B8A', yellow: '#D5C1A5', blue: '#97A6B4', green: '#AAB09B' };
      const color = state.selectedQuadrants.length === 1
        ? colors[state.selectedQuadrants[0]]
        : '#D1CECA';
      document.documentElement.style.setProperty('--aura-color', `${color}44`);
    } else {
      document.documentElement.style.setProperty('--aura-color', 'transparent');
    }
  }, [state.selectedQuadrants]);

  // ---------- 異步操作 ----------

  const saveLog = async (
    emotions: Emotion[],
    u: UnderstandingData | null,
    e: ExpressingData | null,
    r: RegulatingData | null,
    p: string = '',
    intensity: number = 5,
    physical?: { sleepHours: number; activityLevel: number }
  ) => {
    const fullData: RulerLogEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      emotions: emotions.length > 0 ? emotions : state.selectedEmotions,
      intensity: intensity || state.emotionIntensity,
      bodyScan: state.bodyScanData,
      understanding: u || state.understandingData,
      expressing: e || state.expressingData,
      regulating: r || state.regulatingData,
      physicalContext: physical,
      postMood: p || state.postRegulationMood,
      timestamp: new Date().toISOString(),
      isFullFlow: state.isFullFlow,
    };

    await dataAdapter.logs.create(fullData);
    await dataAdapter.draft.clear();
    await refreshProgress();
  };

  // ---------- 公開 Actions ----------

  const toggleQuadrant = (q: Quadrant) => {
    dispatch({ type: 'TOGGLE_QUADRANT', quadrant: q });
  };

  const handleMoodComplete = (quadrants: Quadrant[], intensity: number) => {
    dispatch({ type: 'SET_MOOD_COMPLETE', quadrants, intensity });
    // 3 秒後自動進入 bodyScan
    setTimeout(() => {
      dispatch({ type: 'SET_STEP', step: 'bodyScan' });
    }, 3000);
  };

  const handleBodyScanComplete = (data: BodyScanData) => {
    dispatch({ type: 'SET_BODY_SCAN', data });
  };

  const handleEmotionSelect = async (emotions: Emotion[]) => {
    dispatch({ type: 'SELECT_EMOTIONS', emotions });
    // 如果不是完整流程，自動保存
    if (!state.isFullFlow) {
      await saveLog(emotions, null, null, null, '', state.emotionIntensity);
    }
  };

  const handleUnderstandingComplete = (data: UnderstandingData) => {
    dispatch({ type: 'SET_UNDERSTANDING', data });
  };

  const handleExpressingComplete = (data: ExpressingData) => {
    dispatch({ type: 'SET_EXPRESSING', data });
  };

  const handleRegulatingComplete = (data: RegulatingData) => {
    dispatch({ type: 'SET_REGULATING', data });
  };

  const handleNeuroCheckComplete = async (physical?: { sleepHours: number; activityLevel: number }) => {
    await saveLog(state.selectedEmotions, null, null, state.regulatingData, state.postRegulationMood, state.emotionIntensity, physical);
    dispatch({ type: 'SET_NEURO_CHECK', physical });
  };

  const resetFlow = async () => {
    await dataAdapter.draft.clear();
    dispatch({ type: 'RESET_FLOW' });
  };

  const resumeDraft = () => {
    // 暫時簡化：直接重置（因為草稿恢復邏輯較複雜，需重構組件傳遞）
    dispatch({ type: 'DISMISS_RESUME_PROMPT' });
  };

  return {
    // State
    ...state,
    currentStepIndex,

    // Actions
    setStep: (step: RulerStep) => dispatch({ type: 'SET_STEP', step }),
    setIsFullFlow: (value: boolean) => dispatch({ type: 'SET_FULL_FLOW', value }),
    setPostRegulationMood: (mood: string) => dispatch({ type: 'SET_POST_MOOD', mood }),
    setShowResumePrompt: (show: boolean) => {
      if (!show) dispatch({ type: 'DISMISS_RESUME_PROMPT' });
    },
    resumeDraft,
    resetFlow,
    toggleQuadrant,
    toggleEmotion: (e: Emotion) => dispatch({ type: 'TOGGLE_EMOTION', emotion: e }),
    handleMoodComplete,
    handleBodyScanComplete,
    handleEmotionSelect,
    handleUnderstandingComplete,
    handleExpressingComplete,
    handleRegulatingComplete,
    handleNeuroCheckComplete,
  };
};
