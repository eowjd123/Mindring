// app/layout.tsx
import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DigitalNote",
  description: "마인드링",
  icons: [{ rel: "icon", url: "/public/img/maind.png" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
