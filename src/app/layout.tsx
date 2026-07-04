import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
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
    default: "CivicSentry AI — Election Safety Intelligence",
    template: "%s | CivicSentry AI",
  },
  description:
    "Real-time election safety monitoring for Nigerian polling units using satellite imagery, historical violence data, and AI-powered risk narratives. 33,802 polling units across 6 South West states.",
  keywords: [
    "Nigeria elections",
    "polling unit safety",
    "election violence",
    "satellite imagery",
    "ACLED",
    "INEC",
    "voter safety",
    "election monitoring",
    "CivicSentry",
    "Nigerian elections 2027",
  ],
  authors: [{ name: "CivicSentry AI" }],
  creator: "CivicSentry AI",
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://civicsentry.ai",
    siteName: "CivicSentry AI",
    title: "CivicSentry AI — Know Before You Go Vote",
    description:
      "Real-time election safety intelligence for 33,802 polling units across Nigeria's 6 South West states. Satellite imagery, violence data, and AI-powered risk narratives.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CivicSentry AI Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CivicSentry AI — Know Before You Go Vote",
    description:
      "Real-time election safety intelligence for 33,802 polling units across Nigeria's 6 South West states.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="canonical" href="https://civicsentry.ai" />
      </head>
      <body className="min-h-full flex flex-col bg-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
