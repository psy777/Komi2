import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Komi - AI Go Editor',
    description: 'An AI-powered Go game editor and analysis tool.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Merriweather:wght@300;400;700&family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&display=swap" rel="stylesheet" />
            </head>
            <body>
                <div id="root">
                    {children}
                </div>
            </body>
        </html>
    );
}
