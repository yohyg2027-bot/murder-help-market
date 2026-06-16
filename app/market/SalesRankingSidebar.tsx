'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type RankedPost = {
  id: string
  title: string
  price: number | null
  category: string
  post_type: string
  comment_count: number
}

const POST_TYPE_LABEL: Record<string, { label: string; color: string }> = {
  sell: { label: '판매', color: '#dc143c' },
  buy:  { label: '구매', color: '#1e90ff' },
}

const RANK_MEDALS = ['🥇', '🥈', '🥉']

export default function SalesRankingSidebar() {
  const [posts, setPosts] = useState<RankedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [flash, setFlash] = useState(false)

  const supabase = createClient()

  const fetchRanking = useCallback(async () => {
    const { data } = await supabase.rpc('get_hot_posts')
    if (data) {
      setPosts(data as RankedPost[])
      setLastUpdated(new Date())
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchRanking()

    // 댓글 추가될 때마다 순위 새로고침
    const channel = supabase
      .channel('hot-posts-ranking')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, () => {
        setFlash(true)
        setTimeout(() => setFlash(false), 800)
        fetchRanking()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchRanking, supabase])

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <aside style={{
      width: '220px',
      flexShrink: 0,
      position: 'sticky',
      top: '80px',
      alignSelf: 'flex-start',
    }}>
      {/* 헤더 */}
      <div style={{
        padding: '0.65rem 0.85rem',
        background: flash ? 'rgba(220,20,60,0.12)' : '#111111',
        border: '1px solid #2a2a2a',
        borderTop: '2px solid #dc143c',
        marginBottom: '0.4rem',
        transition: 'background 0.3s',
      }}>
        <p style={{
          fontSize: '0.78rem', fontWeight: 700,
          color: '#e8e0d0', letterSpacing: '0.08em',
          marginBottom: '0.2rem',
        }}>
          🔥 실시간 인기글
        </p>
        <p style={{
          fontSize: '0.6rem', color: '#3a3a3a',
          fontFamily: 'monospace', letterSpacing: '0.05em',
        }}>
          LIVE · {formatTime(lastUpdated)}
        </p>
      </div>

      {/* 순위 목록 */}
      <div style={{
        background: '#111111',
        border: '1px solid #2a2a2a',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#3a3a3a', fontSize: '0.7rem', fontFamily: 'monospace' }}>
            순위 집계 중...
          </div>
        ) : posts.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#3a3a3a', fontSize: '0.7rem', fontFamily: 'monospace' }}>
            아직 인기글이 없어요
          </div>
        ) : (
          posts.map((post, i) => (
            <Link
              key={post.id}
              href={`/market/post/${post.id}`}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div style={{
                padding: '0.7rem 0.85rem',
                borderBottom: '1px solid #1a1a1a',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'flex-start',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#191919')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* 순위 번호 */}
                <span style={{
                  fontSize: i < 3 ? '0.9rem' : '0.75rem',
                  color: i < 3 ? '#e8e0d0' : '#3a3a3a',
                  fontWeight: 700,
                  minWidth: '20px',
                  paddingTop: '1px',
                  fontFamily: 'monospace',
                  flexShrink: 0,
                }}>
                  {i < 3 ? RANK_MEDALS[i] : `${i + 1}`}
                </span>

                {/* 내용 */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  {/* 타입 뱃지 */}
                  <span style={{
                    fontSize: '0.55rem',
                    color: POST_TYPE_LABEL[post.post_type]?.color ?? '#888',
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em',
                  }}>
                    [{POST_TYPE_LABEL[post.post_type]?.label ?? post.post_type}]
                  </span>

                  {/* 제목 */}
                  <p style={{
                    fontSize: '0.72rem',
                    color: '#c8c0b0',
                    lineHeight: 1.35,
                    margin: '0.1rem 0',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {post.title}
                  </p>

                  {/* 가격 + 댓글수 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                    {post.price !== null ? (
                      <span style={{ fontSize: '0.65rem', color: '#b8860b', fontWeight: 600 }}>
                        {post.price.toLocaleString('ko-KR')}원
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.65rem', color: '#3a3a3a' }}>가격 미정</span>
                    )}
                    <span style={{
                      fontSize: '0.6rem', color: '#555550',
                      fontFamily: 'monospace',
                    }}>
                      💬 {post.comment_count}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* 안내 */}
      <p style={{
        fontSize: '0.58rem', color: '#2a2a2a',
        fontFamily: 'monospace', textAlign: 'center',
        marginTop: '0.5rem', letterSpacing: '0.05em',
      }}>
        댓글 많은 순으로 실시간 집계
      </p>
    </aside>
  )
}
