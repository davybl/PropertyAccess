import { Suspense } from "react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { DeviceSessionGuard } from "@/components/device-session-guard";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "propertyaccess.app — Verified Direct-to-Caretaker Homes & Land in Kenya",
  description:
    "Zero broker fees. Unlock verified Kenyan caretaker contacts with a KES 200 7-Day Category Pass via M-Pesa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakarta.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-canvas text-ink antialiased selection:bg-emerald-brand/20 selection:text-emerald-brand">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <DeviceSessionGuard />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
