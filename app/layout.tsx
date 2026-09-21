import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AuthProvider } from "./auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mushibot",
  description: "Mushibot omnichannel AI customer support platform.",
  icons: {
    icon: "/mushibot-logo.png",
    shortcut: "/mushibot-logo.png",
    apple: "/mushibot-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap"
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
