import { LayoutDashboard, Settings } from 'lucide-react';

interface BottomNavProps {
  currentView: 'tables' | 'settings';
  setCurrentView: (view: 'tables' | 'settings') => void;
}

export function BottomNav({ currentView, setCurrentView }: BottomNavProps) {
  return (
    <div className="bg-zinc-950 border-t border-zinc-900 flex items-center justify-around p-2 pb-safe shrink-0">
      <button
        onClick={() => setCurrentView('tables')}
        className={`flex flex-col items-center p-2 rounded-xl min-w-[80px] transition-colors ${
          currentView === 'tables' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <LayoutDashboard className="w-6 h-6 mb-1" />
        <span className="text-xs font-medium">Mesas</span>
      </button>
      <button
        onClick={() => setCurrentView('settings')}
        className={`flex flex-col items-center p-2 rounded-xl min-w-[80px] transition-colors ${
          currentView === 'settings' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Settings className="w-6 h-6 mb-1" />
        <span className="text-xs font-medium">Ajustes</span>
      </button>
    </div>
  );
}
