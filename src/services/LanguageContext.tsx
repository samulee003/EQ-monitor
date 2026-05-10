import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as OpenCC from 'opencc-js';
import { dataAdapter, StorageKeys } from '../adapters';

type Language = 'zh-TW' | 'zh-CN';

interface LanguageContextType {
    language: Language;
    toggleLanguage: () => void;
    t: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('zh-TW');

    // 異步加載已保存的語言設置
    useEffect(() => {
        const loadLanguage = async () => {
            const saved = await dataAdapter.settings.get<Language>(StorageKeys.LANGUAGE);
            if (saved === 'zh-CN' || saved === 'zh-TW') {
                setLanguage(saved);
            }
        };
        loadLanguage();
    }, []);

    // Create converter: Traditional to Simplified
    const converter = useMemo(() => {
        return OpenCC.Converter({ from: 'tw', to: 'cn' });
    }, []);

    useEffect(() => {
        dataAdapter.settings.set(StorageKeys.LANGUAGE, language);
    }, [language]);

    const toggleLanguage = useCallback(() => {
        setLanguage(prev => prev === 'zh-TW' ? 'zh-CN' : 'zh-TW');
    }, []);

    const t = useCallback((text: string): string => {
        if (language === 'zh-CN') {
            return converter(text);
        }
        return text;
    }, [language, converter]);

    const value = useMemo(() => ({
        language,
        toggleLanguage,
        t
    }), [language, toggleLanguage, t]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export default LanguageContext;
