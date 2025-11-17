import './globals.css';

export const metadata = {
  title: 'FineProof.uk – £10K GDPR Fine Shield',
  description: 'We pay your ICO fine up to £10,000. Free scan in 3 clicks.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon-180.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
