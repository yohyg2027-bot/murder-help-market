import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "머더헬프마켓 | 당신의 거래, 우리의 비밀",
  description: "비밀스러운 중고거래의 세계에 오신 것을 환영합니다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
