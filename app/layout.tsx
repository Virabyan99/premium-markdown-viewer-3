import type { Metadata } from "next";
import { Geist, Geist_Mono, } from "next/font/google";
import '@fontsource/noto-sans-kr'
import '@fontsource/noto-sans-jp'
import '@fontsource/noto-sans-sc'
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
  title: 'Markdown Viewer',
  description: 'A drag-and-drop Markdown viewing app',
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
      </body>
    </html>
  );
}
