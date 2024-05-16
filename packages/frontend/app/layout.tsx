import Navigation from './components/navigation';
import { AppContextProvider } from './context/providers';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Morningbell',
    description: 'A buzzer app for the masses',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang='en'>
            <body className={`${inter.className} min-h-screen flex flex-col`}>
                <AppContextProvider>
                    <Navigation />
                    <main className='flex flex-col flex-grow justify-start lg:justify-center'>{children}</main>
                </AppContextProvider>
            </body>
        </html>
    );
}
