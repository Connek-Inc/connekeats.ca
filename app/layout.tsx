import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Montserrat, Oswald, Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";

import { PwaRegister } from "@/components/PwaRegister";

import { Providers } from "./providers";

// Fuentes curadas para el branding por negocio. Cada una expone --font-<key>;
// el negocio elige cuál mapear a --font-sans (default = Oswald). Mono para cifras.
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin"], display: "swap" });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], display: "swap" });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"], display: "swap" });

const fontVars = [oswald, inter, poppins, montserrat, playfair, geistMono].map((f) => f.variable).join(" ");

export const metadata: Metadata = {
  title: "Connek Food — pedidos por QR",
  description: "Gestión de mesas, pedidos por QR y cocina en vivo.",
  applicationName: "Connek",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Connek" },
  formatDetection: { telephone: false },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

// Look de app nativa iPhone: viewport-fit=cover (safe-areas), sin zoom al tocar,
// theme-color que sigue el tema claro/oscuro.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${fontVars} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <PwaRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
