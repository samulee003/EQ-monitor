interface Props {
  onClick: () => void;
  visible: boolean;
}

export function CoachFAB({ onClick, visible }: Props) {
  if (!visible) return null;

  return (
    <button
      onClick={onClick}
      aria-label="開啟今心教練"
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition flex items-center justify-center text-2xl"
      style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}
    >
      💬
    </button>
  );
}
