import type { Metadata } from "next";

import RootProvider from "@/components/providers/root-provider";

import "./globals.css";

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
      <body className="bg-gradient-to-br from-slate-100 via-slate-200 to-white text-slate-900 antialiased">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
