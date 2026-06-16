'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getCategoryVisual } from '@/lib/categoryVisual'

type Message = { id: string; sender_id: string; content: string; created_at: string }
type PostInfo = { id: string; title: string; price: number | null; post_type: string; category: string } | null

interface Props {
  chatId: string
  currentUserId: string
  otherNickname: string
  post: PostInfo
  initialMessages: Message[]
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatRoom({ chatId, currentUserId, otherNickname, post, initialMessages }: Props) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // 중복 없이 메시지 추가
  const addMessage = (m: Message) => {
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
  }

  // 실시간 구독: 이 채팅방에 새 메시지가 들어오면 바로 화면에 표시
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => addMessage(payload.new as Message),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId])

  // 새 메시지가 오면 맨 아래로 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    setSending(true)
    setInput('')

    const { data, error } = await supabase
      .from('messages')
      .insert({ chat_id: chatId, sender_id: currentUserId, content: text })
      .select('id, sender_id, content, created_at')
      .single()

    if (error || !data) {
      setInput(text) // 실패 시 입력 내용 복구
      setSending(false)
      return
    }

    addMessage(data as Message)
    // 채팅방 목록 정렬용 마지막 시각 갱신
    supabase.from('chats').update({ last_message_at: new Date().toISOString() }).eq('id', chatId).then(() => {})
    setSending(false)
  }

  const v = getCategoryVisual(post?.category)
  const accent = post?.post_type === 'buy' ? '#1e90ff' : '#dc143c'

  return (
    <div style={{
      maxWidth: '720px', margin: '0 auto', padding: '1.25rem 1rem',
      display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)',
    }}>
      {/* 상단: 상대방 + 게시글 */}
      <div style={{ marginBottom: '0.75rem' }}>
        <Link href="/market/chat" style={{
          color: '#555550', fontSize: '0.75rem', textDecoration: 'none',
          fontFamily: 'monospace', letterSpacing: '0.1em',
        }}>
          ← 채팅 목록
        </Link>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        background: '#111111', border: '1px solid #2a2a2a',
        borderTop: `2px solid ${accent}66`, padding: '0.75rem 1rem', marginBottom: '0.75rem',
      }}>
        <div style={{
          width: '42px', height: '42px', flexShrink: 0,
          background: `radial-gradient(ellipse at center, ${v.color}33 0%, #0d0d0d 80%)`,
          border: `1px solid ${v.color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
        }}>
          {v.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#e8e0d0', fontSize: '0.9rem', fontWeight: 700 }}>{otherNickname}</p>
          {post && (
            <Link href={`/market/post/${post.id}`} style={{
              color: '#888880', fontSize: '0.72rem', textDecoration: 'none',
              display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {post.title}
              {post.price !== null && ` · ${post.price.toLocaleString('ko-KR')}원`}
            </Link>
          )}
        </div>
      </div>

      {/* 메시지 영역 */}
      <div style={{
        flex: 1, overflowY: 'auto',
        background: '#0d0d0d', border: '1px solid #1a1a1a',
        padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
      }}>
        {messages.length === 0 ? (
          <div style={{
            margin: 'auto', color: '#3a3a3a', fontFamily: 'monospace',
            fontSize: '0.8rem', letterSpacing: '0.05em', textAlign: 'center',
          }}>
            아직 대화가 없습니다.<br />첫 메시지를 보내보세요.
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId
            return (
              <div key={m.id} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: mine ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '75%',
                  background: mine ? 'linear-gradient(135deg, #8b0000, #b01030)' : '#1a1a1a',
                  border: `1px solid ${mine ? '#5c0000' : '#2a2a2a'}`,
                  color: mine ? '#f0e8d8' : '#c8c0b0',
                  padding: '0.55rem 0.85rem', fontSize: '0.88rem', lineHeight: 1.5,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {m.content}
                </div>
                <span style={{ color: '#2a2a2a', fontSize: '0.62rem', fontFamily: 'monospace', marginTop: '0.15rem' }}>
                  {formatTime(m.created_at)}
                </span>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요..."
          maxLength={1000}
          style={{
            flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a',
            color: '#e8e0d0', padding: '0.75rem 1rem', fontSize: '0.9rem',
            outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            background: sending || !input.trim() ? '#1a1a1a' : 'linear-gradient(135deg, #8b0000, #cc0000)',
            border: '1px solid #5c0000',
            color: sending || !input.trim() ? '#3a3a3a' : '#e8e0d0',
            fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em',
            cursor: sending || !input.trim() ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
          }}
        >
          전송
        </button>
      </form>
    </div>
  )
}
