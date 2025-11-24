import React, { useEffect, useState } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { XIcon } from './icons/XIcon';

interface NotificationToastProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
  duration?: number;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ message, actionLabel, onAction, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    if (duration > 0) {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for fade out
        }, duration);
        return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div 
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 bg-indigo-900/90 backdrop-blur-md border border-indigo-500/50 text-white rounded-lg shadow-2xl transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
    >
      <div className="p-2 bg-indigo-600 rounded-full">
          <DownloadIcon className="w-5 h-5" />
      </div>
      <div>
          <p className="text-sm font-medium">{message}</p>
      </div>
      {actionLabel && onAction && (
          <button 
            onClick={onAction}
            className="ml-2 px-3 py-1 text-xs font-bold bg-white text-indigo-900 rounded-md hover:bg-gray-100 transition-colors"
          >
              {actionLabel}
          </button>
      )}
      <button onClick={() => setIsVisible(false)} className="ml-1 text-indigo-300 hover:text-white">
          <XIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default NotificationToast;