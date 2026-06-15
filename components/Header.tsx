'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface Props {
  user: User
  profile: { nickname: string | null; avatar_url: string | null } | null
}

const NAV_TABS = [
  { href: '/market?tab=sell', label: '판매글', color: '#dc143c', tabKey: 'sell' },
  { href: '/market?tab=buy',  label: '수요글', color: '#1e90ff', tabKey: 'buy'  },
  { href: '/market?tab=community', label: '커뮤니티', color: '#2e8b57', tabKey: 'community' },
]

export default function Header({ user, profile }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header
      style={{
        background: '#0d0d0d',
        borderBottom: '1px solid #1a1a1a',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* 상단 빨간 선 */}
      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #dc143c 30%, #dc143c 70%, transparent)' }} />

      <div
        style={{
          maxWidth: '72rem',
          margin: '0 auto',
          padding: '0 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '52px',
          gap: '1rem',
        }}
      >
        {/* 로고 */}
        <Link href="/market" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#e8e0d0', letterSpacing: '-0.01em' }}>
            머더헬프<span style={{ color: '#dc143c' }}>마켓</span>
          </span>
          <span style={{ color: '#3a3a3a', fontSize: '0.6rem', fontFamily: 'monospace', letterSpacing: '0.1em', marginTop: '2px' }}>
            BETA
          </span>
        </Link>

        {/* 탭 네비게이션 */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1, justifyContent: 'center' }}>
          {NAV_TABS.map((tab) => {
            const isActive = pathname === '/market' || pathname.startsWith('/market/post')
              ? false
              : false
            return (
              <Link
                key={tab.tabKey}
                href={tab.href}
                style={{
                  padding: '0.3rem 0.9rem',
                  fontSize: '0.82rem',
                  color: '#555550',
                  textDecoration: 'none',
                  letterSpacing: '0.05em',
                  border: '1px solid transparent',
                  transition: 'all 0.15s',
                  fontFamily: 'monospace',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = tab.color
                  e.currentTarget.style.borderColor = tab.color + '44'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#555550'
                  e.currentTarget.style.borderColor = 'transparent'
                }}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>

        {/* 우측 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <span style={{ color: '#888880', fontSize: '0.78rem', fontFamily: 'monospace' }}>
            {profile?.nickname || user.email?.split('@')[0]}
          </span>

          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid #2a2a2a',
              color: '#888880',
              padding: '0.3rem 0.8rem',
              fontSize: '0.72rem',
              letterSpacing: '0.15em',
              cursor: 'pointer',
              fontFamily: 'monospace',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#8b0000'
              e.currentTarget.style.color = '#dc143c'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#2a2a2a'
              e.currentTarget.style.color = '#888880'
            }}
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  )
}
