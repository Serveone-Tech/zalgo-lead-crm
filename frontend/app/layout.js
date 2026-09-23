'use client';
import './globals.css';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import Sidebar from '../components/Sidebar';

const NO_SIDEBAR = [
  '/', '/login', '/register', '/onboarding', '/plans', '/superadmin',
  // Public marketing site — no auth, no in-app sidebar.
  '/features', '/solutions', '/automation-suite', '/pricing', '/contact',
  '/docs', '/terms', '/privacy', '/refund-policy', '/help-center', '/about',
];

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const hideSidebar = NO_SIDEBAR.some(p => pathname === p || pathname.startsWith('/superadmin'));

  return (
    <html lang="en">
      <head>
        <title>LeadLo — Lead Management System</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.dataset.theme=localStorage.getItem('crm_theme')||'dark';document.documentElement.style.setProperty('--sidebar-w',localStorage.getItem('crm_sidebar_collapsed')==='1'?'68px':'232px');}catch(e){}`,
          }}
        />
        <Script id="ms-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "ymtpm0f0oq");`}
        </Script>
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
              transition: 'margin-left 0.18s ease',
            }}>
              {children}
            </main>
          </div>
        )}
      </body>
    </html>
  );
}
