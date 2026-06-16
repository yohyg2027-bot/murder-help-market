import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCategoryVisual } from '@/lib/categoryVisual'

type Profile = { nickname: string } | null
type PostInfo = { title: string; post_type: string; category: string } | null

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

export default async function ChatListPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // RLS 덕분에 내가 속한 채팅방만 조회됩니다
  const { data: chatsRaw } = await supabase
    .from('chats')
    .select(`
      id, buyer_id, seller_id, last_message_at,
      buyer:profiles!buyer_id(nickname),
      seller:profiles!seller_id(nickname),
      post:products!post_id(title, post_type, category)
    `)
    .order('last_message_at', { ascending: false })

  const chats = (chatsRaw ?? []) as unknown as {
    id: string; buyer_id: string; seller_id: string; last_message_at: string
    buyer: Profile; seller: Profile; post: PostInfo
  }[]

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: '#8b0000', fontSize: '0.7rem', letterSpacing: '0.3em', fontFamily: 'monospace', marginBottom: '0.3rem' }}>
          ◆ 채팅
        </p>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#e8e0d0' }}>내 채팅방</h1>
      </div>

      {chats.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          border: '1px solid #2a2a2a', color: '#3a3a3a',
          fontFamily: 'monospace', fontSize: '0.82rem', letterSpacing: '0.1em',
        }}>
          <p style={{ marginBottom: '0.5rem' }}>아직 시작한 채팅이 없습니다</p>
          <p style={{ color: '#2a2a2a', fontSize: '0.72rem' }}>
            게시글 상세에서 “💬 채팅하기”를 눌러 대화를 시작하세요
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {chats.map((c) => {
            const other = c.buyer_id === user.id ? c.seller : c.buyer
            const v = getCategoryVisual(c.post?.category)
            const accent = c.post?.post_type === 'buy' ? '#1e90ff' : '#dc143c'
            return (
              <Link
                key={c.id}
                href={`/market/chat/${c.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.85rem',
                  background: '#111111', border: '1px solid #2a2a2a',
                  borderLeft: `2px solid ${accent}66`,
                  padding: '0.85rem 1rem', textDecoration: 'none',
                }}
              >
                <div style={{
                  width: '44px', height: '44px', flexShrink: 0,
                  background: `radial-gradient(ellipse at center, ${v.color}33 0%, #0d0d0d 80%)`,
                  border: `1px solid ${v.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
                }}>
                  {v.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#e8e0d0', fontSize: '0.9rem', fontWeight: 600 }}>
                    {other?.nickname ?? '상대방'}
                  </p>
                  <p style={{
                    color: '#888880', fontSize: '0.74rem',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {c.post?.title ?? '삭제된 게시글'}
                  </p>
                </div>
                <span style={{ color: '#3a3a3a', fontSize: '0.68rem', fontFamily: 'monospace', flexShrink: 0 }}>
                  {timeAgo(c.last_message_at)}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
