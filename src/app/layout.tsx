import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/store/StoreProvider';
import { ToastContainer } from '@/components/ui/ToastContainer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

import { prisma } from '@/lib/db';

export async function generateMetadata(): Promise<Metadata> {
  let brand: any = null;
  try {
    const brandSettings = await prisma.websiteSettings.findUnique({
      where: { key: 'BRAND_INFO' }
    });
    brand = brandSettings?.value as any;
  } catch (e) {
    console.error('Failed to load metadata brand settings', e);
  }

  const title = brand?.nameAlt || 'Metaphoric Architect | Dhaka';
  const description = brand?.studioDesc || 'Metaphoric Architect is a Dhaka-based firm delivering architecture, design, planning, construction & consulting services across Bangladesh.';
  const favicon = brand?.faviconUrl || '/favicon.ico';

  return {
    title,
    description,
    keywords: [
      'metaphoric architect',
      'architecture dhaka',
      'interior design',
      'planning',
      'construction',
      'consulting'
    ],
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon
    }
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body
        className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-900"
        suppressHydrationWarning
      >
        <StoreProvider>
          {children}
          {/* Global toast notifications — powered by Redux UI slice */}
          <ToastContainer />
        </StoreProvider>
      </body>
    </html>
  );
}
