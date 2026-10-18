import React from 'react';
import { WifiOff, Database } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900/95 text-white px-3.5 py-2 text-xs font-semibold shadow-2xl border border-amber-500/40 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
      </span>
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <div>
        <span className="font-bold text-amber-300">Offline Mode Active</span>
        <span className="hidden sm:inline text-slate-300 ml-1.5 font-normal text-[11px]">
          — Existing records and accounting ledgers remain fully viewable.
        </span>
      </div>
      <div className="hidden md:flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] text-slate-300 font-mono">
        <Database className="w-3 h-3 text-emerald-400" />
        <span>Cached</span>
      </div>
    </div>
  );
};
