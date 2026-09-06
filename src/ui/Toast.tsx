import { CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'info' | 'error';

export interface ToastMsg {
  id: number;
  text: string;
  type: ToastType;
}

let toastId = 0;
let pushFn: ((text: string, type?: ToastType) => void) | null = null;

export function toast(text: string, type: ToastType = 'success') {
  pushFn?.(text, type);
}

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  useEffect(() => {
    pushFn = (text: string, type: ToastType = 'success') => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2800);
    };
    return () => {
      pushFn = null;
    };
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="toast-host">
      {toasts.map((t) => {
        const Icon = t.type === 'success' ? CheckCircle2 : t.type === 'error' ? AlertTriangle : Info;
        return (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <Icon size={17} />
            <span>{t.text}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Đóng"><X size={14} /></button>
          </div>
        );
      })}
    </div>
  );
}
