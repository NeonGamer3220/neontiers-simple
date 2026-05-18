import "./globals.css";

export const metadata = {
  title: "NeonTiers – Magyar Minecraft PvP Rangsor",
  description: "NeonTiers — Minecraft PvP ranglista magyar játékosok számára, játékmódonkénti tierlistával és pontozással.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏆</text></svg>",
  },
};

export const viewport = {
  themeColor: "#d92d20",
  colorScheme: "dark",
};

export default function RootLayout({ children }) {
  return (
    <html lang="hu">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://render.crafty.gg" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Montserrat-Regular.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
        <link rel="preload" href="/fonts/Montserrat-Bold.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
        <link rel="preload" href="/fonts/Montserrat-ExtraBold.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
