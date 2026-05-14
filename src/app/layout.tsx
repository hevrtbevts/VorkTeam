
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import Script from 'next/script';
import InstallPrompt from '@/components/InstallPrompt';


export const metadata: Metadata = {
  title: 'Team Rewang',
  description: 'CRM for High-Performing Sales Teams',
  manifest: '/manifest.json',
  icons: {
    icon: '/app-logo.png',
    apple: '/app-logo.png',
  }
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body className="bg-background text-foreground">
        <Providers>
          {children}
          <InstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
