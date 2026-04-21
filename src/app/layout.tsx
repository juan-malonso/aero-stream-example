export const metadata = {
  title: 'AeroStream Pilot Frontend',
  description: 'Connecting to Aero-Stream Tower via WebSocket',
};

import '../styles/global.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ height: '100vh', width: '100vw', padding: 0, margin: 0 }}>{children}</body>
    </html>
  );
}