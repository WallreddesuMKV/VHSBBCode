import './globals.css';

export const metadata = {
  title: 'BBCode Gen | VHSTaPE',
  description: 'BBCode generator for game and movie releases with multi-store metadata fetching, image hosting, Pearcrypt containers, and Discord cloud sync.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

const themeInitScript = `(function(){try{var m=new Date().getMonth();var w=m===10||m===11||m===0;var t=localStorage.getItem('bbcode_theme');var ok=t==='light'||t==='dark'||(w&&t==='christmas');document.documentElement.setAttribute('data-theme',ok?t:(w?'christmas':'dark'));var s=localStorage.getItem('bbcode_sidebar');if(s==='collapsed'){document.documentElement.setAttribute('data-sidebar','collapsed');}}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
