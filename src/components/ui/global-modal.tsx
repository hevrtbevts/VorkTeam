
'use client';

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export function GlobalModal({ isOpen, onClose, children, className, showCloseButton = true }: GlobalModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: 50, opacity: 0 },
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            ref={modalRef}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'relative w-full bg-card text-card-foreground shadow-xl',
              'rounded-2xl max-h-[calc(100vh-5rem)] flex flex-col',
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {showCloseButton && (
                <button
                    onClick={onClose}
                    aria-label="Close modal"
                    className="absolute top-3 right-3 z-10 p-2 rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                    <X className="h-5 w-5" />
                </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
