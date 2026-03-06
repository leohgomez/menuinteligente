import { useState } from 'react';
import { Plus, Users, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Table, KitchenOrder } from '../types';
import { ChangePasswordModal } from './ChangePasswordModal';

interface TablesViewProps {
  tables: Table[];
  kitchenOrders: KitchenOrder[];
  storeLogoUrl: string | null;
  onSelectTable: (tableId: string) => void;
  onAddTable: () => void;
}

export function TablesView({ tables, kitchenOrders, storeLogoUrl, onSelectTable, onAddTable }: TablesViewProps) {
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <div className="flex-1 p-4 bg-zinc-950 overflow-y-auto relative">
      <div className="mb-6 pt-2 flex items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
            {storeLogoUrl ? (
              <img src={storeLogoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Users className="w-6 h-6 text-zinc-400" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Mesas Abertas</h2>
            <p className="text-zinc-400 text-sm mt-0.5">Gerencie os pedidos ativos</p>
          </div>
        </div>

        <button
          onClick={() => setShowChangePassword(true)}
          className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-2xl transition-all shadow-lg"
          title="Alterar Senha"
        >
          <Lock className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence>
        {showChangePassword && (
          <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
        )}
      </AnimatePresence>

      {tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-zinc-800 rounded-3xl mt-8">
          <Users className="w-12 h-12 text-zinc-600 mb-4" />
          <p className="text-zinc-400 text-center px-4">Nenhuma mesa aberta no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 pb-24">
          {tables.map((table) => {
            const totalItems = table.orders.length > 0 ? table.orders.reduce((acc, item) => acc + item.quantity, 0) : 0;
            const hasReadyOrder = kitchenOrders.some(order => order.tableId === table.id && order.status === 'ready');

            return (
              <button
                key={table.id}
                onClick={() => onSelectTable(table.id)}
                className={`rounded-2xl p-4 text-left active:scale-95 transition-all flex flex-col h-32 border ${hasReadyOrder
                  ? 'bg-green-500/10 border-green-500/50 shadow-lg shadow-green-500/10'
                  : 'bg-zinc-900 border-zinc-800'
                  }`}
              >
                <div className="flex justify-between items-start mb-auto">
                  <h3 className={`text-xl font-bold ${hasReadyOrder ? 'text-green-500' : 'text-white'}`}>
                    Mesa {table.number}
                  </h3>
                  {hasReadyOrder && (
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  )}
                </div>

                <div className="mt-auto flex justify-between items-end">
                  <span className={`text-xs px-2 py-1 rounded-md font-medium ${hasReadyOrder
                    ? 'bg-green-500 text-zinc-950'
                    : totalItems > 0
                      ? 'bg-amber-500/20 text-amber-500'
                      : 'bg-zinc-800 text-zinc-400'
                    }`}>
                    {hasReadyOrder ? 'PEDIDO PRONTO' : `${totalItems} itens`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={onAddTable}
        className="absolute bottom-6 right-6 bg-amber-500 text-zinc-950 p-4 rounded-full shadow-lg shadow-amber-500/20 active:scale-95 transition-transform flex items-center justify-center"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
}
