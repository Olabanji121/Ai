import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI API",
  description: "Next.js API with OpenSpec and TDD",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
