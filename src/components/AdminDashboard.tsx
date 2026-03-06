import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, LogOut, Store, Plus, Users, Edit3, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { UserManagement } from './UserManagement';
import { ImageCropper } from './ImageCropper';

interface AdminDashboardProps {
    onSelectStore: (storeId: string) => void;
}

export function AdminDashboard({ onSelectStore }: AdminDashboardProps) {
    const { logout } = useAuth();
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [managingUsersStore, setManagingUsersStore] = useState<{ id: string, name: string } | null>(null);
    const [editingLogoStore, setEditingLogoStore] = useState<{ id: string } | null>(null);
    const [showAddStoreModal, setShowAddStoreModal] = useState(false);
    const [newStoreName, setNewStoreName] = useState('');
    const [creatingStore, setCreatingStore] = useState(false);

    useEffect(() => {
        fetchStores();
    }, []);

    async function fetchStores() {
        const { data, error } = await supabase
            .from('stores')
            .select('*')
            .order('created_at', { ascending: true });

        if (!error) setStores(data);
        setLoading(false);
    }

    const handleLogoUpload = async (croppedImageBase64: string) => {
        if (!editingLogoStore) return;

        try {
            const fileName = `${editingLogoStore.id}-${Date.now()}.jpg`;
            const base64Data = croppedImageBase64.split(',')[1];
            const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());

            const { error: uploadError } = await supabase.storage
                .from('store-logos')
                .upload(fileName, blob, {
                    contentType: 'image/jpeg',
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('store-logos')
                .getPublicUrl(fileName);

            const { error: updateError } = await supabase
                .from('stores')
                .update({ logo_url: publicUrl })
                .eq('id', editingLogoStore.id);

            if (updateError) throw updateError;

            await fetchStores();
            setEditingLogoStore(null);
        } catch (error) {
            console.error('Error uploading logo:', error);
            alert('Erro ao enviar logo. Tente novamente.');
        }
    };
    const handleCreateStore = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStoreName.trim()) return;

        setCreatingStore(true);
        try {
            const { data, error } = await supabase
                .from('stores')
                .insert({ name: newStoreName.trim() })
                .select()
                .single();

            if (error) throw error;

            await fetchStores();
            setShowAddStoreModal(false);
            setNewStoreName('');
        } catch (error) {
            console.error('Error creating store:', error);
            alert('Erro ao criar loja. Tente novamente.');
        } finally {
            setCreatingStore(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950">
            <header className="bg-zinc-900/50 p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <LayoutDashboard className="text-zinc-950 w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-zinc-100">Painel Administrativo</h1>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest">Multi-loja</p>
                    </div>
                </div>
                <button
                    onClick={() => logout()}
                    className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all"
                >
                    <LogOut className="w-5 h-5 text-zinc-400" />
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stores.map((store) => (
                        <button
                            key={store.id}
                            onClick={() => onSelectStore(store.id)}
                            className="group bg-zinc-900 border border-zinc-800 p-6 rounded-3xl text-left hover:border-amber-500/50 hover:bg-zinc-800/50 transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                {store.logo_url ? (
                                    <img src={store.logo_url} alt="" className="w-24 h-24 object-cover rounded-2xl" />
                                ) : (
                                    <Store className="w-24 h-24" />
                                )}
                            </div>
                            <div className="flex flex-col gap-4 relative z-10">
                                <div className="flex justify-between items-start">
                                    <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center group-hover:bg-amber-500 group-hover:text-zinc-950 transition-all overflow-hidden border border-zinc-800">
                                        {store.logo_url ? (
                                            <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Store className="w-8 h-8" />
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingLogoStore({ id: store.id });
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-amber-500 rounded-xl transition-all text-xs font-bold border border-zinc-700"
                                        title="Alterar Logo"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        Logo do restaurante
                                    </button>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-zinc-100 mb-1">{store.name}</h3>
                                    <p className="text-zinc-500 text-sm">Gerenciar mesas, cozinha e faturamento desta unidade.</p>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-amber-500 font-medium text-sm">
                                        Entrar na Loja
                                        <div className="w-1 h-1 bg-amber-500 rounded-full" />
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setManagingUsersStore({ id: store.id, name: store.name });
                                        }}
                                        className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-400 hover:text-white transition-all flex items-center gap-2 text-xs font-bold"
                                    >
                                        <Users className="w-4 h-4" />
                                        Usuários
                                    </button>
                                </div>
                            </div>
                        </button>
                    ))}

                    <AnimatePresence>
                        {managingUsersStore && (
                            <UserManagement
                                storeId={managingUsersStore.id}
                                storeName={managingUsersStore.name}
                                onClose={() => setManagingUsersStore(null)}
                            />
                        )}
                        {editingLogoStore && (
                            <ImageCropper
                                onCropComplete={handleLogoUpload}
                                onCancel={() => setEditingLogoStore(null)}
                            />
                        )}
                    </AnimatePresence>

                    {/* New Store Button */}
                    <button
                        onClick={() => setShowAddStoreModal(true)}
                        className="bg-zinc-900/30 border-2 border-dashed border-zinc-800 p-8 rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-amber-500/50 hover:bg-zinc-800/20 transition-all text-zinc-500 hover:text-amber-500 group"
                    >
                        <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center group-hover:bg-amber-500 group-hover:text-zinc-950 transition-all">
                            <Plus className="w-8 h-8" />
                        </div>
                        <span className="font-bold text-sm uppercase tracking-widest">Adicionar Nova Loja</span>
                    </button>
                </div>
            </main>

            {/* Add Store Modal */}
            <AnimatePresence>
                {showAddStoreModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-zinc-100 italic">Nova Unidade</h2>
                                        <p className="text-zinc-500 text-xs">A estrutura será gerada automaticamente</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowAddStoreModal(false);
                                        setNewStoreName('');
                                    }}
                                    className="p-2 hover:bg-zinc-800 rounded-xl transition-all"
                                >
                                    <X className="w-6 h-6 text-zinc-500" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateStore} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Nome da Loja</label>
                                    <input
                                        autoFocus
                                        value={newStoreName}
                                        onChange={(e) => setNewStoreName(e.target.value)}
                                        placeholder="ex: Esquina do Centro"
                                        className="w-full bg-zinc-800 border-none rounded-2xl py-4 px-6 text-zinc-100 placeholder:text-zinc-700 focus:ring-2 focus:ring-amber-500 transition-all outline-none text-lg font-bold"
                                        required
                                    />
                                </div>

                                <div className="flex flex-col gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={creatingStore || !newStoreName.trim()}
                                        className="bg-zinc-100 hover:bg-white text-zinc-950 font-black py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {creatingStore ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            "CRIAR LOJA AGORA"
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddStoreModal(false)}
                                        className="text-zinc-500 text-xs font-bold py-2 hover:text-zinc-400"
                                    >
                                        CANCELAR
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
