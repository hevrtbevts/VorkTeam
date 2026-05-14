
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Compass, Wrench, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/clienthub', icon: Users, label: 'Client Hub' },
  { href: '/explore', icon: Compass, label: 'Explore' },
  { href: '/tools', icon: Wrench, label: 'Tools' },
  { href: '/profile', icon: UserCircle, label: 'Profile' },
];

export function BottomNavbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const isAdminPage = pathname.startsWith('/admin');
  if (isAdminPage || !user) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center sm:hidden px-4">
      <nav className="bg-card backdrop-blur-sm border border-border/20 rounded-full shadow-lg p-2">
          <div className="flex items-center justify-center gap-1 relative">
              {navItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);

                  return (
                      <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                              'relative flex items-center justify-center transition-colors h-10 px-4 rounded-full z-10',
                              'focus:outline-none',
                              isActive ? 'text-card-foreground-dark' : 'text-muted-foreground'
                          )}
                          aria-label={item.label}
                      >
                         {isActive && (
                            <motion.div
                                layoutId="active-nav-item"
                                className="absolute inset-0 h-full bg-card-dark rounded-full"
                                style={{ 
                                    borderRadius: 9999,
                                }}
                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                         )}

                          <item.icon className='h-5 w-5 shrink-0 z-10' />
                          <AnimatePresence>
                            {isActive && (
                               <motion.span
                                    initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                                    animate={{ opacity: 1, width: 'auto', marginLeft: '0.5rem' }}
                                    exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                                    className="text-sm whitespace-nowrap overflow-hidden z-10"
                                >
                                    {item.label}
                               </motion.span>
                            )}
                          </AnimatePresence>
                      </Link>
                  )
              })}
          </div>
      </nav>
    </div>
  );
}
