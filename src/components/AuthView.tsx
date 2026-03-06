import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, User, Lock, AlertCircle, Download, Share, Plus, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';

function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
    const [showPrompt, setShowPrompt] = React.useState(false);
    const [platform, setPlatform] = React.useState<'android' | 'ios' | 'other'>('other');

    React.useEffect(() => {
        const ua = navigator.userAgent;
        const isIos = /iPad|iPhone|iPod/.test(ua);
        const isAndroid = /Android/.test(ua);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

        setPlatform(isIos ? 'ios' : isAndroid ? 'android' : 'other');

        // Show prompt for testing or if on mobile and not standalone
        if (!isStandalone) {
            setShowPrompt(true);
        }

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            alert('Para instalar: Clique nos três pontinhos (⋮) do navegador e selecione "Instalar aplicativo" ou "Adicionar à tela inicial".');
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowPrompt(false);
        }
    };

    if (!showPrompt) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] shadow-xl w-full max-w-md border-t-amber-500/20"
        >
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl p-2 shrink-0 shadow-inner">
                    <img src="/app_logo.png" alt="App Logo" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                    <h3 className="text-zinc-100 font-bold text-base tracking-tight">Instalar Aplicativo</h3>
                    <p className="text-zinc-500 text-xs mt-0.5">Tenha o Menu Inteligente na sua tela inicial</p>
                </div>
            </div>

            {platform === 'android' ? (
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleInstallClick}
                        className="w-full mt-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-amber-500/20"
                    >
                        <Download className="w-4 h-4" />
                        Instalar Agora
                    </button>
                    {!deferredPrompt && (
                        <p className="text-[10px] text-zinc-600 text-center px-4 italic">
                            Se o botão não funcionar, use o menu (⋮) do Chrome e selecione "Instalar aplicativo".
                        </p>
                    )}
                </div>
            ) : platform === 'ios' ? (
                <div className="mt-4 p-4 bg-zinc-800/80 rounded-2xl border border-zinc-700/50 text-xs text-zinc-300 leading-relaxed shadow-inner">
                    <div className="flex items-start gap-3">
                        <div className="bg-zinc-700 p-1.5 rounded-lg shrink-0">
                            <Share className="w-4 h-4 text-zinc-100" />
                        </div>
                        <p>Toque no botão de <strong>Compartilhar</strong> abaixo na barra do Safari.</p>
                    </div>
                    <div className="flex items-start gap-3 mt-3">
                        <div className="bg-zinc-700 p-1.5 rounded-lg shrink-0">
                            <Plus className="w-4 h-4 text-zinc-100" />
                        </div>
                        <p>Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</p>
                    </div>
                </div>
            ) : (
                <div className="mt-4 p-4 bg-zinc-800/30 rounded-2xl border border-zinc-800/50 text-center">
                    <p className="text-xs text-zinc-500">Acesse pelo celular para instalar o atalho na tela inicial.</p>
                </div>
            )}

            <button
                onClick={() => setShowPrompt(false)}
                className="w-full mt-3 text-zinc-600 text-[10px] font-bold hover:text-zinc-400 transition-colors uppercase tracking-widest"
            >
                Agora não
            </button>
        </motion.div>
    );
}

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
        <div className="flex flex-col items-center justify-start min-h-full py-12 pt-16 px-6 bg-zinc-950 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl overflow-hidden"
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

                <div className="mt-8 pt-8 border-t border-zinc-800/50">
                    <a
                        href="https://wa.me/5521969814421"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-amber-500 border border-zinc-800 hover:border-amber-500/30 transition-all group"
                    >
                        <MessageCircle className="w-5 h-5 transition-transform group-hover:scale-110" />
                        <span className="text-sm font-bold tracking-tight">Suporte Técnico</span>
                    </a>
                    <p className="text-[10px] text-zinc-600 text-center mt-3 uppercase tracking-widest font-black opacity-50">
                        Esquina do Espeto © 2024
                    </p>
                </div>
            </motion.div>

            <InstallPrompt />
        </div>
    );
}
