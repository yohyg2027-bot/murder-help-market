'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Comment = {
  id: string
  content: string
  offer_price: number | null
  created_at: string
  is_secret: boolean
  locked: boolean
  author: { id: string; nickname: string } | null
}

interface Props {
  postId: string
  currentUserId: string | undefined
  canNegotiate: boolean
  initialComments: Comment[]
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

export default function CommentSection({ postId, currentUserId, canNegotiate, initialComments }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [content, setContent] = useState('')
  const [offerPrice, setOfferPrice] = useState('')
  const [showPriceField, setShowPriceField] = useState(false)
  const [isSecret, setIsSecret] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId || !content.trim() || loading) return

    setLoading(true)
    setError('')

    const payload: {
      post_id: string
      author_id: string
      content: string
      offer_price?: number
      is_secret: boolean
    } = {
      post_id: postId,
      author_id: currentUserId,
      content: content.trim(),
      is_secret: isSecret,
    }

    if (showPriceField && offerPrice && !isNaN(Number(offerPrice)) && Number(offerPrice) >= 0) {
      payload.offer_price = Number(offerPrice)
    }

    const { data, error: insertError } = await supabase
      .from('comments')
      .insert(payload)
      .select('id, content, offer_price, created_at, is_secret, author:profiles!author_id(id, nickname)')
      .single()

    if (insertError || !data) {
      setError('댓글 등록에 실패했습니다. 다시 시도해 주세요.')
      setLoading(false)
      return
    }

