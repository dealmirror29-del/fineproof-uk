import './globals.css';

export const metadata = {
  title: 'FineProof.uk - GDPR Compliance for Shopify',
  description: 'We pay your £10K fine. Free scan. 1-click fix.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
