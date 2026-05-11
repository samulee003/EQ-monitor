import { logger } from '../utils/logger';
import React, { useState, useRef, useEffect } from 'react';
import { aiService, type AIInsight } from '../services/AIService';
import { dataAdapter } from '../adapters';
import { type RulerLogEntry } from '../types/RulerTypes';
import './AIChatAssistant.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  insight?: AIInsight;
}

interface AIChatAssistantProps {
  currentLog?: RulerLogEntry;
  onClose: () => void;
}

const WELCOME_MESSAGE = `你好，我是今心 AI 助手。🌿

我可以幫你：
• 分析當前情緒狀態
• 提供個性化調節建議
• 解答情緒相關問題
• 陪你聊聊天

今天想聊些什麼呢？`;

export const AIChatAssistant: React.FC<AIChatAssistantProps> = ({
  currentLog,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: WELCOME_MESSAGE,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // 如果有當前日誌，自動分析
    if (currentLog) {
      handleAnalyzeCurrentLog();
    }
  }, [currentLog]);

  const handleAnalyzeCurrentLog = async () => {
    if (!currentLog || isAnalyzing) return;
    
    setIsAnalyzing(true);
    setIsLoading(true);

    try {
      const history = (await dataAdapter.logs.export()).slice(0, 5);
      const insight = await aiService.analyzeFeeling(currentLog, history);

      const analysisMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `## 📊 情緒分析報告

${insight.summary}

### 🔍 潛在模式
${insight.underlyingPatterns.map(p => `• ${p}`).join('\n')}

### 💡 建議行動
${insight.suggestedAction}

### 🎨 色彩理論
${insight.colorTheory || '無'}

### 💬 給你的話
> ${insight.empatheticQuote}`,
        timestamp: new Date(),
        insight
      };

      setMessages(prev => [...prev, analysisMessage]);
    } catch (error) {
      // Production-safe error logging
      if (import.meta.env.DEV) {
        logger.error('[AIChatAssistant] Analysis failed', { error: String(error) });
      }
    } finally {
      setIsLoading(false);
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const history = (await dataAdapter.logs.export()).slice(0, 3);
      const response = await aiService.chatWithAssistant(userMessage.content, history);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // Production-safe error logging
      if (import.meta.env.DEV) {
        logger.error('[AIChatAssistant] Chat failed', { error: String(error) });
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，我現在無法回應。請稍後再試，或檢查你的網路連接。',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { label: '分析今天的情緒', action: () => handleAnalyzeCurrentLog() },
    { label: '給我一些調節建議', action: () => setInputValue('我現在感覺不太好，可以給我一些調節情緒的建議嗎？') },
    { label: '解釋 RULER 框架', action: () => setInputValue('可以幫我解釋一下 RULER 情緒框架嗎？') },
    { label: '為什麼要記錄情緒', action: () => setInputValue('為什麼記錄情緒對心理健康有幫助？') }
  ];

  return (
    <div className="ai-chat-overlay">
      <div className="ai-chat-container">
        {/* Header */}
        <div className="ai-chat-header">
          <div className="ai-chat-title">
            <span className="ai-icon">🤖</span>
            <div>
              <h3>今心 AI 助手</h3>
              <span className="ai-status">
                {isLoading ? '思考中...' : '線上'}
              </span>
            </div>
          </div>
          <button className="close-btn" aria-label="關閉" onClick={onClose}>✕</button>
        </div>

        {/* Messages */}
        <div className="ai-chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.role}`}
            >
              <div className="message-avatar">
                {message.role === 'assistant' ? '🤖' : '👤'}
              </div>
              <div className="message-content">
                <div className="message-text">
                  {message.content.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < message.content.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString('zh-TW', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message assistant loading">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length < 3 && (
          <div className="quick-actions">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="quick-action-btn"
                onClick={action.action}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="ai-chat-input">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="輸入訊息..."
            rows={1}
            disabled={isLoading}
          />
          <button
            className="send-btn"
            aria-label="發送訊息"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
          >
            {isLoading ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatAssistant;
