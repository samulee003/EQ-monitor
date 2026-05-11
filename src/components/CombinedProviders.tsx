/**
 * CombinedProviders - 組合所有 Context Provider
 * 
 * 消除 App.tsx 中的嵌套地獄，將所有 Provider 扁平化組合。
 * 未來遷移至 Zustand 後，可進一步減少 Provider 數量。
 */

import React from 'react';
import { AuthProvider } from '../services/AuthContext';
import { ThemeProvider } from '../services/ThemeContext';
import { LanguageProvider } from '../services/LanguageContext';
import { HabitProvider } from '../services/HabitContext';

interface ProvidersProps {
  children: React.ReactNode;
}

// 使用函數組合避免 JSX 嵌套地獄
const composeProviders = (
  ...providers: React.FC<{ children: React.ReactNode }>[]
): React.FC<ProvidersProps> => {
  return providers.reduce(
    (AccumulatedProviders, CurrentProvider) => {
      return ({ children }) => (
        <AccumulatedProviders>
          <CurrentProvider>{children}</CurrentProvider>
        </AccumulatedProviders>
      );
    },
    ({ children }) => <>{children}</>
  );
};

const ComposedProvider = composeProviders(
  AuthProvider,
  ThemeProvider,
  LanguageProvider,
  HabitProvider
);

export const CombinedProviders: React.FC<ProvidersProps> = ({ children }) => {
  return <ComposedProvider>{children}</ComposedProvider>;
};

export default CombinedProviders;
