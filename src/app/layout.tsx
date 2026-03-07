import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

// Disable static prerendering for all pages — this is an admin dashboard,
// all pages require authentication and fetch dynamic data
export const dynamic = 'force-dynamic';

const inter = localFont({
  src: "./fonts/Inter-VariableFont.ttf",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NextTrip Admin - Tour Management Platform",
  description: "Wholesale Tour Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
