
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  UserCircle,
  Wrench,
  Compass,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/clienthub', icon: Users, label: 'Client Hub' },
  { href: '/explore', icon: Compass, label: 'Explore' },
];

export function MainSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const isToolsActive = pathname.startsWith('/tools');

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <TooltipProvider>
          {navItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                    (pathname.startsWith(item.href))
                    ? 'bg-accent text-accent-foreground'
                    : ''
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
           <Tooltip>
              <TooltipTrigger asChild>
                 <Link
                  href="/tools"
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                    isToolsActive ? 'bg-accent text-accent-foreground' : ''
                  )}
                >
                  <Wrench className="h-5 w-5" />
                  <span className="sr-only">Tools</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Tools</TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <TooltipProvider>
           <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/profile"
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                    pathname.startsWith('/profile') ? 'bg-accent text-accent-foreground' : ''
                  )}
                >
                  <UserCircle className="h-5 w-5" />
                  <span className="sr-only">Profile</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Profile</TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
  );
}
