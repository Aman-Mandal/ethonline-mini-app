import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { cookieToInitialState } from 'wagmi';
import { config } from '@/config';
import { headers } from 'next/headers';
import AppKitProvider from '@/context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialState = cookieToInitialState(config, headers().get('cookie'));

  return (
    <html lang='en'>
      <body className={inter.className}>
        <AppKitProvider initialState={initialState}>
          <Navbar />

          <div className='px-8 py-4'>{children}</div>
        </AppKitProvider>
      </body>
      <script
        src='https://telegram.org/js/telegram-web-app.js'
        async
      />
    </html>
  );
}
