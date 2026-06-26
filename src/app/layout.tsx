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
  title: 'CPMAS — Construction Project Management & Accounting System',
  description:
    'A centralized platform to manage construction projects, track cash flows, manage suppliers, contractors, and employees, and automate profitability calculations.',
  keywords: [
    'construction management',
    'project accounting',
    'ERP',
    'cash flow',
    'profitability',
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
