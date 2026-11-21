'use client';

// Презентационный компонент тостов; состояние живёт в context/ToastContext.tsx

export interface ToastMessage {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
  message: string;
  duration?: number;
}

interface ToastProps {
  messages: ToastMessage[];
  onRemove: (id: string) => void;
}

export function Toast({ messages, onRemove }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`p-4 rounded-lg shadow-lg border-2 transition-all duration-300 ${
            msg.type === 'error'
              ? 'bg-red-900/90 border-red-500 text-white'
              : msg.type === 'warning'
              ? 'bg-yellow-900/90 border-yellow-500 text-white'
              : msg.type === 'success'
              ? 'bg-green-900/90 border-green-500 text-white'
              : 'bg-blue-900/90 border-blue-500 text-white'
          }`}
        >
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <div className="font-bold mb-1">
                {msg.type === 'error' && '❌ Ошибка'}
                {msg.type === 'warning' && '⚠️ Предупреждение'}
                {msg.type === 'success' && '✅ Успех'}
                {msg.type === 'info' && 'ℹ️ Информация'}
              </div>
              <div className="text-sm">{msg.message}</div>
            </div>
            <button
              onClick={() => onRemove(msg.id)}
              className="text-white/70 hover:text-white text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
