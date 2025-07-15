import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"
import AuthProvider from "@/components/auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Work Tracker",
  description: "A simple work tracker application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en">
          <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
              <AuthProvider>
                  {children}
              </AuthProvider>
              <Toaster
                  position="top-center"   /* top-left | top-center | top-right | bottom-left | bottom-center | bottom-right */
                  richColors={true}          /* optional: use your theme colors */
              />
          </body>
      </html>
  );
}
