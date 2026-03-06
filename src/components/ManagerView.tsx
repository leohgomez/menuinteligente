import { BarChart3, DollarSign, Package, TrendingUp } from 'lucide-react';
import { format, isSameDay, isSameMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { KitchenOrder, Product, Table } from '../types';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface ManagerViewProps {
  products: Product[];
  tables: Table[];
  kitchenOrders: KitchenOrder[];
}

export function ManagerView({ products, tables, kitchenOrders }: ManagerViewProps) {
  const today = new Date();
  
  // Calculate today's revenue
  const todaysOrders = kitchenOrders.filter((o) => isSameDay(o.timestamp, today));
  const todaysRevenue = todaysOrders.reduce((total, order) => {
    return total + order.items.reduce((subtotal, item) => {
      const product = products.find((p) => p.id === item.productId);
      return subtotal + (product ? product.price * item.quantity : 0);
    }, 0);
  }, 0);

  // Calculate top products
  const productCounts: Record<string, number> = {};
  kitchenOrders.forEach((order) => {
    order.items.forEach((item) => {
      productCounts[item.productId] = (productCounts[item.productId] || 0) + item.quantity;
    });
  });

  const topProducts = Object.entries(productCounts)
    .map(([productId, count]) => ({
      product: products.find((p) => p.id === productId),
      count,
    }))
    .filter((p) => p.product)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate monthly stats for the chart
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(today.getFullYear(), i, 1);
    const monthOrders = kitchenOrders.filter((o) => isSameMonth(o.timestamp, monthDate));
    const revenue = monthOrders.reduce((total, order) => {
      return total + order.items.reduce((subtotal, item) => {
        const product = products.find((p) => p.id === item.productId);
        return subtotal + (product ? product.price * item.quantity : 0);
      }, 0);
    }, 0);

    return {
      name: format(monthDate, 'MMM', { locale: ptBR }),
      total: revenue,
    };
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="flex-1 p-4 bg-zinc-950 overflow-y-auto pt-safe pb-24">
      <div className="mb-6 pt-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">Gerência</h2>
        <p className="text-zinc-400 text-sm mt-1">Estatísticas e faturamento</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
            <DollarSign className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-zinc-400 text-sm font-medium mb-1">Faturamento Hoje</p>
            <h3 className="text-2xl font-bold text-white">{formatCurrency(todaysRevenue)}</h3>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
            <Package className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-zinc-400 text-sm font-medium mb-1">Pedidos Hoje</p>
            <h3 className="text-2xl font-bold text-white">{todaysOrders.length}</h3>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-amber-500" />
          Faturamento Anual
        </h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis 
                stroke="#52525b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `R$${value}`}
              />
              <Tooltip 
                cursor={{ fill: '#27272a' }}
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
              />
              <Bar dataKey="total" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-500" />
          Produtos Mais Vendidos
        </h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
          {topProducts.length === 0 ? (
            <div className="p-6 text-center text-zinc-500">Nenhum dado disponível.</div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {topProducts.map((item, index) => (
                <div key={item.product?.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-zinc-500 font-bold w-4">{index + 1}</span>
                    <span className="text-white font-medium">{item.product?.name}</span>
                  </div>
                  <span className="text-amber-500 font-bold">{item.count} un</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
