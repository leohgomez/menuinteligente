import { useEffect } from 'react';
import { motion } from 'motion/react';

export function SplashScreen({ onComplete, logoUrl }: { onComplete: () => void, logoUrl?: string | null }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 2.5 }}
    >
      <motion.div
        className="relative flex flex-col items-center justify-center w-full max-w-lg px-8"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{
          duration: 1,
          ease: [0.16, 1, 0.3, 1],
          delay: 0.2
        }}
      >
        {logoUrl ? (
          <div className="w-72 h-72 flex items-center justify-center mb-12">
            <img
              src={logoUrl}
              alt="Restaurant Logo"
              className="max-w-full max-h-full object-contain drop-shadow-[0_0_50px_rgba(255,255,255,0.1)]"
            />
          </div>
        ) : (
          <div className="w-72 h-72 flex items-center justify-center mb-12">
            <img
              src="/app_logo.png"
              alt="App Logo"
              className="max-w-full max-h-full object-contain drop-shadow-[0_0_50px_rgba(255,255,255,0.1)]"
            />
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="text-zinc-600 text-xs tracking-[0.4em] uppercase font-bold"
        >
          Carregando...
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
