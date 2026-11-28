import type { Metadata, Viewport } from "next";
import { SkipLink } from "@/components/ui/skip-link";
import { ToastProvider } from "@/components/ui/toast-region";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Neximob · Controle mensal de escritório contábil",
    template: "%s · Neximob",
  },
  description:
    "Cobranças, obrigações fiscais do mês e régua automática em um único painel simples e confiável para contadores autônomos.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Neximob",
    description:
      "Controle mensal de escritório contábil: cobranças, obrigações fiscais e régua automática no mesmo painel.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Neximob" }],
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1d2326" },
  ],
};

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("neximob-theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}else{document.documentElement.removeAttribute("data-theme");}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/inter-latin-wght-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-[var(--nx-bg)] font-sans text-[14px] leading-[1.45] text-[var(--nx-text)] antialiased selection:bg-[var(--nx-accent-tint)] selection:text-[var(--nx-accent)]">
        <SkipLink />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
