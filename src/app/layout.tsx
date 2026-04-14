import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthGuard } from "@/components/AuthGuard";
import { DemoModalTrigger } from "@/components/DemoModal";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FreelanceRadar",
  description: "Agrega oportunidades freelance de múltiples plataformas en un solo lugar",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="h-full flex bg-background text-foreground">
        <ThemeProvider>
          <AuthGuard>
            <Sidebar />
            <main className="flex-1 overflow-hidden">{children}</main>
          </AuthGuard>
          <DemoModalTrigger />
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
