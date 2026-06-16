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
      <body className="min-h-full flex flex-col antialiased">
        <div style={{
          background: '#1a0a0a',
          borderBottom: '1px solid #3d1010',
          padding: '7px 1rem',
          textAlign: 'center',
          fontSize: '0.72rem',
          color: '#a07070',
          letterSpacing: '0.04em',
          fontFamily: 'monospace',
        }}>
          <span style={{ color: '#dc143c', marginRight: '0.4rem' }}>⚠</span>
          본 사이트는 드라마 《킬러들의 쇼핑몰》 팬메이드 프로젝트이며, 실제 서비스와 무관합니다.
        </div>
        {children}
      </body>
    </html>
  );
}
