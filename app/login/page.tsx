'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      setLoading(false)
      return
    }

    router.push('/market')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      {/* 배경 그라데이션 */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(139,0,0,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #dc143c, transparent)' }} />

      <div className="relative z-10 w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <Link href="/" style={{ color: '#888880', fontSize: '0.75rem', letterSpacing: '0.3em', fontFamily: 'monospace' }}>
            ← 돌아가기
          </Link>
          <div className="mt-6 mb-2" style={{ color: '#8b0000', letterSpacing: '0.4em', fontSize: '0.7rem', fontFamily: 'monospace' }}>
            ◆ ─────────── ◆
          </div>
          <h1 className="flicker" style={{ fontSize: '2rem', fontWeight: 900, color: '#e8e0d0', textShadow: '0 0 20px rgba(220,20,60,0.3)', letterSpacing: '-0.01em' }}>
            머더헬프<span style={{ color: '#dc143c' }}>마켓</span>
          </h1>
          <p style={{ color: '#888880', fontSize: '0.8rem', marginTop: '0.5rem', letterSpacing: '0.1em', fontStyle: 'italic' }}>
            신원을 확인합니다
          </p>
          <div className="mt-2" style={{ color: '#8b0000', letterSpacing: '0.4em', fontSize: '0.7rem', fontFamily: 'monospace' }}>
            ◆ ─────────── ◆
          </div>
        </div>

        {/* 폼 카드 */}
        <div
          className="p-8"
          style={{
            background: '#111111',
            border: '1px solid #2a2a2a',
            borderTop: '1px solid #5c0000',
          }}
        >
          <h2 style={{ color: '#b8860b', fontSize: '0.75rem', letterSpacing: '0.3em', marginBottom: '1.5rem', textAlign: 'center' }}>
            — 로그인 —
          </h2>

          {error && (
            <div
              className="mb-5 py-3 px-4 text-sm"
              style={{ background: 'rgba(139,0,0,0.2)', border: '1px solid #5c0000', color: '#dc143c', letterSpacing: '0.02em' }}
            >
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label style={{ display: 'block', color: '#888880', fontSize: '0.75rem', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                style={{
                  width: '100%',
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  color: '#e8e0d0',
                  padding: '0.75rem 1rem',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: 'monospace',
                }}
                onFocus={(e) => e.target.style.borderColor = '#8b0000'}
                onBlur={(e) => e.target.style.borderColor = '#2a2a2a'}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#888880', fontSize: '0.75rem', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  color: '#e8e0d0',
                  padding: '0.75rem 1rem',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: 'monospace',
                }}
                onFocus={(e) => e.target.style.borderColor = '#8b0000'}
                onBlur={(e) => e.target.style.borderColor = '#2a2a2a'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-bold tracking-widest transition-all duration-300"
              style={{
                background: loading ? '#3a0000' : 'linear-gradient(135deg, #8b0000, #cc0000)',
                color: loading ? '#888880' : '#e8e0d0',
                border: '1px solid #5c0000',
                fontSize: '0.85rem',
                letterSpacing: '0.25em',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 0 20px rgba(220,20,60,0.15)',
              }}
            >
              {loading ? '확인 중...' : '입장하기'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid #1a1a1a', paddingTop: '1.5rem' }}>
            <p style={{ color: '#555550', fontSize: '0.8rem' }}>
              아직 회원이 아니신가요?{' '}
              <Link href="/signup" style={{ color: '#dc143c', textDecoration: 'none' }}>
                가입하기
              </Link>
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#2a2a2a', fontSize: '0.65rem', marginTop: '1.5rem', letterSpacing: '0.2em', fontFamily: 'monospace' }}>
          ✦ 모든 접속 기록은 암호화됩니다 ✦
        </p>
      </div>
    </main>
  )
}
