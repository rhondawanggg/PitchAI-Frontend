import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PitchAI",
  description: "您的智能审核助手",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
