
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only set to visible if on the dashboard page
      if (pathname === '/dashboard') {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [pathname]);

  useEffect(() => {
    // If user navigates away from dashboard, hide the prompt
    if (pathname !== '/dashboard' && isVisible) {
      setIsVisible(false);
    }
  }, [pathname, isVisible]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isVisible) {
      timer = setTimeout(() => {
        setIsVisible(false);
      }, 10000); // Hide after 10 seconds
    }
    return () => clearTimeout(timer);
  }, [isVisible]);


  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    
    // Hide the custom prompt first
    setIsVisible(false);
    
    // Show the browser's install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    await deferredPrompt.userChoice;
    
    // The prompt can't be used again, so clear it
    setDeferredPrompt(null);
  };

  return (
    <AnimatePresence>
      {isVisible && pathname === '/dashboard' && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            "fixed z-50 p-4 bg-card border rounded-lg shadow-lg flex items-center gap-4",
            "top-4 left-1/2 -translate-x-1/2",
            "sm:bottom-4 sm:right-4 sm:top-auto sm:left-auto sm:translate-x-0"
          )}
        >
          <span className="text-sm font-medium">📲 Install aplikasi ini?</span>
          <Button onClick={handleInstallClick} size="sm">
            Install
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
