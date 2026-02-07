import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NeuraFinity | Autonomous Intelligence Engine',
  description: 'Autonomous Intelligence. Enormous Distribution. Absolute Dominance.',
  keywords: ['autonomous agents', 'synthetic workforce', 'cognitive infrastructure', 'agentic ROI'],
  authors: [{ name: 'NeuraFinity' }],
  openGraph: {
    title: 'NeuraFinity | Autonomous Intelligence Engine',
    description: 'Autonomous Intelligence. Enormous Distribution. Absolute Dominance.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <div className="min-h-screen bg-neurafinity-navy">
          {/* Background grid pattern */}
          <div className="fixed inset-0 grid-pattern pointer-events-none" />

          {/* Main content */}
          <main className="relative z-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
