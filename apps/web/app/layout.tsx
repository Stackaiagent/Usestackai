import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

const SITE_URL = "https://usestackai.com";
const TITLE = "StackAI — AI coding agent for your terminal";
const DESCRIPTION =
  "Tell it what you want; StackAI reads your files, plans the change, and writes the code. Works in your terminal, editor, and browser. Free to start — 50 requests/day.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · StackAI",
  },
  description: DESCRIPTION,
  applicationName: "StackAI",
  keywords: [
    "AI coding agent",
    "AI code assistant",
    "terminal AI",
    "CLI coding agent",
    "AI pair programmer",
    "vibe coding",
    "code generation",
    "StackAI",
  ],
  authors: [{ name: "StackAI" }],
  creator: "StackAI",
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "StackAI",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@askstackai",
    creator: "@askstackai",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
