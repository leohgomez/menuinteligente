import React, { useState } from 'react';
import { X, Lock, Loader2, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

interface DataResetModalProps {
    storeId: string;
    onClose: () => void;
    onSuccess: () => void;
}

type ResetRange = 'day' | 'month' | 'year' | 'all';

export function DataResetModal({ storeId, onClose, onSuccess }: DataResetModalProps) {
    const [password, setPassword] = useState('');
    const [range, setRange] = useState<ResetRange>('day');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();

        const confirms = [
            `Tem certeza que deseja apagar os dados de faturamento do(a) ${range === 'day' ? 'DIA' : range === 'month' ? 'MÊS' : range === 'year' ? 'ANO' : 'TODO O HISTÓRICO'}?`,
            "Esta ação é IRREVERSÍVEL. Deseja continuar?"
        ];

        for (const msg of confirms) {
            if (!confirm(msg)) return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Sessão expirada. Por favor, faça login novamente.');

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
                },
                body: JSON.stringify({ storeId, password, range })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Erro ao resetar dados');

            setSuccess('Dados resetados com sucesso!');
            onSuccess();
            setTimeout(onClose, 2000);
        } catch (err: any) {
            setError(err.message || 'Erro ao processar solicitação');
        } finally {
            setLoading(false);
        }
    };

    const rangeLabels: Record<ResetRange, string> = {
        day: 'Hoje (Dia Atual)',
        month: 'Mês Atual',
        year: 'Ano Atual',
        all: 'Todo o Histórico'
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-zinc-900 border border-red-500/20 w-full max-w-md rounded-[2.5rem] shadow-2xl p-8"
            >
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-500/10 p-2 rounded-xl">
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-100 italic">Resetar Dados</h2>
                            <p className="text-zinc-500 text-xs">Zona de Perigo: Ação Irreversível</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl transition-all">
                        <X className="w-6 h-6 text-zinc-500" />
                    </button>
                </div>

                <form onSubmit={handleReset} className="flex flex-col gap-6">
                    {(error || success) && (
                        <div className="animate-in fade-in zoom-in duration-200">
                            {error && (
                                <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-2xl text-xs border border-red-400/20">
                                    <AlertTriangle className="w-4 h-4" /> {error}
                                </div>
                            )}
                            {success && (
                                <div className="flex items-center gap-2 text-green-400 bg-green-400/10 p-4 rounded-2xl text-xs border border-green-400/20">
                                    <CheckCircle2 className="w-4 h-4" /> {success}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Selecione o Período</label>
                        <div className="grid grid-cols-1 gap-2">
                            {(['day', 'month', 'year', 'all'] as ResetRange[]).map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRange(r)}
                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${range === r
                                        ? 'bg-red-500/10 border-red-500/50 text-red-500'
                                        : 'bg-zinc-800/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                                        }`}
                                >
                                    <span className="text-sm font-bold">{rangeLabels[r]}</span>
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${range === r ? 'border-red-500 bg-red-500' : 'border-zinc-700'}`}>
                                        {range === r && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Sua Senha de Gerente</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                            <input
                                type="password"
                                placeholder="Confirme sua senha para validar"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-zinc-800 border-none rounded-2xl py-4 pl-11 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:ring-2 focus:ring-red-500 transition-all outline-none text-sm"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            type="submit"
                            disabled={loading || !!success || !password}
                            className="bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><RotateCcw className="w-5 h-5" /> EXCLUIR DADOS DEFINITIVAMENTE</>}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="text-zinc-500 text-[10px] font-bold hover:text-zinc-400 transition-colors uppercase tracking-widest py-2"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
