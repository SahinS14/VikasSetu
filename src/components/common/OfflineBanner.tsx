import React from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const OfflineBanner: React.FC = () => {
  const { isOffline, offlineQueueCount, t, toggleOfflineMode } = useApp();

  if (!isOffline && offlineQueueCount === 0) return null;

  return (
    <div className={`w-full py-2 px-4 transition-colors ${
      isOffline 
        ? 'bg-amber-700 text-amber-50 shadow-md' 
        : 'bg-govTeal-700 text-emerald-50'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          {isOffline ? (
            <WifiOff className="w-4 h-4 animate-pulse text-amber-200" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          )}
          <span className="font-medium">
            {isOffline ? t.common.offlineMode : 'Connection Restored!'}
          </span>
          <span className="hidden md:inline text-amber-100 opacity-90">
            • {t.common.offlineNotice}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {offlineQueueCount > 0 && (
            <span className="bg-amber-900/60 px-2 py-0.5 rounded text-xs font-mono font-bold">
              {offlineQueueCount} {t.common.syncQueue}
            </span>
          )}
          <button
            onClick={toggleOfflineMode}
            className="px-2.5 py-1 rounded bg-white/15 hover:bg-white/25 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            {isOffline ? 'Simulate Online' : 'Simulate Offline'}
          </button>
        </div>
      </div>
    </div>
  );
};
