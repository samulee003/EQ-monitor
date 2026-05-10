import type { CoachMessage } from '../../lib/adk/types';

interface Props {
  message: CoachMessage;
}

export function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        }`}
      >
        {message.content}
        {message.metadata?.skillInvoked && (
          <div className="mt-1 text-xs opacity-70">
            🛟 {message.metadata.skillInvoked}
          </div>
        )}
      </div>
    </div>
  );
}