    // 내가 쓴 댓글이므로 잠금 없이 바로 보입니다
    setComments((prev) => [...prev, { ...(data as unknown as Comment), locked: false }])
    setContent('')
    setOfferPrice('')
    setShowPriceField(false)
    setIsSecret(false)
    setLoading(false)
  }

  return (
    <div>
      <h3 style={{
        color: '#e8e0d0', fontSize: '0.95rem', fontWeight: 700,
        marginBottom: '1.25rem', letterSpacing: '0.05em',
      }}>
        댓글{comments.length > 0 ? ` (${comments.length})` : ''}
        {canNegotiate && (
          <span style={{ color: '#3a3a3a', fontSize: '0.7rem', fontWeight: 400, marginLeft: '0.5rem', fontFamily: 'monospace' }}>
            · 가격 흥정 가능
          </span>
        )}
      </h3>

      {/* 댓글 목록 */}
      {comments.length === 0 ? (
        <div style={{
          padding: '2rem', textAlign: 'center',
          color: '#3a3a3a', fontFamily: 'monospace',
          fontSize: '0.78rem', border: '1px solid #1a1a1a',
          marginBottom: '1.25rem', letterSpacing: '0.05em',
        }}>
          아직 댓글이 없습니다
          {canNegotiate && (
            <span style={{ display: 'block', marginTop: '0.3rem', color: '#2a2a2a', fontSize: '0.72rem' }}>
              아래에서 가격 흥정을 시작해보세요
            </span>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {comments.map((c) => {
            const isMyComment = c.author?.id === currentUserId
            return (
              <div key={c.id} style={{
                background: c.locked ? '#0d0d0d' : (isMyComment ? 'rgba(139,0,0,0.06)' : '#111111'),
                border: `1px solid ${isMyComment ? '#5c000033' : '#1a1a1a'}`,
                padding: '0.875rem 1rem',
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: '0.4rem',
                }}>
                  <span style={{ color: '#888880', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    {c.author?.nickname ?? '익명'}
                    {isMyComment && (
                      <span style={{ color: '#5c0000', marginLeft: '0.4rem', fontSize: '0.65rem' }}>(나)</span>
                    )}
                    {c.is_secret && (
                      <span style={{ color: '#6a6a3a', marginLeft: '0.4rem', fontSize: '0.65rem' }}>🔒 비밀</span>
                    )}
                  </span>
                  <span style={{ color: '#2a2a2a', fontSize: '0.68rem', fontFamily: 'monospace' }}>
                    {timeAgo(c.created_at)}
                  </span>
                </div>
                {c.locked ? (
                  <p style={{
                    color: '#555550', fontSize: '0.83rem', lineHeight: 1.65, margin: 0,
                    fontStyle: 'italic', fontFamily: 'monospace',
                  }}>
                    🔒 비밀 댓글입니다. 작성자와 글쓴이만 볼 수 있습니다.
                  </p>
                ) : (
                  <>
                    {c.offer_price !== null && c.offer_price !== undefined && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        background: 'rgba(184,134,11,0.1)',
                        border: '1px solid rgba(184,134,11,0.25)',
                        padding: '0.2rem 0.6rem', fontSize: '0.73rem',
                        color: '#b8860b', marginBottom: '0.4rem',
                        fontFamily: 'monospace',
                      }}>
                        💰 {c.offer_price.toLocaleString('ko-KR')}원 제안
                      </div>
                    )}
                    <p style={{ color: '#c8c0b0', fontSize: '0.88rem', lineHeight: 1.65, margin: 0 }}>
                      {c.content}
                    </p>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 댓글 작성 */}
      {currentUserId ? (
        <form onSubmit={handleSubmit}>
          {error && (
            <p style={{ color: '#dc143c', fontSize: '0.78rem', marginBottom: '0.5rem' }}>⚠ {error}</p>
          )}

          {canNegotiate && (
            <div style={{ marginBottom: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowPriceField(!showPriceField)}
                style={{
                  background: 'transparent',
                  border: `1px solid ${showPriceField ? '#8b000066' : '#2a2a2a'}`,
                  color: showPriceField ? '#dc143c' : '#555550',
                  padding: '0.3rem 0.85rem',
                  fontSize: '0.72rem', fontFamily: 'monospace',
                  cursor: 'pointer', letterSpacing: '0.08em',
                }}
              >
                {showPriceField ? '▲ 가격 제안 취소' : '💰 가격 제안하기'}
              </button>
              {showPriceField && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.6rem' }}>
                  <input
                    type="number" value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="제안 금액" min={0}
                    style={{
                      background: '#1a1a1a', border: '1px solid #2a2a2a',
                      color: '#e8e0d0', padding: '0.5rem 0.75rem',
                      fontSize: '0.85rem', width: '160px',
                      fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                  <span style={{ color: '#555550', fontSize: '0.82rem' }}>원</span>
                </div>
              )}
            </div>
          )}

          {/* 비밀댓글 선택 */}
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            marginBottom: '0.6rem', cursor: 'pointer',
            color: isSecret ? '#b8a84a' : '#555550',
            fontSize: '0.74rem', fontFamily: 'monospace', letterSpacing: '0.05em',
            userSelect: 'none',
          }}>
            <input
              type="checkbox"
              checked={isSecret}
              onChange={(e) => setIsSecret(e.target.checked)}
              style={{ accentColor: '#8b8b3a', cursor: 'pointer' }}
            />
            🔒 비밀댓글 (작성자와 글쓴이만 볼 수 있어요)
          </label>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={canNegotiate ? '댓글 또는 가격 흥정 내용을 입력하세요...' : '댓글을 입력하세요...'}
              rows={3} maxLength={500} required
              style={{
                flex: 1, background: '#1a1a1a',
                border: '1px solid #2a2a2a', color: '#e8e0d0',
                padding: '0.75rem', fontSize: '0.88rem',
                resize: 'none', lineHeight: 1.6,
                fontFamily: 'inherit', outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={loading || !content.trim()}
              style={{
                padding: '0.75rem 1.25rem',
                background: loading || !content.trim()
                  ? '#1a1a1a'
                  : 'linear-gradient(135deg, #8b0000, #cc0000)',
                border: '1px solid #5c0000',
                color: loading || !content.trim() ? '#3a3a3a' : '#e8e0d0',
                fontSize: '0.82rem', fontWeight: 700,
                cursor: loading || !content.trim() ? 'not-allowed' : 'pointer',
                letterSpacing: '0.1em', whiteSpace: 'nowrap',
                alignSelf: 'flex-end',
              }}
            >
              {loading ? '...' : '등록'}
            </button>
          </div>
          <p style={{ color: '#2a2a2a', fontSize: '0.65rem', fontFamily: 'monospace', marginTop: '0.3rem', textAlign: 'right' }}>
            {content.length} / 500
          </p>
        </form>
      ) : (
        <p style={{ textAlign: 'center', padding: '1rem', color: '#555550', fontSize: '0.82rem' }}>
          댓글을 달려면 로그인이 필요합니다
        </p>
      )}
    </div>
  )
}
