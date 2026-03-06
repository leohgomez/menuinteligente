import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Trash2, Shield, ChefHat, Users, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface UserManagementProps {
    storeId: string;
    storeName: string;
    onClose: () => void;
}

export function UserManagement({ storeId, storeName, onClose }: UserManagementProps) {
    const { signUp } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    // Form state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'manager' | 'kitchen' | 'waiter'>('waiter');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, [storeId]);

    async function fetchUsers() {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('store_id', storeId);

        if (!error) setUsers(data || []);
        setLoading(false);
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError(null);
        setSuccess(null);

        // Create a virtual email for the user
        const email = `${username.trim().toLowerCase()}@system.local`;

        const { error: signUpError } = await signUp(email, password, username, role, storeId);

        if (signUpError) {
            setError(signUpError.message);
        } else {
            setSuccess(`Usuário ${username} criado com sucesso!`);
            setUsername('');
            setPassword('');
            fetchUsers();
        }
        setCreating(false);
    };

    const handleDeleteUser = async (profileId: string) => {
        // In a real app, we'd also delete from auth.users via an edge function
        // For now, we'll just remove the profile link
        const { error } = await supabase.from('profiles').delete().eq('id', profileId);
        if (!error) fetchUsers();
    };

    const roleIcons = {
        manager: <Shield className="w-4 h-4" />,
        kitchen: <ChefHat className="w-4 h-4" />,
        waiter: <Users className="w-4 h-4" />,
    };

    const roleLabels = {
        manager: 'Gerente',
        kitchen: 'Cozinha',
        waiter: 'Atendente',
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-100 italic">Usuários: {storeName}</h2>
                        <p className="text-zinc-500 text-xs">Gerencie quem acessa esta unidade</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl transition-all">
                        <X className="w-6 h-6 text-zinc-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 scrollbar-hide">
                    {/* Create User Form */}
                    <section>
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4" /> Novo Acesso
                        </h3>
                        <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-800/30 p-4 rounded-3xl border border-zinc-800">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-zinc-500 ml-2">Username</label>
                                <input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="ex: joao_esquina"
                                    className="bg-zinc-800 text-white rounded-2xl p-3 border-none focus:ring-2 focus:ring-amber-500 transition-all outline-none text-sm"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-zinc-500 ml-2">Senha</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Senha forte"
                                    className="bg-zinc-800 text-white rounded-2xl p-3 border-none focus:ring-2 focus:ring-amber-500 transition-all outline-none text-sm"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1 sm:col-span-2">
                                <label className="text-xs text-zinc-500 ml-2">Cargo / Permissão</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['waiter', 'kitchen', 'manager'] as const).map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setRole(r)}
                                            className={`py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${role === r
                                                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                                }`}
                                        >
                                            {roleIcons[r]} {roleLabels[r]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="sm:col-span-2 flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-2xl text-xs border border-red-400/20 animate-in fade-in zoom-in duration-200">
                                    <AlertCircle className="w-4 h-4" /> {error}
                                </div>
                            )}

                            {success && (
                                <div className="sm:col-span-2 flex items-center gap-2 text-green-400 bg-green-400/10 p-3 rounded-2xl text-xs border border-green-400/20 animate-in fade-in zoom-in duration-200">
                                    <CheckCircle2 className="w-4 h-4" /> {success}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={creating}
                                className="sm:col-span-2 mt-2 bg-zinc-100 hover:bg-white text-zinc-950 font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                Criar Usuário
                            </button>
                        </form>
                    </section>

                    {/* User List */}
                    <section>
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Usuários Ativos</h3>
                        <div className="flex flex-col gap-3">
                            {loading ? (
                                <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 text-zinc-700 animate-spin" /></div>
                            ) : users.length === 0 ? (
                                <p className="text-zinc-600 text-center py-8 text-sm italic">Nenhum funcionário cadastrado.</p>
                            ) : (
                                users.map((profile) => (
                                    <div key={profile.id} className="flex justify-between items-center bg-zinc-800/20 p-4 rounded-3xl border border-zinc-800/50 group hover:border-zinc-700 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-amber-500">
                                                {roleIcons[profile.role as keyof typeof roleIcons] || <Users className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <h4 className="text-zinc-100 font-bold text-sm tracking-tight">{profile.username}</h4>
                                                <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest leading-none">
                                                    {roleLabels[profile.role as keyof typeof roleLabels]}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteUser(profile.id)}
                                            className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </motion.div>
        </motion.div>
    );
}
