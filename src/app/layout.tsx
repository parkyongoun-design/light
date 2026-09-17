import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "미션 가챠",
  description: "미션 수행하고 뽑기권 모아 가챠 뽑기",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
