'use client';
import './globals.css';
import { usePathname } from 'next/navigation';
import Sidebar from '../components/Sidebar';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  return (
    <html lang="en">
      <head>
        <title>Zalgo CRM — Coach Conversation Tracker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {isLogin ? (
          children
        ) : (
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main style={{
              marginLeft: 'var(--sidebar-w)',
              flex: 1,
              minHeight: '100vh',
              background: 'var(--bg-base)',
              overflow: 'auto',
            }}>
              {children}
            </main>
          </div>
        )}
      </body>
    </html>
  );
}
