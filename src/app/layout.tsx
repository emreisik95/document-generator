import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Confluence Documentation Generator",
  description: "AI-powered tool to generate well-structured Confluence documentation with proper formatting and sections.",
  keywords: [
    "Confluence",
    "Documentation",
    "AI",
    "Technical Writing",
    "Documentation Generator",
    "Markdown"
  ],
  authors: [
    {
      name: "Emre Isik",
    }
  ],
  openGraph: {
    title: "Confluence Documentation Generator",
    description: "Generate professional Confluence documentation with AI assistance",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
