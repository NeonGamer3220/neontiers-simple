import "./globals.css";

export const metadata = {
  title: "NeonTiers",
  description: "NeonTiers ranglista",
};

export default function RootLayout({ children }) {
  return (
    <html lang="hu">
      <body>{children}</body>
    </html>
  );
}
