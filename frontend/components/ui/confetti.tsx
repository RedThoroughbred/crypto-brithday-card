'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

export function Confetti({ active, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{ id: number; color: string; left: number; delay: number }>>([]);

  useEffect(() => {
    if (active) {
      // Generate confetti particles
      const newParticles = Array.from({ length: 150 }).map((_, i) => ({
        id: i,
        color: ['#00ffff', '#64ffda', '#ff6b9d', '#ffd93d', '#6bcf7c'][Math.floor(Math.random() * 5)],
        left: Math.random() * 100,
        delay: Math.random() * 1,
      }));
      setParticles(newParticles);

      // Clear confetti after animation
      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [active, onComplete]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            backgroundColor: particle.color,
            left: `${particle.left}%`,
            top: '-20px',
          }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{
            y: window.innerHeight + 20,
            rotate: 720,
            opacity: 0,
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: particle.delay,
            ease: [0.12, 0, 0.39, 0.01],
          }}
        />
      ))}
    </div>
  );
}

// Floating celebration elements
export function FloatingGifts() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-16 h-16 text-cyan-500/20"
          style={{
            left: `${20 + i * 15}%`,
            top: `${10 + i * 10}%`,
          }}
          animate={{
            y: [-20, -40, -20],
            rotate: [-5, 5, -5],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 12h-3.17l-1.24-1.35A5.02 5.02 0 0 0 14 9c-1.3 0-2.48.5-3.35 1.3l-.92 1.02L8.5 9.5C8.5 8.67 7.83 8 7 8s-1.5.67-1.5 1.5V12H2v9h20v-9zm-2 7H4v-5h2v1c0 .83.67 1.5 1.5 1.5S9 15.83 9 15v-1h2v1c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-1h2v1c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-1h2v5z" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}