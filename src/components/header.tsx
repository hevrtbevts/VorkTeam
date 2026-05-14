
'use client';

import { useRouter } from 'next/navigation';
import {
  LogOut,
  Shield,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { ThemeToggle } from './theme-toggle';
import { NotificationBell } from './NotificationBell';

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  
  return (
    <div className="flex items-center gap-4">
      {user && <NotificationBell userId={user.id} />}
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="overflow-hidden rounded-full w-8 h-8"
          >
            <Image
              src={user?.avatarUrl || `https://placehold.co/30x30.png`}
              width={30}
              height={30}
              alt="Avatar"
              className="overflow-hidden rounded-full"
              data-ai-hint="user avatar"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user?.name || 'My Account'}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/profile')}>Profile</DropdownMenuItem>
           {user?.role === 'admin' && (
            <DropdownMenuItem onClick={() => router.push('/admin')}>
              <Shield className="mr-2 h-4 w-4" />
              Admin Panel
            </DropdownMenuItem>
          )}
          <DropdownMenuItem disabled>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
