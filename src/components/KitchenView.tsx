import { useState } from 'react';
import { CheckCircle2, Clock, LogOut, Lock, ChefHat, Timer, ListFilter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { KitchenOrder, Product } from '../types';
import { ChangePasswordModal } from './ChangePasswordModal';

interface KitchenViewProps {
  orders: KitchenOrder[];
  products: Product[];
  onMarkReady: (orderId: string) => void;
  onLogout: () => void;
  storeLogoUrl: string | null;
}

export function KitchenView({ orders, products, onMarkReady, onLogout, storeLogoUrl }: KitchenViewProps) {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'ready'>('pending');

  const pendingOrders = orders
    .filter((o) => o.status === 'pending')
    .sort((a, b) => a.timestamp - b.timestamp);

  const readyOrders = orders
    .filter((o) => o.status === 'ready' && o.readyAt)
    .sort((a, b) => (b.readyAt || 0) - (a.readyAt || 0));

  const renderOrderCard = (order: KitchenOrder) => (
    <motion.div
      key={order.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col relative overflow-hidden ${order.status === 'ready' ? 'opacity-75' : ''}`}
    >
      <div className={`absolute top-0 left-0 w-1.5 h-full ${order.status === 'ready' ? 'bg-emerald-500' : 'bg-amber-500'}`} />

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold text-white">Mesa {order.tableNumber}</h3>
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>Pedido: {format(order.timestamp, 'HH:mm', { locale: ptBR })}</span>
            </div>
            {order.readyAt && (
              <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold">
                <Timer className="w-3.5 h-3.5" />
                <span>Pronto: {format(order.readyAt, 'HH:mm', { locale: ptBR })}</span>
              </div>
            )}
          </div>
        </div>
        {order.status === 'ready' && (
          <div className="p-2 bg-emerald-500/10 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
        )}
      </div>

      <div className="flex-1 bg-zinc-950 rounded-2xl p-4 mb-4 border border-zinc-800/50">
        <ul className="space-y-3">
          {order.items.map((item, index) => {
            const product = products.find((p) => p.id === item.productId);
            return (
              <li key={index} className="flex items-start gap-3 text-white">
                <span className={`font-bold min-w-[24px] ${order.status === 'ready' ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {item.quantity}x
                </span>
                <span className="font-medium">{product?.name || 'Produto não encontrado'}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {order.status === 'pending' && (
        <button
          onClick={() => onMarkReady(order.id)}
          className="w-full py-4 rounded-2xl font-bold text-lg text-zinc-950 bg-amber-500 active:bg-amber-400 transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-6 h-6" />
          Marcar como Pronto
        </button>
      )}
    </motion.div>
  );

  return (
    <div className="flex-1 p-4 bg-zinc-950 overflow-y-auto pt-safe pb-32">
      {/* Header */}
      <div className="mb-6 pt-2 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 bg-zinc-900 border border-zinc-800">
            {storeLogoUrl ? (
              <img src={storeLogoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <ChefHat className="w-6 h-6 text-zinc-400" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Cozinha</h2>
            <p className="text-zinc-500 text-sm mt-1">Gerenciamento de Produção</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowChangePassword(true)}
            className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-2xl transition-all"
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

      {/* Tabs */}
      <div className="flex p-1 bg-zinc-900 rounded-2xl mb-8 border border-zinc-800/50">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[0.9rem] font-bold text-sm transition-all ${activeTab === 'pending' ? 'bg-amber-500 text-zinc-950 shadow-lg' : 'text-zinc-500'}`}
        >
          <ListFilter className="w-4 h-4" />
          PENDENTES ({pendingOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('ready')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[0.9rem] font-bold text-sm transition-all ${activeTab === 'ready' ? 'bg-emerald-500 text-zinc-950 shadow-lg' : 'text-zinc-500'}`}
        >
          <CheckCircle2 className="w-4 h-4" />
          PRONTOS ({readyOrders.length})
        </button>
      </div>

      <AnimatePresence>
        {showChangePassword && (
          <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
        )}
      </AnimatePresence>

      {(activeTab === 'pending' ? pendingOrders : readyOrders).length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-zinc-900 rounded-[2.5rem]">
          <CheckCircle2 className="w-12 h-12 mb-4 text-zinc-800" />
          <p className="text-zinc-600 font-medium">Nenhum pedido nesta aba.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(activeTab === 'pending' ? pendingOrders : readyOrders).map(renderOrderCard)}
        </div>
      )}
    </div>
  );
}
