import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { BottomNav } from './components/BottomNav';
import { SettingsView } from './components/SettingsView';
import { SplashScreen } from './components/SplashScreen';
import { TableDetail } from './components/TableDetail';
import { TablesView } from './components/TablesView';
import { KitchenView } from './components/KitchenView';
import { ManagerView } from './components/ManagerView';
import { AuthView } from './components/AuthView';
import { AdminDashboard } from './components/AdminDashboard';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import { AppState, KitchenOrder, Product, Table } from './types';
import { Bell, Loader2 } from 'lucide-react';

export default function App() {
  const { user, profile, loading: authLoading, logout } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<'tables' | 'settings'>('tables');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [storeId, setStoreId] = useState<string | null>(profile?.store_id || null);

  const [state, setState] = useState<AppState>({
    products: [],
    tables: [],
    kitchenOrders: [],
  });

  useEffect(() => {
    if (profile?.store_id && !storeId) {
      setStoreId(profile.store_id);
    }
  }, [profile, storeId]);

  useEffect(() => {
    if (!storeId) return;

    // Fetch initial data from Supabase
    const fetchData = async () => {
      const [productsData, tablesData, ordersData, categoriesData] = await Promise.all([
        supabase.from('products').select('*').eq('store_id', storeId),
        supabase.from('tables').select('*').eq('store_id', storeId),
        supabase.from('orders').select('*, order_items(*)').eq('store_id', storeId),
        supabase.from('categories').select('*').eq('store_id', storeId)
      ]);

      if (!productsData.error && !tablesData.error && !ordersData.error && !categoriesData.error) {
        const categoryMap = (categoriesData.data as any[]).reduce((acc, cat) => {
          acc[cat.id] = cat.name;
          return acc;
        }, {} as Record<string, string>);

        // Map kitchen orders (pending/ready)
        const kitchenOrders: KitchenOrder[] = (ordersData.data as any[]).map(o => ({
          id: o.id,
          tableId: o.table_id,
          tableNumber: o.table_number,
          items: (o.order_items as any[]).map(item => ({
            productId: item.product_id,
            quantity: item.quantity
          })),
          timestamp: new Date(o.created_at).getTime(),
          status: o.status
        }));

        setState(prev => ({
          ...prev,
          products: (productsData.data as any[]).map(p => ({
            id: p.id,
            name: p.name,
            price: parseFloat(p.price),
            category: categoryMap[p.category_id] as any,
            imageUrl: p.image_url
          })),
          tables: (tablesData.data as any[]).map(t => ({
            id: t.id,
            number: t.number,
            orders: t.current_orders || [],
            sentItems: t.sent_items || {},
            serviceCharge: t.service_charge ?? true,
            status: t.status as any
          })),
          kitchenOrders
        }));
      }
    };

    fetchData();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `store_id=eq.${storeId}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `store_id=eq.${storeId}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `store_id=eq.${storeId}` }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  const handleAddTable = async () => {
    console.log('Attempting to add table. storeId:', storeId);
    if (!storeId) {
      setNotifications(prev => [...prev, "Erro: Loja não identificada. Tente relogar."]);
      return;
    }

    const newTableNumber = state.tables.length > 0
      ? Math.max(...state.tables.map(t => t.number)) + 1
      : 1;

    const { error } = await supabase.from('tables').insert({
      number: newTableNumber,
      store_id: storeId,
      status: 'available'
    });

    if (error) {
      console.error('Error adding table:', error);
      setNotifications(prev => [...prev, `Erro ao criar mesa: ${error.message}`]);
    } else {
      setNotifications(prev => [...prev, `Mesa ${newTableNumber} criada!`]);
    }
  };

  const handleUpdateProducts = async (updatedProducts: Product[]) => {
    if (!storeId) return;

    try {
      // 1. Handle image uploads first
      const productsWithUrls = await Promise.all(updatedProducts.map(async (p) => {
        if (p.imageUrl && p.imageUrl.startsWith('data:image')) {
          // It's a base64 image from the cropper
          const fileName = `${storeId}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
          const base64Data = p.imageUrl.split(',')[1];
          const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());

          const { error: uploadError } = await supabase.storage
            .from('product-photos')
            .upload(fileName, blob, {
              contentType: 'image/jpeg',
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            return p;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('product-photos')
            .getPublicUrl(fileName);

          return { ...p, imageUrl: publicUrl };
        }
        return p;
      }));

      // 2. Find deleted products
      const currentIds = productsWithUrls.map(p => p.id);
      const deletedIds = state.products
        .filter(p => !currentIds.includes(p.id))
        .map(p => p.id);

      if (deletedIds.length > 0) {
        const { error: deleteError } = await supabase.from('products').delete().in('id', deletedIds);
        if (deleteError) {
          console.error('Error deleting products:', deleteError);
          setNotifications(prev => [...prev, `Erro ao excluir: ${deleteError.message}`]);
        }
      }

      // 3. Upsert updated/new products
      const { data: categoriesData } = await supabase.from('categories').select('*').eq('store_id', storeId);
      if (categoriesData) {
        const categoryMap = categoriesData.reduce((acc, cat) => {
          acc[cat.name] = cat.id;
          return acc;
        }, {} as Record<string, string>);

        const upsertData = productsWithUrls.map(p => ({
          id: p.id.includes('-') ? p.id : undefined,
          store_id: storeId,
          category_id: categoryMap[p.category],
          name: p.name,
          price: p.price,
          image_url: p.imageUrl
        }));

        const { error: upsertError } = await supabase.from('products').upsert(upsertData);

        if (upsertError) {
          console.error('Error updating products:', upsertError);
          setNotifications(prev => [...prev, `Erro ao salvar: ${upsertError.message}`]);
        } else {
          setNotifications(prev => [...prev, 'Cardápio atualizado com sucesso!']);
        }
      }
    } catch (error: any) {
      console.error('Unexpected error in handleUpdateProducts:', error);
      setNotifications(prev => [...prev, `Erro inesperado: ${error.message}`]);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  const selectedTable = state.tables.find(t => t.id === selectedTableId);

  return (
    <div className="flex flex-col h-[100dvh] bg-zinc-950 font-sans text-zinc-300 overflow-hidden">
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      {!showSplash && (
        <>
          {/* Notifications */}
          <div className="fixed top-safe left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none mt-4">
            {notifications.map((msg, idx) => (
              <div key={idx} className="bg-amber-500 text-zinc-950 px-4 py-3 rounded-2xl font-bold shadow-lg shadow-amber-500/20 flex items-center gap-3 animate-in slide-in-from-top-full fade-in duration-300">
                <Bell className="w-5 h-5" />
                {msg}
              </div>
            ))}
          </div>

          {!user ? (
            <AuthView />
          ) : profile?.role === 'admin' && !storeId ? (
            <AdminDashboard onSelectStore={setStoreId} />
          ) : (
            <main className="flex-1 flex flex-col overflow-hidden relative">
              {profile?.role === 'admin' && storeId && (
                <button
                  onClick={() => setStoreId(null)}
                  className="absolute top-4 left-4 z-40 bg-zinc-900/80 backdrop-blur-md p-2 rounded-xl border border-zinc-800 text-amber-500 text-xs font-bold"
                >
                  ← Painel Admin
                </button>
              )}
              {(profile?.role === 'waiter' || profile?.role === 'admin') && (
                <>
                  {currentView === 'settings' ? (
                    <SettingsView
                      products={state.products}
                      onUpdateProducts={handleUpdateProducts}
                      onLogout={logout}
                    />
                  ) : selectedTable ? (
                    <TableDetail
                      table={selectedTable}
                      products={state.products}
                      onUpdateTable={(updatedTable) => {
                        // Update local state eagerly for snappy UI
                        setState(prev => ({
                          ...prev,
                          tables: prev.tables.map(t => t.id === updatedTable.id ? updatedTable : t)
                        }));
                        // Persist draft to Supabase
                        supabase.from('tables').update({
                          current_orders: updatedTable.orders,
                          service_charge: updatedTable.serviceCharge
                        }).eq('id', updatedTable.id).then();
                      }}
                      onCloseTable={async (tableId) => {
                        await supabase.from('tables').update({ status: 'closing' }).eq('id', tableId);
                        setSelectedTableId(null);
                      }}
                      onBack={() => setSelectedTableId(null)}
                      onSendToKitchen={async (order) => {
                        // 1. Create order
                        const { data: orderData, error: orderError } = await supabase.from('orders').insert({
                          store_id: storeId,
                          table_id: order.tableId,
                          table_number: order.tableNumber,
                          status: 'pending',
                          total_amount: 0 // Will update or calculate later
                        }).select().single();

                        if (orderError) return;

                        // 2. Add items
                        const orderItems = order.items.map(item => {
                          const product = state.products.find(p => p.id === item.productId);
                          return {
                            order_id: orderData.id,
                            product_id: item.productId,
                            quantity: item.quantity,
                            unit_price: product?.price || 0
                          };
                        });

                        await supabase.from('order_items').insert(orderItems);

                        // 3. Update table sentItems and status
                        const table = state.tables.find(t => t.id === order.tableId);
                        const newSentItems = { ...(table?.sentItems || {}) };
                        order.items.forEach(item => {
                          newSentItems[item.productId] = (newSentItems[item.productId] || 0) + item.quantity;
                        });

                        await supabase.from('tables').update({
                          sent_items: newSentItems,
                          status: 'occupied'
                        }).eq('id', order.tableId);
                      }}
                      onPay={async (tableId) => {
                        // 1. Mark orders as completed
                        await supabase.from('orders').update({ status: 'completed' }).eq('table_id', tableId).neq('status', 'completed');

                        // 2. Reset table
                        await supabase.from('tables').update({
                          current_orders: [],
                          sent_items: {},
                          status: 'available',
                          service_charge: true
                        }).eq('id', tableId);

                        setSelectedTableId(null);
                        setNotifications(prev => [...prev, "Pagamento realizado com sucesso!"]);
                      }}
                    />
                  ) : (
                    <TablesView
                      tables={state.tables}
                      onSelectTable={(id) => {
                        console.log('Selecting table:', id);
                        setSelectedTableId(id);
                      }}
                      onAddTable={handleAddTable}
                    />
                  )}
                  {!selectedTable && (
                    <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
                  )}
                </>
              )}

              {profile?.role === 'kitchen' && (
                <KitchenView
                  orders={state.kitchenOrders}
                  products={state.products}
                  onMarkReady={async (orderId) => {
                    await supabase.from('orders').update({ status: 'ready' }).eq('id', orderId);
                  }}
                  onLogout={logout}
                />
              )}

              {profile?.role === 'manager' && (
                <ManagerView
                  products={state.products}
                  tables={state.tables}
                  kitchenOrders={state.kitchenOrders}
                  storeId={storeId || ''}
                  storeName={profile.store_name || 'Minha Loja'}
                  onLogout={logout}
                />
              )}
            </main>
          )}
        </>
      )}
    </div>
  );
}
