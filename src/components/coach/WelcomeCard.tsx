interface Props {
  onPromptClick: (prompt: string) => void;
}

const SUGGESTED_PROMPTS = [
  '我今天有點煩，想找人聊聊',
  '幫我啟動 Meta-Moment',
  '看看我最近的情緒趨勢',
];

export function WelcomeCard({ onPromptClick }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 max-w-sm w-full shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          歡迎來到今心教練
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          我是你的 AI 情緒教練，在這裡陪伴你覺察情緒、練習回應策略，找回內在的平穩。
        </p>
        <div className="space-y-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onPromptClick(prompt)}
              className="w-full text-left px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
