import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import "@mdxeditor/editor/style.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loresay",
  description: "Private notes, grounded answers, and citations you can trace.",
};

export const themeBootstrap = `try {
  var stored = window.localStorage.getItem("theme");
  var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", dark);
} catch (error) {}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrap}
        </Script>
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
