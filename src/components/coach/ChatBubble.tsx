import type { CoachMessage } from '../../lib/adk/types';
import { formatRelativeTime } from '../../utils/dateUtils';

interface Props {
  message: CoachMessage;
}

function formatCoachTimestamp(iso: string): string {
  const target = new Date(iso);
  const diffSeconds = Math.floor((Date.now() - target.getTime()) / 1000);
  if (diffSeconds < 60) return '剛剛';
  return formatRelativeTime(target);
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
        <div>{message.content}</div>
        {message.metadata?.skillInvoked && (
          <div className="mt-1 text-xs opacity-70">
            🛟 {message.metadata.skillInvoked}
          </div>
        )}
        <div
          className={`mt-1 text-[10px] opacity-60 ${
            isUser ? 'text-right' : 'text-left'
          }`}
        >
          {formatCoachTimestamp(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
