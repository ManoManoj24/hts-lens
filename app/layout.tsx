import type {ReactNode} from 'react';
import './styles.css';

export const metadata = {
  title: 'HTS Lens - US tariff research',
  description: 'Search official USITC HTS lines with transparent duty rates.',
};

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
