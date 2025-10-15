import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import RootProvider from "@/components/providers/root-provider";

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
  title: {
    template: "%s | Next Admin",
    default: "Next Admin Dashboard",
  },
  description:
    "Admin tooling for managing users, roles, and permissions in the NextJS boilerplate.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-gradient-to-br from-slate-100 via-slate-200 to-white text-slate-900 antialiased`}
      >
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
