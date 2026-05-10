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
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4 border-t bg-white">
      <button
        type="button"
        onClick={onSOS}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 transition"
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
        className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="flex-shrink-0 rounded-full bg-blue-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition"
      >
        送出
      </button>
    </form>
  );
}
