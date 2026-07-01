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

export const metadata: Metadata = {
  title: 'Metaphoric Architect | Dhaka',
  description:
    'Metaphoric Architect, Dhaka. 15,897 likes · 147 talking about this. Architecture | Design | Planning | Construction | Consulting',
  keywords: [
    'metaphoric architect',
    'architecture dhaka',
    'interior design',
    'planning',
    'construction',
    'consulting'
  ],
};

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
