import { useEffect } from 'react';
import { motion } from 'motion/react';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-900 z-50 flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 2.5 }}
    >
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 blur-[120px] rounded-full" />
      
      <motion.div 
        className="relative flex flex-col items-center justify-center w-full max-w-sm px-8"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ 
          duration: 1, 
          ease: [0.16, 1, 0.3, 1], // Custom cubic-bezier for a more premium feel
          delay: 0.2
        }}
      >
        <img 
          src="/logo.png" 
          alt="Esquina do Espeto Logo" 
          className="w-full h-auto object-contain drop-shadow-[0_0_30px_rgba(245,158,11,0.3)]"
          referrerPolicy="no-referrer"
        />
        
        {/* Optional: Add a subtle loading or brand text if desired, but for now just the logo */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.8, duration: 1 }}
           className="mt-8 text-zinc-500 text-xs tracking-[0.3em] uppercase font-light"
        >
          Carregando...
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
