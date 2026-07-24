import type { Metadata } from "next";
import "./globals.css";
import { ClerkAppProvider } from "@/components/auth/clerk-provider";
import { isClerkConfigured } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL("https://monstra.guide"),
  title: "Monstra Guide | The Living AI Textbook for Work",
  description:
    "Monstra Guide turns demonstrated computer tasks into visual, step-by-step training and searchable company knowledge.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Monstra Guide | The Living AI Textbook for Work",
    description:
      "Monstra Guide turns demonstrated computer tasks into visual, step-by-step training and searchable company knowledge.",
    url: "https://monstra.guide",
    siteName: "Monstra Guide",
    type: "website",
    images: [{ url: "/brand/monstra-banner.png", width: 1600, height: 900, alt: "Monstra Guide" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Monstra Guide | The Living AI Textbook for Work",
    description:
      "Monstra Guide turns demonstrated computer tasks into visual, step-by-step training and searchable company knowledge.",
    images: ["/brand/monstra-banner.png"],
  },
  icons: {
    icon: [
      { url: "/brand/monstra-guide-mark.svg", type: "image/svg+xml" },
      { url: "/brand/monstra-guide-logo.svg", type: "image/svg+xml" },
    ],
    apple: "/brand/monstra-guide-mark.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ClerkAppProvider enabled={isClerkConfigured()}>{children}</ClerkAppProvider>
      </body>
    </html>
  );
}
