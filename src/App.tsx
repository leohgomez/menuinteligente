import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { BottomNav } from './components/BottomNav';
import { SettingsView } from './components/SettingsView';
import { SplashScreen } from './components/SplashScreen';
import { TableDetail } from './components/TableDetail';
import { TablesView } from './components/TablesView';
import { KitchenView } from './components/KitchenView';
import { ManagerView } from './components/ManagerView';
import { HistoryView } from './components/HistoryView';
import { AuthView } from './components/AuthView';
import { AdminDashboard } from './components/AdminDashboard';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import { AppState, KitchenOrder, Product, Table } from './types';
import { Bell, Loader2, Edit2, Trash2, Plus, X, Upload, Save, Settings, BarChart3, ChevronLeft } from 'lucide-react';

export default function App() {
  const { user, profile, loading: authLoading, logout } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<'tables' | 'settings' | 'panorama' | 'history'>('tables');
  const [hasRedirected, setHasRedirected] = useState(false);
  const [storeName, setStoreName] = useState<string>('');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<{ id: string; message: string }[]>([]);
  const [storeId, setStoreId] = useState<string | null>(profile?.store_id || null);

  const addNotification = (message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message }]);
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const [state, setState] = useState<AppState>({
    products: [],
    tables: [],
    kitchenOrders: [],
    storeLogoUrl: null,
  });
  const [categoryNames, setCategoryNames] = useState<string[]>([]);

  useEffect(() => {
    setShowSplash(true);
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      setStoreId(null);
      setHasRedirected(false);
      setCurrentView('tables');
      setState({
        products: [],
        tables: [],
        kitchenOrders: [],
        storeLogoUrl: null
      });
    } else if (profile?.store_id) {
      setStoreId(profile.store_id);
      // Eagerly set logo if available in profile (fetched via AuthContext)
      if (profile.stores?.logo_url) {
        setState(prev => ({ ...prev, storeLogoUrl: profile.stores.logo_url }));
      }
    }
  }, [user?.id, profile]);

  useEffect(() => {
    if (profile?.role === 'manager' && !hasRedirected) {
      setCurrentView('panorama');
      setHasRedirected(true);
    }
  }, [profile, hasRedirected]);

  useEffect(() => {
    if (!storeId) return;

    // Fetch initial data from Supabase
    const fetchData = async () => {
      const [productsData, tablesData, ordersData, categoriesData, storeData] = await Promise.all([
        supabase.from('products').select('*').eq('store_id', storeId),
        supabase.from('tables').select('*').eq('store_id', storeId).is('deleted_at', null),
        supabase.from('orders').select('*, order_items(*)').eq('store_id', storeId).is('deleted_at', null),
        supabase.from('categories').select('*').eq('store_id', storeId),
        supabase.from('stores').select('name, logo_url').eq('id', storeId).single()
      ]);

      if (!productsData.error && !tablesData.error && !ordersData.error && !categoriesData.error && storeData.data) {
        setStoreName(storeData.data.name);
        const cats = (categoriesData.data as any[]);
        const categoryMap = cats.reduce((acc, cat) => {
          acc[cat.id] = cat.name;
          return acc;
        }, {} as Record<string, string>);
        setCategoryNames(cats.map(c => c.name));

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
          readyAt: o.ready_at ? new Date(o.ready_at).getTime() : undefined,
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
            status: t.status as any,
            createdBy: t.created_by,
            paidAt: t.paid_at
          })),
          kitchenOrders,
          storeLogoUrl: storeData.data?.logo_url || null
        }));
      }
    };

    fetchData();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tables',
        filter: `store_id=eq.${storeId}`
      }, (payload) => {
        console.log('Realtime Table Change:', payload);
        fetchData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `store_id=eq.${storeId}`
      }, (payload) => {
        console.log('Realtime Order Change:', payload);
        fetchData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'products',
        filter: `store_id=eq.${storeId}`
      }, () => fetchData())
      .subscribe((status) => {
        console.log('Supabase Realtime Status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  const handleAddTable = async (tableNumber: number) => {
    console.log('Attempting to add table. storeId:', storeId);
    if (!storeId) {
      addNotification("Erro: Loja não identificada. Tente relogar.");
      return;
    }

    const { error } = await supabase.from('tables').insert({
      number: tableNumber,
      store_id: storeId,
      status: 'available',
      created_by: user?.id
    });

    if (error) {
      console.error('Error adding table:', error);
      addNotification(`Erro ao criar mesa: ${error.message}`);
    } else {
      addNotification(`Mesa ${tableNumber} aberta!`);
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
          addNotification(`Erro ao excluir: ${deleteError.message}`);
        }
      }

      // 3. Fetch current categories for this store
      const { data: categoriesData } = await supabase.from('categories').select('*').eq('store_id', storeId);
      let categoryMap: Record<string, string> = {};

      if (categoriesData) {
        categoryMap = categoriesData.reduce((acc, cat) => {
          acc[cat.name] = cat.id;
          return acc;
        }, {} as Record<string, string>);
      }

      // 4. Upsert updated/new products
      const upsertData = [];
      const missingCategoryProducts = [];

      for (const p of productsWithUrls) {
        const category_id = categoryMap[p.category];
        if (!category_id) {
          missingCategoryProducts.push(p.name);
          continue;
        }

        upsertData.push({
          id: p.id,
          store_id: storeId,
          category_id: category_id,
          name: p.name,
          price: p.price,
          image_url: p.imageUrl
        });
      }

      if (missingCategoryProducts.length > 0) {
        console.error('Missing category mapping for:', missingCategoryProducts);
        addNotification(`Erro: Categoria não encontrada para ${missingCategoryProducts.join(', ')}. Tente recarregar a página.`);
        return;
      }

      const { error: upsertError } = await supabase.from('products').upsert(upsertData);

      if (upsertError) {
        console.error('Error updating products:', upsertError);
        addNotification(`Erro ao salvar: ${upsertError.message}`);
      } else {
        addNotification('Cardápio atualizado com sucesso!');
      }
    } catch (error: any) {
      console.error('Unexpected error in handleUpdateProducts:', error);
      addNotification(`Erro inesperado: ${error.message}`);
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
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} logoUrl={state.storeLogoUrl} />}
      </AnimatePresence>

      {!showSplash && (
        <>
          {/* Notifications */}
          <div className="fixed top-safe left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none mt-4">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => removeNotification(n.id)}
                className="pointer-events-auto w-full text-left bg-amber-500 text-zinc-950 px-4 py-3 rounded-2xl font-bold shadow-lg shadow-amber-500/20 flex items-center gap-3 animate-in slide-in-from-top-full fade-in duration-300 active:scale-95 transition-transform"
              >
                <Bell className="w-5 h-5 shrink-0" />
                <span className="flex-1">{n.message}</span>
              </button>
            ))}
          </div>

          {!user ? (
            <AuthView />
          ) : !profile ? (
            <div className="h-screen w-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
              <p className="text-zinc-500 font-medium tracking-wide">Carregando dados da conta...</p>
            </div>
          ) : profile?.role === 'admin' && !storeId ? (
            <AdminDashboard onSelectStore={(id) => {
              setStoreId(id);
              setCurrentView('panorama');
            }} />
          ) : (
            <main className="flex-1 flex flex-col overflow-hidden relative">
              {profile?.role === 'admin' && storeId && (
                <div className="px-4 pt-4 z-40 bg-zinc-950">
                  <button
                    onClick={() => {
                      setStoreId(null);
                      setCurrentView('tables'); // Reset to default for next store
                    }}
                    className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-amber-500 px-3 py-2 rounded-xl transition-all text-[11px] font-bold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Voltar para Lojas
                  </button>
                </div>
              )}
              {(profile?.role === 'waiter' || profile?.role === 'admin' || profile?.role === 'manager') && (
                <>
                  {currentView === 'panorama' ? (
                    <ManagerView
                      products={state.products}
                      tables={state.tables}
                      kitchenOrders={state.kitchenOrders}
                      storeId={storeId || ''}
                      storeName={storeName || profile?.store_name || 'Minha Loja'}
                      storeLogoUrl={state.storeLogoUrl}
                      onLogout={logout}
                    />
                  ) : currentView === 'history' ? (
                    <HistoryView
                      tables={state.tables}
                      products={state.products}
                      onLogout={logout}
                      profile={profile}
                      user={user}
                      onSelectTable={(id) => setSelectedTableId(id)}
                      onDeleteHistory={async (id, password) => {
                        const { error: authError } = await supabase.auth.signInWithPassword({
                          email: profile?.username?.includes('@') ? profile.username : `${profile?.username?.toLowerCase()}@system.local`,
                          password
                        });
                        if (authError) throw new Error("Senha incorreta!");

                        const now = new Date().toISOString();
                        const { error } = await supabase.from('tables').update({ deleted_at: now }).eq('id', id);
                        if (error) throw error;

                        setState(prev => ({
                          ...prev,
                          tables: prev.tables.filter(t => t.id !== id)
                        }));
                        addNotification("Pedido excluído do histórico!");
                      }}
                      onEditHistory={async (id, password) => {
                        const { error: authError } = await supabase.auth.signInWithPassword({
                          email: profile?.username?.includes('@') ? profile.username : `${profile?.username?.toLowerCase()}@system.local`,
                          password
                        });
                        if (authError) throw new Error("Senha incorreta!");

                        // Return table to 'available' and clear paid_at
                        const { error } = await supabase.from('tables').update({
                          status: 'available',
                          paid_at: null
                        }).eq('id', id);

                        if (error) throw error;

                        setState(prev => ({
                          ...prev,
                          tables: prev.tables.map(t => t.id === id ? { ...t, status: 'available', paidAt: undefined } : t)
                        }));

                        setCurrentView('tables');
                        setSelectedTableId(id);
                        addNotification("Mesa reaberta para edição!");
                      }}
                    />
                  ) : currentView === 'settings' ? (
                    <SettingsView
                      products={state.products}
                      categories={categoryNames}
                      onUpdateProducts={handleUpdateProducts}
                      onAddCategory={async (name: string) => {
                        if (!storeId) return false;
                        try {
                          const { error } = await supabase
                            .from('categories')
                            .insert({ name, store_id: storeId });
                          if (error) {
                            if (error.code === '23505') {
                              addNotification('Já existe uma categoria com esse nome.');
                            } else {
                              addNotification(`Erro ao criar categoria: ${error.message}`);
                            }
                            return false;
                          }
                          const { data: newCats } = await supabase
                            .from('categories').select('name').eq('store_id', storeId);
                          if (newCats) setCategoryNames(newCats.map(c => c.name));
                          addNotification(`Categoria "${name}" criada!`);
                          return true;
                        } catch {
                          addNotification('Erro ao criar categoria.');
                          return false;
                        }
                      }}
                      onEditCategory={async (oldName: string, newName: string) => {
                        if (!storeId) return false;
                        try {
                          const { error } = await supabase
                            .from('categories')
                            .update({ name: newName })
                            .eq('store_id', storeId)
                            .eq('name', oldName);
                          if (error) {
                            if (error.code === '23505') {
                              addNotification('Já existe uma categoria com esse nome.');
                            } else {
                              addNotification(`Erro ao renomear categoria: ${error.message}`);
                            }
                            return false;
                          }
                          // Re-fetch categories and products
                          const { data: newCats } = await supabase
                            .from('categories').select('name').eq('store_id', storeId);
                          if (newCats) setCategoryNames(newCats.map(c => c.name));
                          // Update product category names in local state
                          setState(prev => ({
                            ...prev,
                            products: prev.products.map(p =>
                              p.category === oldName ? { ...p, category: newName } : p
                            )
                          }));
                          addNotification(`Categoria renomeada para "${newName}"!`);
                          return true;
                        } catch {
                          addNotification('Erro ao renomear categoria.');
                          return false;
                        }
                      }}
                      onDeleteCategory={async (name: string) => {
                        if (!storeId) return false;
                        try {
                          const { error } = await supabase
                            .from('categories')
                            .delete()
                            .eq('store_id', storeId)
                            .eq('name', name);
                          if (error) {
                            addNotification(`Erro ao excluir categoria: ${error.message}`);
                            return false;
                          }
                          // Re-fetch categories
                          const { data: newCats } = await supabase
                            .from('categories').select('name').eq('store_id', storeId);
                          if (newCats) setCategoryNames(newCats.map(c => c.name));
                          addNotification(`Categoria "${name}" excluída!`);
                          return true;
                        } catch {
                          addNotification('Erro ao excluir categoria.');
                          return false;
                        }
                      }}
                      onLogout={logout}
                      userRole={profile?.role || null}
                      storeLogoUrl={state.storeLogoUrl}
                    />
                  ) : selectedTable ? (
                    <TableDetail
                      table={selectedTable}
                      products={state.products}
                      categories={categoryNames}
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
                        try {
                          // 1. Create order
                          const { data: orderData, error: orderError } = await supabase.from('orders').insert({
                            store_id: storeId,
                            table_id: order.tableId,
                            table_number: order.tableNumber,
                            status: 'pending',
                            total_amount: 0
                          }).select().single();

                          if (orderError) {
                            console.error('Error creating order:', orderError);
                            addNotification(`Erro ao criar pedido: ${orderError.message}`);
                            return;
                          }

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

                          const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

                          if (itemsError) {
                            console.error('Error creating order items:', itemsError);
                            addNotification(`Erro ao adicionar itens: ${itemsError.message}`);
                            return;
                          }

                          // 3. Update table sentItems and status
                          const table = state.tables.find(t => t.id === order.tableId);
                          const newSentItems = { ...(table?.sentItems || {}) };
                          order.items.forEach(item => {
                            newSentItems[item.productId] = (newSentItems[item.productId] || 0) + item.quantity;
                          });

                          const { error: tableError } = await supabase.from('tables').update({
                            sent_items: newSentItems,
                            status: 'sent'
                          }).eq('id', order.tableId);

                          if (tableError) {
                            console.error('Error updating table status:', tableError);
                            addNotification(`Erro ao atualizar mesa: ${tableError.message}`);
                            return;
                          }

                          // 4. Update local state eagerly
                          setState(prev => ({
                            ...prev,
                            tables: prev.tables.map(t => t.id === order.tableId ? { ...t, sentItems: newSentItems, status: 'sent' } : t)
                          }));

                          // 5. Auto-return to dashboard
                          setSelectedTableId(null);
                          addNotification("Pedido enviado para a cozinha!");
                        } catch (err: any) {
                          console.error('Unexpected error in onSendToKitchen:', err);
                          addNotification("Erro inesperado ao enviar pedido.");
                        }
                      }}
                      onMarkDelivered={async (tableId) => {
                        setState(prev => ({
                          ...prev,
                          tables: prev.tables.map(t => t.id === tableId ? { ...t, status: 'delivered' } : t)
                        }));
                        await supabase.from('tables').update({ status: 'delivered' }).eq('id', tableId);
                      }}
                      onDeleteTable={async (tableId, password) => {
                        // 1. Password verification
                        const { error: authError } = await supabase.auth.signInWithPassword({
                          email: profile?.username?.includes('@') ? profile.username : `${profile?.username?.toLowerCase()}@system.local`,
                          password
                        });

                        if (authError) throw new Error("Senha incorreta!");

                        // 2. Soft delete table
                        const now = new Date().toISOString();
                        const { error } = await supabase.from('tables').update({ deleted_at: now }).eq('id', tableId);
                        if (error) throw error;

                        setState(prev => ({
                          ...prev,
                          tables: prev.tables.filter(t => t.id !== tableId)
                        }));
                        setSelectedTableId(null);
                        addNotification("Mesa excluída!");
                      }}
                      userRole={profile?.role}
                      userId={user?.id}
                      onPay={async (tableId) => {
                        const now = new Date().toISOString();
                        // Update local state eagerly
                        setState(prev => ({
                          ...prev,
                          tables: prev.tables.map(t => t.id === tableId ? { ...t, status: 'paid', paidAt: now } : t)
                        }));

                        // 1. Mark orders as completed
                        await supabase.from('orders').update({ status: 'completed' }).eq('table_id', tableId).neq('status', 'completed');

                        // 2. Set as paid with timestamp
                        await supabase.from('tables').update({
                          status: 'paid',
                          paid_at: now
                        }).eq('id', tableId).then();

                        setSelectedTableId(null);
                        addNotification("Pagamento realizado com sucesso!");
                      }}
                    />
                  ) : (
                    <TablesView
                      tables={state.tables}
                      products={state.products}
                      kitchenOrders={state.kitchenOrders}
                      storeLogoUrl={state.storeLogoUrl}
                      onSelectTable={(id) => {
                        console.log('Selecting table:', id);
                        setSelectedTableId(id);
                      }}
                      onAddTable={handleAddTable}
                      onLogout={logout}
                      profile={profile}
                      user={user}
                    />
                  )}
                  {!selectedTable && (
                    <BottomNav
                      currentView={currentView}
                      setCurrentView={setCurrentView}
                      userRole={profile?.role || null}
                    />
                  )}
                </>
              )}

              {profile?.role === 'kitchen' && (
                <KitchenView
                  orders={state.kitchenOrders}
                  products={state.products}
                  onMarkReady={async (orderId) => {
                    const order = state.kitchenOrders.find(o => o.id === orderId);

                    setState(prev => ({
                      ...prev,
                      kitchenOrders: prev.kitchenOrders.map(o => o.id === orderId ? { ...o, status: 'ready', readyAt: Date.now() } : o),
                      tables: order ? prev.tables.map(t => t.id === order.tableId ? { ...t, status: 'ready' } : t) : prev.tables
                    }));

                    const now = new Date().toISOString();
                    await supabase.from('orders').update({
                      status: 'ready',
                      ready_at: now
                    }).eq('id', orderId);
                    if (order) {
                      await supabase.from('tables').update({ status: 'ready' }).eq('id', order.tableId);
                    }
                  }}
                  onLogout={logout}
                  storeLogoUrl={state.storeLogoUrl}
                />
              )}
            </main>
          )}
        </>
      )}
    </div>
  );
}
