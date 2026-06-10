import type { Metadata, Viewport } from "next";
import { Geist_Mono, Oswald } from "next/font/google";
import "./globals.css";

import { PwaRegister } from "@/components/PwaRegister";

import { Providers } from "./providers";

// Oswald (variable 200–700) = fuente principal de la app. Mono para cifras.
const oswald = Oswald({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"], display: "swap" });

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
      className={`${oswald.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <PwaRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
