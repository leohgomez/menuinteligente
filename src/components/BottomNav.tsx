import { BarChart3, LayoutDashboard, Settings } from 'lucide-react';

interface BottomNavProps {
  currentView: 'tables' | 'settings' | 'panorama';
  setCurrentView: (view: 'tables' | 'settings' | 'panorama') => void;
  userRole: string | null;
}

export function BottomNav({ currentView, setCurrentView, userRole }: BottomNavProps) {
  const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';
  return (
    <div className="bg-zinc-950 border-t border-zinc-900 flex items-center justify-around p-2 pb-safe shrink-0">
      {isManagerOrAdmin && (
        <button
          onClick={() => setCurrentView('panorama')}
          className={`flex flex-col items-center p-2 rounded-xl min-w-[64px] transition-colors ${currentView === 'panorama' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
        >
          <BarChart3 className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium uppercase tracking-tight">Dashboard</span>
        </button>
      )}
      <button
        onClick={() => setCurrentView('tables')}
        className={`flex flex-col items-center p-2 rounded-xl min-w-[64px] transition-colors ${currentView === 'tables' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'
          }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-1" />
        <span className="text-[10px] font-medium uppercase tracking-tight">Mesas</span>
      </button>
      {isManagerOrAdmin && (
        <button
          onClick={() => setCurrentView('settings')}
          className={`flex flex-col items-center p-2 rounded-xl min-w-[64px] transition-colors ${currentView === 'settings' ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
        >
          <Settings className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium uppercase tracking-tight">Cardápio</span>
        </button>
      )}
    </div>
  );
}
