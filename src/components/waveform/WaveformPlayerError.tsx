interface WaveformPlayerErrorProps {
  error: string;
  onRetry: () => void;
}

export function WaveformPlayerError({ error, onRetry }: WaveformPlayerErrorProps) {
  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-600">
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-red-400 text-sm text-center">{error}</div>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
