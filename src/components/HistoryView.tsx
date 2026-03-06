import { useState, useMemo } from 'react';
import { ClipboardList, Users, ChevronRight, Calendar, Search, ArrowLeft, Printer, ShoppingBag, Trash2, Edit, Lock, Loader2 } from 'lucide-react';
import { Table, Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryViewProps {
    tables: Table[];
    products: Product[];
    onLogout: () => void;
    profile?: any;
    user?: any;
    onSelectTable: (id: string) => void;
    onDeleteHistory: (id: string, password: string) => Promise<void>;
    onEditHistory: (id: string, password: string) => Promise<void>;
}

export function HistoryView({ tables, products, onLogout, profile, user, onSelectTable, onDeleteHistory, onEditHistory }: HistoryViewProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
    const [showVerifyModal, setShowVerifyModal] = useState<{ type: 'edit' | 'delete', id: string } | null>(null);
    const [password, setPassword] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter only paid tables
    const paidTables = useMemo(() => {
        return tables
            .filter(t => t.status === 'paid' && t.paidAt)
            .sort((a, b) => new Date(b.paidAt!).getTime() - new Date(a.paidAt!).getTime());
    }, [tables]);

    // Group by date (Day/Month/Year)
    const groupedHistory = useMemo(() => {
        const groups: Record<string, Table[]> = {};

        paidTables.forEach(t => {
            const date = new Date(t.paidAt!).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            if (!groups[date]) groups[date] = [];
            groups[date].push(t);
        });

        return Object.entries(groups).map(([date, items]) => ({
            date,
            items: items.filter(t =>
                t.number.toString().includes(searchTerm) ||
                t.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
            )
        })).filter(group => group.items.length > 0);
    }, [paidTables, searchTerm]);

    const selectedTable = useMemo(() =>
        tables.find(t => t.id === selectedHistoryId),
        [tables, selectedHistoryId]
    );

    const calculateTotal = (table: Table) => {
        const subtotal = Object.entries(table.sentItems).reduce((acc, [productId, quantity]) => {
            const product = products.find(p => p.id === productId);
            return acc + (product?.price || 0) * (quantity as number);
        }, 0);
        return table.serviceCharge ? subtotal * 1.1 : subtotal;
    };

    if (selectedTable) {
        return (
            <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
                {/* Detail Header */}
                <div className="p-6 border-b border-zinc-900 flex items-center gap-4">
                    <button
                        onClick={() => setSelectedHistoryId(null)}
                        className="p-2 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-white">Extrato Mesa {selectedTable.number}</h2>
                        <p className="text-zinc-500 text-xs mt-0.5">
                            {new Date(selectedTable.paidAt!).toLocaleString('pt-BR')}
                        </p>
                    </div>
                </div>

                {/* Detail Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="bg-zinc-900/50 border border-zinc-900 rounded-[2rem] p-6 mb-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                                <ShoppingBag className="w-5 h-5 text-amber-500" />
                            </div>
                            <h3 className="font-bold text-zinc-300">Resumo do Pedido</h3>
                        </div>

                        <div className="space-y-4">
                            {Object.entries(selectedTable.sentItems).map(([productId, quantity]) => {
                                const product = products.find(p => p.id === productId);
                                return (
                                    <div key={productId} className="flex justify-between items-center py-2 border-b border-zinc-800/50 last:border-0">
                                        <div>
                                            <p className="text-white font-medium">{product?.name}</p>
                                            <p className="text-zinc-500 text-xs">{quantity}x R$ {product?.price.toFixed(2)}</p>
                                        </div>
                                        <p className="text-zinc-300 font-bold">R$ {((product?.price || 0) * (quantity as number)).toFixed(2)}</p>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-8 pt-6 border-t border-zinc-800 space-y-3">
                            <div className="flex justify-between text-zinc-500 text-sm">
                                <span>Subtotal</span>
                                <span>R$ {(calculateTotal(selectedTable) / (selectedTable.serviceCharge ? 1.1 : 1)).toFixed(2)}</span>
                            </div>
                            {selectedTable.serviceCharge && (
                                <div className="flex justify-between text-zinc-500 text-sm italic">
                                    <span>Taxa de Serviço (10%)</span>
                                    <span>R$ {(calculateTotal(selectedTable) - (calculateTotal(selectedTable) / 1.1)).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-white text-xl font-black pt-2">
                                <span>TOTAL</span>
                                <span className="text-amber-500 underline decoration-amber-500/20 underline-offset-8">
                                    R$ {calculateTotal(selectedTable).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => window.print()}
                            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
                        >
                            <Printer className="w-5 h-5" />
                            REIMPRIMIR COMPROVANTE
                        </button>

                        {profile?.role === 'admin' && (
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setShowVerifyModal({ type: 'edit', id: selectedTable.id })}
                                    className="bg-zinc-900 border border-zinc-800 text-amber-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-amber-500/10 transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                    RETORNAR MESA
                                </button>
                                <button
                                    onClick={() => setShowVerifyModal({ type: 'delete', id: selectedTable.id })}
                                    className="bg-red-500/10 border border-red-500/20 text-red-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    EXCLUIR
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Password Verification Modal */}
                <AnimatePresence>
                    {showVerifyModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8"
                            >
                                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                                    <Lock className="w-8 h-8 text-amber-500" />
                                </div>

                                <h2 className="text-2xl font-bold text-white mb-2 text-center italic">Confirmar Ação</h2>
                                <p className="text-zinc-500 text-sm mb-6 text-center">Digite sua senha de administrador para prosseguir.</p>

                                <input
                                    type="password"
                                    autoFocus
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError(null);
                                    }}
                                    placeholder="Senha Admin"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-center text-xl text-white placeholder:text-zinc-800 focus:ring-1 focus:ring-amber-500 outline-none mb-2"
                                />

                                {error && <p className="text-red-500 text-xs font-bold text-center mb-4">{error}</p>}

                                <div className="flex flex-col gap-3 mt-4">
                                    <button
                                        disabled={isVerifying}
                                        onClick={async () => {
                                            if (!password) return;
                                            setIsVerifying(true);
                                            try {
                                                if (showVerifyModal.type === 'delete') {
                                                    await onDeleteHistory(showVerifyModal.id, password);
                                                } else {
                                                    await onEditHistory(showVerifyModal.id, password);
                                                }
                                                setShowVerifyModal(null);
                                                setSelectedHistoryId(null);
                                                setPassword('');
                                            } catch (err: any) {
                                                setError(err.message || 'Erro ao verificar senha');
                                            } finally {
                                                setIsVerifying(false);
                                            }
                                        }}
                                        className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-black py-4 rounded-2xl transition-all shadow-lg"
                                    >
                                        {isVerifying ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'CONFIRMAR'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowVerifyModal(null);
                                            setPassword('');
                                            setError(null);
                                        }}
                                        className="text-zinc-600 text-xs font-bold py-2 hover:text-zinc-400"
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

    return (
        <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
            {/* Header */}
            <div className="p-6 pb-2">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center">
                            <ClipboardList className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Histórico</h2>
                            <p className="text-zinc-500 text-xs">Todos os pedidos finalizados</p>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                        type="text"
                        placeholder="Buscar por mesa ou atendente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 pb-32">
                {groupedHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-zinc-900 rounded-[2.5rem] mt-4">
                        <Users className="w-10 h-10 text-zinc-800 mb-4" />
                        <p className="text-zinc-600 text-sm font-medium">Nenhum registro encontrado.</p>
                    </div>
                ) : (
                    groupedHistory.map((group) => (
                        <div key={group.date} className="mt-8 first:mt-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-px flex-1 bg-zinc-900" />
                                <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
                                    <Calendar className="w-3 h-3 text-zinc-500" />
                                    <span className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">{group.date}</span>
                                </div>
                                <div className="h-px flex-1 bg-zinc-900" />
                            </div>

                            <div className="space-y-3">
                                {group.items.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedHistoryId(item.id)}
                                        className="w-full bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800 p-4 rounded-2xl flex items-center justify-between group transition-all active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center font-black text-amber-500">
                                                {item.number}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-white font-bold">Mesa {item.number}</p>
                                                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-tighter">
                                                    {new Date(item.paidAt!).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • Finalizado
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="text-emerald-500 font-black text-sm">R$ {calculateTotal(item).toFixed(2)}</p>
                                            <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
