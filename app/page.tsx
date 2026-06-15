import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* 배경 그라데이션 */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(139,0,0,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(100,0,0,0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />

      {/* 상단 빨간 선 */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #dc143c, transparent)' }} />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl">
        {/* 로고 영역 */}
        <div className="mb-3" style={{ color: '#8b0000', letterSpacing: '0.4em', fontSize: '0.75rem', fontFamily: 'monospace' }}>
          ◆ ─────────────────── ◆
        </div>

        <h1
          className="flicker mb-2"
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            color: '#e8e0d0',
            textShadow: '0 0 40px rgba(220,20,60,0.4), 0 2px 4px rgba(0,0,0,0.8)',
            lineHeight: 1.1,
          }}
        >
          머더헬프<span style={{ color: '#dc143c' }}>마켓</span>
        </h1>

        <div className="mb-3" style={{ color: '#8b0000', letterSpacing: '0.4em', fontSize: '0.75rem', fontFamily: 'monospace' }}>
          ◆ ─────────────────── ◆
        </div>

        <p style={{ color: '#888880', fontSize: '0.9rem', letterSpacing: '0.15em', marginBottom: '0.5rem', fontStyle: 'italic' }}>
          MURDER HELP MARKET
        </p>

        <p style={{ color: '#b8860b', fontSize: '1rem', marginBottom: '3rem', letterSpacing: '0.05em' }}>
          당신의 거래, 우리의 비밀
        </p>

        {/* 설명 텍스트 */}
        <p style={{ color: '#888880', fontSize: '0.95rem', lineHeight: 1.8, marginBottom: '3rem', maxWidth: '420px' }}>
          어떤 물건이든, 어떤 거래든.
          <br />
          질문하지 않습니다. 판단하지 않습니다.
          <br />
          <span style={{ color: '#dc143c' }}>다만 거래할 뿐입니다.</span>
        </p>

        {/* CTA 버튼 */}
        {user ? (
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
            <Link
              href="/market"
              className="pulse-red flex-1 flex items-center justify-center py-3 px-6 text-sm font-bold tracking-widest transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #8b0000, #cc0000)',
                color: '#e8e0d0',
                border: '1px solid #5c0000',
                letterSpacing: '0.2em',
              }}
            >
              마켓 입장
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
            <Link
              href="/signup"
              className="flex-1 flex items-center justify-center py-3 px-6 text-sm font-bold tracking-widest transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #8b0000, #cc0000)',
                color: '#e8e0d0',
                border: '1px solid #5c0000',
                letterSpacing: '0.2em',
                boxShadow: '0 0 20px rgba(220,20,60,0.2)',
              }}
            >
              가입하기
            </Link>
            <Link
              href="/login"
              className="flex-1 flex items-center justify-center py-3 px-6 text-sm tracking-widest transition-all duration-300 hover:scale-105"
              style={{
                background: 'transparent',
                color: '#e8e0d0',
                border: '1px solid #2a2a2a',
                letterSpacing: '0.2em',
              }}
            >
              로그인
            </Link>
          </div>
        )}

        {/* 하단 장식 */}
        <div className="mt-16" style={{ color: '#2a2a2a', fontSize: '0.7rem', letterSpacing: '0.3em', fontFamily: 'monospace' }}>
          ✦ 비밀은 지켜드립니다 ✦
        </div>
      </div>
    </main>
  )
}
