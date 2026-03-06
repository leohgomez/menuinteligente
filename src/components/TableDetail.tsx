import { ArrowLeft, CheckCircle2, FileText, Minus, Plus, X, ChefHat, DollarSign, Trash2, Loader2, Lock } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Category, KitchenOrder, Product, Table } from '../types';

interface TableDetailProps {
  table: Table;
  products: Product[];
  onUpdateTable: (table: Table) => void;
  onCloseTable: (tableId: string) => void;
  onPay: (tableId: string) => void;
  onBack: () => void;
  onSendToKitchen: (order: KitchenOrder) => void;
  onMarkDelivered: (tableId: string) => void;
  onDeleteTable: (tableId: string, password: string) => Promise<void>;
  userRole?: string | null;
  userId?: string | null;
}

export function TableDetail({ table, products, onUpdateTable, onCloseTable, onPay, onBack, onSendToKitchen, onMarkDelivered, onDeleteTable, userRole, userId }: TableDetailProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('Espetinhos');
  const [showBill, setShowBill] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showInitialActions, setShowInitialActions] = useState(table.status === 'available' && table.orders.length > 0);
  const [showPostDeliveryActions, setShowPostDeliveryActions] = useState(table.status === 'delivered');

  const categories: Category[] = ['Espetinhos', 'Acompanhamentos', 'Bebidas'];

  const handleQuantityChange = (productId: string, delta: number) => {
    const existingOrderIndex = table.orders.findIndex((o) => o.productId === productId);
    let newOrders = [...table.orders];

    if (existingOrderIndex >= 0) {
      const newQuantity = newOrders[existingOrderIndex].quantity + delta;
      if (newQuantity <= 0) {
        newOrders.splice(existingOrderIndex, 1);
      } else {
        newOrders[existingOrderIndex].quantity = newQuantity;
      }
    } else if (delta > 0) {
      newOrders.push({ productId, quantity: delta });
    }

    onUpdateTable({ ...table, orders: newOrders });
  };

  const handleServiceChargeToggle = () => {
    onUpdateTable({ ...table, serviceCharge: !table.serviceCharge });
  };

  const handleSendToKitchenClick = () => {
    const tableSentItems = table.sentItems || {};
    const newItemsToSend = table.orders.filter(order => {
      const sentQuantity = tableSentItems[order.productId] || 0;
      return order.quantity > sentQuantity;
    }).map(order => ({
      productId: order.productId,
      quantity: order.quantity - (tableSentItems[order.productId] || 0)
    }));

    if (newItemsToSend.length === 0) return;

    const newOrder: KitchenOrder = {
      id: Date.now().toString(),
      tableId: table.id,
      tableNumber: table.number,
      items: newItemsToSend,
      timestamp: Date.now(),
      status: 'pending'
    };

    onSendToKitchen(newOrder);
  };

  const calculateSubtotal = () => {
    return table.orders.reduce((total, order) => {
      const product = products.find((p) => p.id === order.productId);
      return total + (product ? product.price * order.quantity : 0);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const serviceChargeAmount = table.serviceCharge ? subtotal * 0.1 : 0;
  const total = subtotal + serviceChargeAmount;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filteredProducts = products.filter((p) => p.category === activeCategory);

  const hasUnsentItems = table.orders.some(order => {
    const sentQuantity = (table.sentItems || {})[order.productId] || 0;
    return order.quantity > sentQuantity;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden relative">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between shrink-0 pt-safe">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 active:bg-zinc-800 rounded-full text-zinc-400 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Mesa {table.number}</h2>
            <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest leading-none">Resumo do Pedido</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!showInitialActions && !showPostDeliveryActions && table.status !== 'ready' && (
            <>
              {(userId === table.createdBy || userRole === 'admin' || userRole === 'manager') && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  title="Excluir Mesa"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setShowBill(true)}
                className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all"
              >
                <FileText className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {table.status === 'ready' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950">
            <div className="w-full max-w-sm space-y-6 text-center">
              <div className="flex flex-col items-center space-y-4 mb-8">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center animate-pulse border-4 border-green-500/10">
                  <ChefHat className="w-12 h-12 text-green-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white italic underline decoration-green-500 underline-offset-8 decoration-4">Pedido Pronto!</h3>
                  <p className="text-zinc-400 mt-2">Toque no botão abaixo para entregar</p>
                </div>
              </div>

              <div className="w-full">
                <button
                  onClick={() => {
                    onMarkDelivered(table.id);
                    setShowPostDeliveryActions(true);
                  }}
                  className="w-full bg-green-500 text-zinc-950 py-10 rounded-3xl font-black text-3xl shadow-2xl shadow-green-500/20 flex flex-col items-center justify-center gap-4 active:scale-[0.95] transition-all border-b-8 border-green-700"
                >
                  <CheckCircle2 className="w-12 h-12" />
                  ENTREGUE
                </button>
                <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em] mt-6">Ação necessária para prosseguir</p>
              </div>
            </div>
          </div>
        ) : showPostDeliveryActions ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950">
            <div className="w-full max-w-sm space-y-6 text-center">
              <div className="flex flex-col items-center space-y-4 mb-8">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center border-4 border-green-500/10 text-green-500">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white italic underline decoration-green-500 underline-offset-8 decoration-4">Pedido Entregue!</h3>
                  <p className="text-zinc-400 mt-2">Deseja fechar o pedido ou pedir mais?</p>
                </div>
              </div>

              <div className="space-y-4 w-full">
                <button
                  onClick={() => {
                    setShowPostDeliveryActions(false);
                    setShowBill(true);
                  }}
                  className="w-full bg-zinc-100 text-zinc-950 py-6 rounded-3xl font-black text-xl shadow-xl flex items-center justify-center gap-3 active:scale-[0.95] transition-all"
                >
                  <DollarSign className="w-6 h-6" />
                  FECHAR PARA PAGAR
                </button>

                <button
                  onClick={() => setShowPostDeliveryActions(false)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white py-6 rounded-3xl font-black text-xl shadow-xl flex items-center justify-center gap-3 active:scale-[0.95] transition-all"
                >
                  <Plus className="w-6 h-6 text-amber-500" />
                  ACRESCENTAR NOVOS ITENS
                </button>

                <button
                  onClick={onBack}
                  className="w-full bg-zinc-900/50 text-zinc-500 py-4 rounded-3xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.95] transition-all"
                >
                  PAGAR DEPOIS
                </button>
              </div>
            </div>
          </div>
        ) : showInitialActions && table.status === 'available' && table.orders.length > 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950">
            <div className="w-full max-w-sm space-y-6 text-center">
              <div className="flex flex-col items-center space-y-4 mb-8">
                <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <FileText className="w-12 h-12 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white italic underline decoration-amber-500 underline-offset-8 decoration-4">Mesa {table.number} Aberta</h3>
                  <p className="text-zinc-400 mt-2">O que deseja fazer agora?</p>
                </div>
              </div>

              <div className="space-y-4 w-full">
                <button
                  onClick={() => setShowInitialActions(false)}
                  className="w-full bg-zinc-100 text-zinc-950 py-6 rounded-3xl font-black text-xl shadow-xl flex items-center justify-center gap-3 active:scale-[0.95] transition-all"
                >
                  <Plus className="w-6 h-6" />
                  ACRESCENTAR ITENS
                </button>

                {hasUnsentItems && (
                  <button
                    onClick={handleSendToKitchenClick}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white py-6 rounded-3xl font-black text-xl shadow-xl flex items-center justify-center gap-3 active:scale-[0.95] transition-all"
                  >
                    <ChefHat className="w-6 h-6 text-amber-500" />
                    ENVIAR PARA COZINHA
                  </button>
                )}

                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full bg-red-500/10 border border-red-500/20 text-red-500 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.95] transition-all"
                >
                  <X className="w-4 h-4" />
                  CANCELAR PEDIDO / LIMPAR MESA
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Categories */}
            <div className="flex gap-2 overflow-x-auto p-4 shrink-0 no-scrollbar border-b border-zinc-900">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`whitespace-nowrap px-5 py-2.5 rounded-full font-medium text-sm transition-all ${activeCategory === category
                    ? 'bg-amber-500 text-zinc-950'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-4 pb-32">
              <div className="flex flex-col gap-3">
                {filteredProducts.map((product) => {
                  const orderItem = table.orders.find((o) => o.productId === product.id);
                  const quantity = orderItem ? orderItem.quantity : 0;
                  const sentQuantity = (table.sentItems || {})[product.id] || 0;
                  const unsentQuantity = quantity - sentQuantity;

                  return (
                    <div
                      key={product.id}
                      className={`bg-zinc-900 border rounded-2xl p-3 flex items-center gap-4 transition-all ${quantity > 0 ? 'border-amber-500/50 bg-amber-500/5' : 'border-zinc-800'
                        }`}
                    >
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 bg-zinc-800"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-zinc-800 shrink-0 flex items-center justify-center">
                          <span className="text-zinc-600 text-xs">Sem foto</span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-bold text-white leading-tight mb-1 truncate">{product.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-amber-500 font-medium text-sm">
                            {formatCurrency(product.price)}
                          </span>
                          {unsentQuantity > 0 && (
                            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded-md">
                              {unsentQuantity} para enviar
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-zinc-950 rounded-xl p-1 border border-zinc-800 shrink-0">
                        <button
                          onClick={() => handleQuantityChange(product.id, -1)}
                          disabled={quantity === 0}
                          className={`p-2 rounded-lg transition-colors ${quantity > 0 ? 'text-zinc-300 active:bg-zinc-800' : 'text-zinc-700 opacity-50'
                            }`}
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="w-6 text-center font-bold text-white">{quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(product.id, 1)}
                          className="p-2 rounded-lg text-amber-500 active:bg-amber-500/10 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Fixed Bottom Bar for Actions */}
      {!showInitialActions && !showPostDeliveryActions && table.status !== 'ready' && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pt-12 pointer-events-none flex flex-col gap-3">
          {/* Secondary Action: Enviar Cozinha (Always priority if items pending) */}
          {hasUnsentItems && (
            <button
              onClick={handleSendToKitchenClick}
              className="w-full bg-zinc-100 text-zinc-950 py-4 rounded-2xl font-bold text-base shadow-lg shadow-white/10 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform pointer-events-auto"
            >
              <ChefHat className="w-5 h-5" />
              Enviar para Cozinha
            </button>
          )}

          {/* Primary Action based on Status */}
          <div className="flex gap-3">

            {table.status === 'delivered' && (
              <button
                onClick={() => setShowBill(true)}
                className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform pointer-events-auto"
              >
                <DollarSign className="w-5 h-5" />
                Pagar
              </button>
            )}

            {table.status === 'paid' && (
              <div className="flex-1 bg-blue-500/20 border border-blue-500/50 text-blue-500 py-4 rounded-2xl font-bold text-center animate-pulse">
                FINALIZADO
              </div>
            )}

            {(table.status === 'available' || table.status === 'sent') && (
              <button
                onClick={() => setShowBill(true)}
                className={`flex-1 bg-amber-500 text-zinc-950 py-4 rounded-2xl font-bold text-base shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform pointer-events-auto`}
              >
                <FileText className="w-5 h-5" />
                Conta
              </button>
            )}

            {/* Always show "Conta" if not in specialized state or as secondary if ready/delivered */}
            {table.status === 'delivered' && (
              <button
                onClick={() => setShowBill(true)}
                className="p-4 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-2xl active:bg-zinc-800 transition-all pointer-events-auto"
                title="Ver Detalhes da Conta"
              >
                <FileText className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bill Modal (Bottom Sheet style) */}
      {showBill && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBill(false)} />
          <div className="bg-zinc-900 rounded-t-3xl w-full max-h-[85vh] flex flex-col relative z-10 animate-in slide-in-from-bottom-full duration-300">
            <div className="p-4 flex justify-center shrink-0">
              <div className="w-12 h-1.5 bg-zinc-700 rounded-full" />
            </div>

            <div className="px-6 pb-4 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <h3 className="text-2xl font-bold text-white">Conta - Mesa {table.number}</h3>
              <button
                onClick={() => setShowBill(false)}
                className="p-2 bg-zinc-800 text-zinc-400 rounded-full active:bg-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {table.orders.length === 0 ? (
                <div className="text-center text-zinc-500 py-8">
                  Nenhum item consumido ainda.
                </div>
              ) : (
                <div className="space-y-4">
                  {table.orders.map((order) => {
                    const product = products.find((p) => p.id === order.productId);
                    if (!product) return null;
                    return (
                      <div key={order.productId} className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-medium">{product.name}</p>
                          <p className="text-sm text-zinc-500">
                            {order.quantity}x {formatCurrency(product.price)}
                          </p>
                        </div>
                        <p className="text-white font-medium">
                          {formatCurrency(product.price * order.quantity)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-zinc-800 space-y-4">
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={table.serviceCharge}
                      onChange={handleServiceChargeToggle}
                      className="w-6 h-6 rounded-md border-zinc-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-900 bg-zinc-800"
                    />
                    <span className="text-zinc-300">Taxa de Serviço (10%)</span>
                  </label>
                  <span className="text-zinc-400">{formatCurrency(serviceChargeAmount)}</span>
                </div>

                <div className="flex justify-between items-center pt-4 mt-4 border-t border-zinc-800">
                  <span className="text-xl font-bold text-white">Total</span>
                  <span className="text-3xl font-bold text-amber-500">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-950 border-t border-zinc-900 shrink-0 pb-safe space-y-3">
              {!isPaying ? (
                <button
                  onClick={() => setIsPaying(true)}
                  disabled={table.orders.length === 0}
                  className="w-full py-4 rounded-2xl font-bold text-lg text-zinc-950 bg-amber-500 active:bg-amber-400 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-6 h-6" />
                  Fechar Conta
                </button>
              ) : (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-center">
                    <p className="text-zinc-400 text-sm mb-1">Confirmar recebimento de:</p>
                    <p className="text-3xl font-bold text-white">{formatCurrency(total)}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsPaying(false)}
                      className="flex-1 py-4 rounded-2xl font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 active:bg-zinc-800"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={() => onPay(table.id)}
                      className="flex-[2] py-4 rounded-2xl font-bold text-zinc-950 bg-emerald-500 active:bg-emerald-400 flex items-center justify-center gap-2"
                    >
                      <DollarSign className="w-6 h-6" />
                      Conta Paga
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-red-500/20 w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-500/10 p-2 rounded-xl text-red-500">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white italic">Excluir Mesa</h3>
                  <p className="text-zinc-500 text-xs">Ação irreversível</p>
                </div>
              </div>

              <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                Tem certeza que deseja excluir a <span className="text-white font-bold">Mesa {table.number}</span>? Todos os pedidos não pagos serão perdidos.
              </p>

              <div className="space-y-4 mb-8">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Sua Senha de Confirmação</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
                  <input
                    type="password"
                    placeholder="Sua senha para validar"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full bg-zinc-800 border-none rounded-2xl py-4 pl-11 pr-4 text-zinc-100 placeholder:text-zinc-700 focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm"
                  />
                </div>
                {deleteError && (
                  <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{deleteError}</p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  disabled={isDeleting || !deletePassword}
                  onClick={async () => {
                    setIsDeleting(true);
                    setDeleteError(null);
                    try {
                      await onDeleteTable(table.id, deletePassword);
                      setShowDeleteModal(false);
                    } catch (err: any) {
                      setDeleteError(err.message || "Erro ao excluir mesa");
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  className="bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "EXCLUIR AGORA"}
                </button>
                <button
                  disabled={isDeleting}
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                    setDeleteError(null);
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
    </div>
  );
}
