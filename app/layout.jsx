import "./globals.css";

export const metadata = {
  title: "NeonTiers | Minecraft PvP tierlista magyar játékosokra",
  description: "NeonTiers — Minecraft PvP ranglista magyar játékosok számára, játékmódonkénti tierlistával és pontozással.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏆</text></svg>",
  },
  links: [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: true },
    { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800;900&display=swap" },
  ],
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
      </head>
      <body>{children}</body>
    </html>
  );
}
