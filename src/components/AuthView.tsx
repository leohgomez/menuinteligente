import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export function AuthView() {
    const { login, signUp } = useAuth();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const { error: loginError } = await login(identifier, password);

        if (loginError) {
            setError('Credenciais inválidas. Verifique seu usuário/email e senha.');
        }
        setLoading(false);
    };

    const handleInitAdmin = async () => {
        setLoading(true);
        setError(null);
        const { error: signUpError } = await signUp('admin@system.local', 'Skinboard185!', 'admin', 'admin');

        if (signUpError) {
            if (signUpError.message.includes('already registered')) {
                setError('O usuário admin já existe. Tente fazer login normalmente.');
            } else {
                setError(`Erro ao inicializar: ${signUpError.message}`);
            }
        } else {
            setSuccess('Usuário admin criado com sucesso! Agora tente entrar.');
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-6 bg-zinc-950">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl"
            >
                <div className="flex flex-col items-center mb-10">
                    <motion.img
                        src="/app_logo.png"
                        alt="Menu Inteligente Logo"
                        className="w-48 h-auto mb-6 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                    <h2 className="text-3xl font-black text-zinc-100 tracking-tighter">Entrar</h2>
                    <p className="text-zinc-500 text-sm mt-2 font-medium">Acesse o painel do restaurante</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Usuário ou Email"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="w-full bg-zinc-800 border-none rounded-2xl py-4 pl-12 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:ring-2 focus:ring-amber-500/50 transition-all outline-none"
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                        <input
                            type="password"
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-zinc-800 border-none rounded-2xl py-4 pl-12 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:ring-2 focus:ring-amber-500/50 transition-all outline-none"
                            required
                        />
                    </div>

                    {error && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-2xl text-sm border border-red-400/20">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                {error}
                            </div>
                            {error.includes('inválidas') && (
                                <button
                                    type="button"
                                    onClick={handleInitAdmin}
                                    className="text-amber-500 text-xs hover:underline text-center"
                                >
                                    Não consegue entrar? Clique aqui para inicializar a conta admin.
                                </button>
                            )}
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 text-green-400 bg-green-400/10 p-4 rounded-2xl text-sm border border-green-400/20">
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`mt-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {loading ? 'Processando...' : 'Entrar'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
