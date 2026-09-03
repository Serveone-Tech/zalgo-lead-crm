'use client';
import './globals.css';
import { usePathname } from 'next/navigation';
import Sidebar from '../components/Sidebar';

const NO_SIDEBAR = [
  '/', '/login', '/register', '/onboarding', '/plans', '/superadmin',
  // Public marketing site — no auth, no in-app sidebar.
  '/features', '/solutions', '/automation-suite', '/pricing', '/resources', '/contact',
  '/docs', '/terms', '/privacy', '/refund-policy',
];

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const hideSidebar = NO_SIDEBAR.some(p => pathname === p || pathname.startsWith('/superadmin'));

  return (
    <html lang="en">
      <head>
        <title>Zalgo CRM — Lead Management System</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.dataset.theme=localStorage.getItem('crm_theme')||'dark';}catch(e){}`,
          }}
        />
      </head>
      <body>
        {hideSidebar ? (
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
