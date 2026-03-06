import { ArrowLeft, CheckCircle2, FileText, Minus, Plus, X, ChefHat, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { Category, KitchenOrder, Product, Table } from '../types';

interface TableDetailProps {
  table: Table;
  products: Product[];
  onUpdateTable: (table: Table) => void;
  onCloseTable: (tableId: string) => void;
  onPay: (tableId: string) => void;
  onBack: () => void;
  onSendToKitchen: (order: KitchenOrder) => void;
}

export function TableDetail({ table, products, onUpdateTable, onCloseTable, onPay, onBack, onSendToKitchen }: TableDetailProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('Espetinhos');
  const [showBill, setShowBill] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

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
            <p className="text-zinc-400 text-xs">{table.orders.reduce((acc, o) => acc + o.quantity, 0)} itens</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-lg font-bold text-amber-500">{formatCurrency(subtotal)}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
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
      </div>

      {/* Fixed Bottom Bar for Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pt-12 pointer-events-none flex gap-3">
        {hasUnsentItems && (
          <button
            onClick={handleSendToKitchenClick}
            className="flex-1 bg-zinc-100 text-zinc-950 py-4 rounded-2xl font-bold text-base shadow-lg shadow-white/10 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform pointer-events-auto"
          >
            <ChefHat className="w-5 h-5" />
            Enviar Cozinha
          </button>
        )}

        <button
          onClick={() => setShowBill(true)}
          className={`bg-amber-500 text-zinc-950 py-4 rounded-2xl font-bold text-base shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform pointer-events-auto ${hasUnsentItems ? 'flex-1' : 'w-full'}`}
        >
          <FileText className="w-5 h-5" />
          {hasUnsentItems ? 'Conta' : `Ver Conta (${formatCurrency(subtotal)})`}
        </button>
      </div>

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
    </div>
  );
}
