import type { Metadata } from 'next';
import { Nunito_Sans } from 'next/font/google'; // Changed from Geist
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { Toaster } from "@/components/ui/toaster";

const nunitoSans = Nunito_Sans({ // Changed from geistSans
  variable: '--font-nunito-sans', // New variable name
  subsets: ['latin'],
  weight: ['400', '600', '700'] // Added common weights for better typography
});

// Removed geistMono as "All fonts" implies a single family for now.

export const metadata: Metadata = {
  title: 'FreightFlow',
  description: 'Streamline your freight operations',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nunitoSans.variable} antialiased`}> {/* Updated font variable */}
        <AuthProvider>
          <DataProvider>
            {children}
            <Toaster />
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
