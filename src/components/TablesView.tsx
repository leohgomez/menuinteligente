import { useState } from 'react';
import { Plus, Users, Lock, LogOut, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Table, KitchenOrder } from '../types';
import { ChangePasswordModal } from './ChangePasswordModal';

interface TablesViewProps {
  tables: Table[];
  products: Product[];
  kitchenOrders: KitchenOrder[];
  storeLogoUrl: string | null;
  onSelectTable: (tableId: string) => void;
  onAddTable: (number: number) => void;
  onLogout: () => void;
  profile?: any;
  user?: any;
}

export function TablesView({ tables, products, kitchenOrders, storeLogoUrl, onSelectTable, onAddTable, onLogout, profile, user }: TablesViewProps) {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');

  // Filter only active tables (not paid)
  const activeTables = tables.filter(t => t.status !== 'paid');

  // Count how many tables this attendant completed today
  const dailyCount = tables.filter(t => {
    if (t.status !== 'paid' || !t.paidAt || t.createdBy !== user?.id) return false;
    const paidDate = new Date(t.paidAt).toLocaleDateString();
    const today = new Date().toLocaleDateString();
    return paidDate === today;
  }).length;

  return (
    <div className="flex-1 p-4 bg-zinc-950 overflow-y-auto relative pb-32">
      <div className="mb-6 pt-2 flex items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 bg-zinc-900 border border-zinc-800">
            {storeLogoUrl ? (
              <img src={storeLogoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Users className="w-6 h-6 text-zinc-400" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Mesas Abertas</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
              <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest leading-none">
                {dailyCount} {dailyCount === 1 ? 'ATENDIMENTO' : 'ATENDIMENTOS'} HOJE
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowChangePassword(true)}
            className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-2xl transition-all shadow-lg"
            title="Alterar Senha"
          >
            <Lock className="w-5 h-5" />
          </button>

          <button
            onClick={onLogout}
            className="p-3 bg-red-500/10 text-red-500 rounded-2xl active:bg-red-500/20 transition-all"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showChangePassword && (
          <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
        )}

        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-2 italic">Nova Mesa</h2>
              <p className="text-zinc-500 text-sm mb-6">Qual o número da mesa?</p>

              <input
                type="number"
                inputMode="numeric"
                autoFocus
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                placeholder="Ex: 05"
                className="w-full bg-zinc-800 border-none rounded-2xl py-6 text-center text-4xl font-black text-amber-500 placeholder:text-zinc-700 focus:ring-2 focus:ring-amber-500 transition-all outline-none mb-6"
              />

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    if (newTableNumber) {
                      onAddTable(parseInt(newTableNumber));
                      setNewTableNumber('');
                      setShowAddModal(false);
                    }
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/20"
                >
                  ABRIR MESA
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewTableNumber('');
                  }}
                  className="text-zinc-500 text-xs font-bold py-2 hover:text-zinc-400"
                >
                  CANCELAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTables.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-zinc-800 rounded-3xl mt-8">
          <Users className="w-12 h-12 text-zinc-600 mb-4" />
          <p className="text-zinc-400 text-center px-4">Nenhuma mesa aberta no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 pb-24">
          {activeTables.map((table) => {
            const totalItems = table.orders.length > 0 ? table.orders.reduce((acc, item) => acc + item.quantity, 0) : 0;

            const statusConfig = {
              available: {
                bg: 'bg-zinc-900 border-zinc-800',
                text: 'text-zinc-400',
                title: 'text-white',
                label: `${totalItems} itens`,
                labelBg: 'bg-zinc-800 text-zinc-400',
                pulse: false
              },
              sent: {
                bg: 'bg-amber-500/20 border-amber-500/50 shadow-lg shadow-amber-500/10',
                text: 'text-amber-500',
                title: 'text-amber-500',
                label: 'ENVIADO PARA A COZINHA',
                labelBg: 'bg-amber-500 text-zinc-950',
                pulse: true
              },
              ready: {
                bg: 'bg-green-500/20 border-green-500/50 shadow-lg shadow-green-500/10',
                text: 'text-green-500',
                title: 'text-green-500',
                label: 'PRONTO',
                labelBg: 'bg-green-500 text-zinc-950',
                pulse: true
              },
              delivered: {
                bg: 'bg-red-500/20 border-red-500/50 shadow-lg shadow-red-500/10',
                text: 'text-red-500',
                title: 'text-red-500',
                label: 'NÃO PAGO',
                labelBg: 'bg-red-500 text-white',
                pulse: true
              },
              paid: { // Should not appear due to filtering, but kept for completeness
                bg: 'bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/10',
                text: 'text-blue-500',
                title: 'text-blue-500',
                label: 'FINALIZADO',
                labelBg: 'bg-blue-500 text-white',
                pulse: false
              }
            };

            const config = statusConfig[table.status] || statusConfig.available;

            return (
              <button
                key={table.id}
                onClick={() => onSelectTable(table.id)}
                className={`rounded-2xl p-4 text-left active:scale-95 transition-all flex flex-col min-h-[140px] h-auto border ${config.bg}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`text-xl font-bold ${config.title}`}>
                    Mesa {table.number}
                  </h3>
                  {config.pulse && (
                    <span className={`flex h-2 w-2 rounded-full ${config.text.replace('text-', 'bg-')} animate-pulse`} />
                  )}
                </div>

                <div className="flex-1 overflow-hidden mb-3">
                  <div className="flex flex-col gap-1">
                    {table.orders.slice(0, 3).map((order) => {
                      const product = products.find(p => p.id === order.productId);
                      return (
                        <div key={order.productId} className="flex justify-between items-center text-[11px] font-medium text-zinc-400 group relative">
                          <span className="truncate pr-2">{product?.name}</span>
                          <span className="shrink-0 font-bold text-zinc-500">{order.quantity}x</span>
                        </div>
                      );
                    })}
                    {table.orders.length > 3 && (
                      <span className="text-[10px] text-zinc-500 italic mt-0.5">
                        + {table.orders.length - 3} {table.orders.length - 3 === 1 ? 'item' : 'itens'}...
                      </span>
                    )}
                    {table.orders.length === 0 && (
                      <span className="text-[11px] text-zinc-600 italic">Mesa vazia</span>
                    )}
                  </div>
                </div>

                <div className="mt-auto flex justify-between items-end">
                  <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider ${config.labelBg}`}>
                    {config.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 bg-amber-500 text-zinc-950 p-4 rounded-full shadow-lg shadow-amber-500/20 active:scale-95 transition-transform flex items-center justify-center z-50"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
}
