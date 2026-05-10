import { useState } from 'react';

interface Props {
  onSend: (text: string) => void;
  onSOS: () => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, onSOS, disabled }: Props) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 p-4 border-t bg-white"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}
    >
      <button
        type="button"
        onClick={onSOS}
        disabled={disabled}
        aria-label="SOS 緊急協助"
        className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 transition disabled:opacity-50"
        title="SOS 緊急協助"
      >
        🆘
      </button>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="跟今心教練說說話..."
        disabled={disabled}
        aria-label="輸入訊息"
        className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        aria-label="送出訊息"
        className="flex-shrink-0 rounded-full bg-blue-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition flex items-center gap-1"
      >
        {disabled ? (
          <>
            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
            <span>傳送中</span>
          </>
        ) : (
          '送出'
        )}
      </button>
    </form>
  );
}
