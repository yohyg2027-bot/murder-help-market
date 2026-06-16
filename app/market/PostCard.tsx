'use client'

import { useState } from 'react'
import Link from 'next/link'

const CONDITION_LABEL: Record<string, string> = {
  new: '새상품',
  like_new: '거의 새것',
  used: '사용감 있음',
  worn: '많이 사용함',
}

export type TabType = 'sell' | 'buy' | 'community'

export type TabConfig = {
  accent: string
  pricePrefix?: string
}

export type Post = {
  id: string
  title: string
  price: number | null
  category: string
  condition: string | null
  location: string | null
  created_at: string
  post_type: string
  images: string[] | null
  seller: { nickname: string } | null
  likeCount?: number
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

export default function PostCard({ post, cfg }: { post: Post; cfg: TabConfig }) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIdx, setPreviewIdx] = useState(0)

  const images = post.images ?? []
  const hasImages = images.length > 0

  const openPreview = (idx: number) => {
    setPreviewIdx(idx)
    setPreviewOpen(true)
  }

  const closePreview = () => setPreviewOpen(false)

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreviewIdx(i => (i - 1 + images.length) % images.length)
  }

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreviewIdx(i => (i + 1) % images.length)
  }

  return (
    <>
      <div style={{
        background: '#111111',
        border: '1px solid #2a2a2a',
        borderTop: `2px solid ${cfg.accent}55`,
        overflow: 'hidden',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* 썸네일 — 클릭하면 미리보기 모달 */}
        {hasImages ? (
          <div
            onClick={() => openPreview(0)}
            style={{ position: 'relative', cursor: 'zoom-in', flexShrink: 0 }}
          >
            <img
              src={images[0]}
              alt=""
              style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }}
            />
            {/* 이미지 개수 배지 */}
            {images.length > 1 && (
              <span style={{
                position: 'absolute', bottom: '6px', right: '8px',
                background: 'rgba(0,0,0,0.65)',
                color: '#e8e0d0',
                fontSize: '0.62rem', fontFamily: 'monospace',
                padding: '2px 6px',
                letterSpacing: '0.05em',
              }}>
                +{images.length - 1}
              </span>
            )}
            {/* 호버 오버레이 */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'transparent',
              fontSize: '0.72rem', letterSpacing: '0.1em', fontFamily: 'monospace',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.background = 'rgba(0,0,0,0.45)'
                el.style.color = '#e8e0d0'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.background = 'rgba(0,0,0,0)'
                el.style.color = 'transparent'
              }}
            >
              🔍 미리보기
            </div>
          </div>
        ) : (
          /* 이미지 없는 카드 — 플레이스홀더 */
          <div style={{
            width: '100%', height: '150px', flexShrink: 0,
            background: '#0d0d0d',
            borderBottom: '1px solid #1e1e1e',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '0.4rem',
          }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="10" width="28" height="20" rx="1" stroke="#2e2e2e" strokeWidth="1.5"/>
              <circle cx="18" cy="20" r="5.5" stroke="#2e2e2e" strokeWidth="1.5"/>
              <path d="M13 10 L14.5 7 H21.5 L23 10" stroke="#2e2e2e" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="27" cy="14" r="1.2" fill="#2e2e2e"/>
            </svg>
            <span style={{ fontSize: '0.6rem', color: '#2e2e2e', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
              NO IMAGE
            </span>
          </div>
        )}

        {/* 카드 본문 — 클릭하면 상세 페이지 이동 */}
        <Link
          href={`/market/post/${post.id}`}
          style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', flex: 1 }}
        >
          <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* 카테고리 + 상태 */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.65rem', letterSpacing: '0.1em',
                padding: '0.15rem 0.5rem',
                background: `${cfg.accent}22`,
                color: cfg.accent,
                border: `1px solid ${cfg.accent}44`,
                fontFamily: 'monospace',
              }}>
                {post.category}
              </span>
              {post.condition && (
                <span style={{
                  fontSize: '0.65rem', letterSpacing: '0.1em',
                  padding: '0.15rem 0.5rem',
                  background: '#1a1a1a', color: '#555550',
                  border: '1px solid #2a2a2a', fontFamily: 'monospace',
                }}>
                  {CONDITION_LABEL[post.condition] ?? post.condition}
                </span>
              )}
            </div>

            {/* 제목 */}
            <h3 style={{
              color: '#e8e0d0', fontSize: '0.95rem', fontWeight: 600,
              marginBottom: '0.5rem',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {post.title}
            </h3>

            {/* 가격 */}
            {post.price !== null && (
              <p style={{
                color: post.post_type === 'buy' ? '#1e90ff' : '#b8860b',
                fontSize: '1.05rem', fontWeight: 700,
                marginBottom: '0.75rem', letterSpacing: '0.02em',
              }}>
                {cfg.pricePrefix ?? ''}{post.price.toLocaleString('ko-KR')}원
              </p>
            )}

            {/* 하단 */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: '0.7rem', color: '#3a3a3a', fontFamily: 'monospace',
              marginTop: 'auto', gap: '0.5rem',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {post.location ?? (post.post_type === 'community' ? '' : '지역 미정')}
                </span>
                {!!post.likeCount && post.likeCount > 0 && (
                  <span style={{ color: '#8b3a3a', flexShrink: 0 }}>♥ {post.likeCount}</span>
                )}
              </span>
              <span style={{ flexShrink: 0 }}>{post.seller?.nickname ?? '익명'} · {timeAgo(post.created_at)}</span>
            </div>
          </div>
        </Link>
      </div>

      {/* 이미지 미리보기 모달 */}
      {previewOpen && hasImages && (
        <div
          onClick={closePreview}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.88)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={closePreview}
            style={{
              position: 'fixed', top: '1rem', right: '1.25rem',
              background: 'rgba(0,0,0,0.7)', border: '1px solid #3a3a3a',
              color: '#e8e0d0', width: '36px', height: '36px',
              fontSize: '1.2rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 10000,
            }}
          >
            ×
          </button>

          {/* 상품 정보 */}
          <div
            onClick={e => e.stopPropagation()}
            style={{ marginBottom: '0.75rem', textAlign: 'center' }}
          >
            <p style={{ color: '#e8e0d0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.2rem' }}>
              {post.title}
            </p>
            {post.price !== null && (
              <p style={{ color: '#b8860b', fontSize: '1.1rem', fontWeight: 700 }}>
                {cfg.pricePrefix ?? ''}{post.price.toLocaleString('ko-KR')}원
              </p>
            )}
          </div>

          {/* 메인 이미지 */}
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'relative', maxWidth: '680px', width: '100%' }}
          >
            <img
              src={images[previewIdx]}
              alt={`이미지 ${previewIdx + 1}`}
              style={{
                width: '100%', maxHeight: '65vh',
                objectFit: 'contain', display: 'block',
                border: '1px solid #2a2a2a',
              }}
            />

            {images.length > 1 && (
              <>
                <button onClick={prevImg} style={{
                  position: 'absolute', left: '-44px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.7)', border: '1px solid #2a2a2a',
                  color: '#e8e0d0', width: '36px', height: '36px',
                  cursor: 'pointer', fontSize: '1.3rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>‹</button>
                <button onClick={nextImg} style={{
                  position: 'absolute', right: '-44px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.7)', border: '1px solid #2a2a2a',
                  color: '#e8e0d0', width: '36px', height: '36px',
                  cursor: 'pointer', fontSize: '1.3rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>›</button>
                <div style={{
                  position: 'absolute', bottom: '8px', right: '10px',
                  background: 'rgba(0,0,0,0.65)', color: '#888880',
                  fontSize: '0.68rem', padding: '2px 8px', fontFamily: 'monospace',
                }}>
                  {previewIdx + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          {/* 썸네일 목록 */}
          {images.length > 1 && (
            <div
              onClick={e => e.stopPropagation()}
              style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem', overflowX: 'auto' }}
            >
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setPreviewIdx(i)}
                  style={{
                    flexShrink: 0, width: '56px', height: '56px',
                    padding: 0, cursor: 'pointer', background: 'none',
                    border: `2px solid ${i === previewIdx ? '#dc143c' : '#2a2a2a'}`,
                    overflow: 'hidden',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </button>
              ))}
            </div>
          )}

          {/* 상세 페이지 이동 링크 */}
          <Link
            href={`/market/post/${post.id}`}
            onClick={e => e.stopPropagation()}
            style={{
              marginTop: '1rem',
              color: '#dc143c', fontSize: '0.8rem',
              border: '1px solid #dc143c44',
              padding: '0.45rem 1.25rem',
              textDecoration: 'none',
              letterSpacing: '0.1em',
              background: '#dc143c11',
            }}
          >
            상세 페이지로 이동 →
          </Link>
        </div>
      )}
    </>
  )
}
