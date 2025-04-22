import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Resume Parser',
  description: 'Parse and analyze resumes with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="text-xl font-bold">
                Resume Parser
              </Link>
              <Link 
                href="/all-resumes" 
                className="text-sm font-medium hover:text-primary/80 transition-colors"
              >
                View All Resumes
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}