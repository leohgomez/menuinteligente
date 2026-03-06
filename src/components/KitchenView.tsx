import { useState } from 'react';
import { CheckCircle2, Clock, LogOut, Lock, ChefHat } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { KitchenOrder, Product } from '../types'; // Table is not used, so not added
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
  const pendingOrders = orders.filter((o) => o.status === 'pending').sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="flex-1 p-4 bg-zinc-950 overflow-y-auto pt-safe pb-24">
      <div className="mb-6 pt-2 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
            {storeLogoUrl ? (
              <img src={storeLogoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <ChefHat className="w-6 h-6 text-zinc-400" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Cozinha</h2>
            <p className="text-zinc-400 text-sm mt-1">Gerencie os pedidos</p>
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

      <AnimatePresence>
        {showChangePassword && (
          <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
        )}
      </AnimatePresence>

      {pendingOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
          <CheckCircle2 className="w-16 h-16 mb-4 opacity-20" />
          <p>Nenhum pedido pendente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingOrders.map((order) => (
            <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">Mesa {order.tableNumber}</h3>
                  <div className="flex items-center gap-1.5 text-zinc-400 text-sm mt-1">
                    <Clock className="w-4 h-4" />
                    <span>{format(order.timestamp, 'HH:mm', { locale: ptBR })}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-zinc-950 rounded-2xl p-4 mb-4 border border-zinc-800/50">
                <ul className="space-y-3">
                  {order.items.map((item, index) => {
                    const product = products.find((p) => p.id === item.productId);
                    return (
                      <li key={index} className="flex items-start gap-3 text-white">
                        <span className="font-bold text-amber-500 min-w-[24px]">{item.quantity}x</span>
                        <span className="font-medium">{product?.name || 'Produto não encontrado'}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <button
                onClick={() => onMarkReady(order.id)}
                className="w-full py-4 rounded-2xl font-bold text-lg text-zinc-950 bg-amber-500 active:bg-amber-400 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-6 h-6" />
                Marcar como Pronto
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
