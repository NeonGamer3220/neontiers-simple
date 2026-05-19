import "./globals.css";

export const metadata = {
  title: "NeonTiers – Magyar Minecraft PvP Rangsor",
  description: "NeonTiers — A legpontosabb magyar Minecraft PvP rangsor, játékmódonkénti tierlistával és pontozással a NeonTiers Tagger mod alapján.",
  keywords: ["Minecraft", "PvP", "rangsor", "tierlista", "magyar", "játékos", "NeonTiers Tagger"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "NeonTiers – Magyar Minecraft PvP Rangsor",
    description: "A legpontosabb magyar Minecraft PvP rangsor játékmódonkénti tierlistával.",
    siteName: "NeonTiers",
    type: "website",
    locale: "hu_HU",
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏆</text></svg>",
    apple: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏆</text></svg>",
  },
};

export const viewport = {
  themeColor: "#d92d20",
  colorScheme: "dark",
};

export default function RootLayout({ children }) {
  return (
    <html lang="hu">
      <head />
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
