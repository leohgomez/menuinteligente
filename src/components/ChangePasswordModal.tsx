import React, { useState } from 'react';
import { X, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface ChangePasswordModalProps {
    onClose: () => void;
}

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
    const { updatePassword } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (newPassword.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setLoading(true);
        const { error: updateError } = await updatePassword(newPassword);

        if (updateError) {
            setError(`Erro ao atualizar: ${updateError.message}`);
        } else {
            setSuccess('Senha alterada com sucesso!');
            setTimeout(onClose, 2000);
        }
        setLoading(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8"
            >
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-100 italic">Alterar Senha</h2>
                        <p className="text-zinc-500 text-xs">Atualize sua credencial de acesso</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl transition-all">
                        <X className="w-6 h-6 text-zinc-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {(error || success) && (
                        <div className="animate-in fade-in zoom-in duration-200">
                            {error && (
                                <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-2xl text-xs border border-red-400/20">
                                    <AlertCircle className="w-4 h-4" /> {error}
                                </div>
                            )}
                            {success && (
                                <div className="flex items-center gap-2 text-green-400 bg-green-400/10 p-4 rounded-2xl text-xs border border-green-400/20">
                                    <CheckCircle2 className="w-4 h-4" /> {success}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                        <input
                            type="password"
                            placeholder="Nova Senha"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-zinc-800 border-none rounded-2xl py-3.5 pl-11 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:ring-2 focus:ring-amber-500 transition-all outline-none text-sm"
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                        <input
                            type="password"
                            placeholder="Confirme a Senha"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-zinc-800 border-none rounded-2xl py-3.5 pl-11 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:ring-2 focus:ring-amber-500 transition-all outline-none text-sm"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !!success}
                        className="mt-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Alteração'}
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-zinc-500 text-[10px] font-bold hover:text-zinc-400 transition-colors uppercase tracking-widest mt-2"
                    >
                        Cancelar
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
}
