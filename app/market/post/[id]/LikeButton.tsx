'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  postId: string
  currentUserId: string | undefined
  initialCount: number
  initialLiked: boolean
}

export default function LikeButton({ postId, currentUserId, initialCount, initialLiked }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (loading) return
    if (!currentUserId) {
      router.push('/login')
      return
    }

    setLoading(true)
    // 화면을 먼저 바꿔서 즉각 반응하도록 합니다 (실패하면 되돌립니다)
    const nextLiked = !liked
    setLiked(nextLiked)
    setCount((c) => c + (nextLiked ? 1 : -1))

    const { error } = nextLiked
      ? await supabase.from('likes').insert({ post_id: postId, user_id: currentUserId })
      : await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUserId)

    if (error) {
      setLiked(!nextLiked)
      setCount((c) => c + (nextLiked ? -1 : 1))
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-pressed={liked}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
        background: liked ? 'rgba(139,0,0,0.18)' : 'transparent',
        border: `1px solid ${liked ? '#8b0000' : '#2a2a2a'}`,
        color: liked ? '#dc143c' : '#888880',
        padding: '0.5rem 1.1rem',
        fontSize: '0.85rem',
        fontFamily: 'monospace',
        letterSpacing: '0.05em',
        cursor: loading ? 'wait' : 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: '1rem', lineHeight: 1 }}>{liked ? '♥' : '♡'}</span>
      <span>좋아요 {count}</span>
    </button>
  )
}
