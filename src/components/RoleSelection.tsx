import { ChefHat, ClipboardList, TrendingUp } from 'lucide-react';
import { Role } from '../types';

interface RoleSelectionProps {
  onSelectRole: (role: Role) => void;
}

export function RoleSelection({ onSelectRole }: RoleSelectionProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Bem-vindo</h1>
          <p className="text-zinc-400">Selecione o seu perfil de acesso</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => onSelectRole('atendimento')}
            className="w-full bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex items-center gap-4 active:scale-95 transition-all hover:border-amber-500/50"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <ClipboardList className="w-7 h-7 text-amber-500" />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-xl font-bold text-white">Atendimento</h3>
              <p className="text-zinc-400 text-sm">Anotar pedidos e mesas</p>
            </div>
          </button>

          <button
            onClick={() => onSelectRole('cozinha')}
            className="w-full bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex items-center gap-4 active:scale-95 transition-all hover:border-amber-500/50"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <ChefHat className="w-7 h-7 text-amber-500" />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-xl font-bold text-white">Cozinha</h3>
              <p className="text-zinc-400 text-sm">Preparar e liberar pedidos</p>
            </div>
          </button>

          <button
            onClick={() => onSelectRole('gerente')}
            className="w-full bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex items-center gap-4 active:scale-95 transition-all hover:border-amber-500/50"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-7 h-7 text-amber-500" />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-xl font-bold text-white">Gerente</h3>
              <p className="text-zinc-400 text-sm">Estatísticas e caixa</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
