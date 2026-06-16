'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  postId: string
  sellerId: string
  currentUserId: string | undefined
  accent: string
}

export default function ChatButton({ postId, sellerId, currentUserId, accent }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (loading) return
    if (!currentUserId) {
      router.push('/login')
      return
    }

    setLoading(true)

    // 이미 이 게시글로 만든 채팅방이 있으면 그곳으로, 없으면 새로 만듭니다
    const { data: existing } = await supabase
      .from('chats')
      .select('id')
      .eq('post_id', postId)
      .eq('buyer_id', currentUserId)
      .maybeSingle()

    let chatId = existing?.id

    if (!chatId) {
      const { data: created, error } = await supabase
        .from('chats')
        .insert({ post_id: postId, buyer_id: currentUserId, seller_id: sellerId })
        .select('id')
        .single()

      if (error || !created) {
        setLoading(false)
        alert('채팅방을 열 수 없습니다. 잠시 후 다시 시도해 주세요.')
        return
      }
      chatId = created.id
    }

    router.push(`/market/chat/${chatId}`)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        background: `${accent}1a`,
        border: `1px solid ${accent}66`,
        color: accent,
        padding: '0.45rem 1.1rem',
        fontSize: '0.8rem',
        fontFamily: 'monospace',
        letterSpacing: '0.08em',
        cursor: loading ? 'wait' : 'pointer',
      }}
    >
      💬 {loading ? '여는 중...' : '채팅하기'}
    </button>
  )
}
