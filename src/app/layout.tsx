// app/layout.tsx
import "./globals.css";

import type { Metadata } from "next";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "DigitalNote",
  description: "마인드링",
  icons: [{ rel: "icon", url: "/img/maind.png" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased font-suit">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
