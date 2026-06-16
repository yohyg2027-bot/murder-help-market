'use client'

import { useState } from 'react'

export default function ImageGallery({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0)

  if (images.length === 0) return null

  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length)
  const next = () => setCurrent(i => (i + 1) % images.length)

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* 메인 이미지 */}
      <div style={{ position: 'relative', background: '#0a0a0a', border: '1px solid #1a1a1a', overflow: 'hidden' }}>
        <img
          src={images[current]}
          alt={`상품 이미지 ${current + 1}`}
          style={{
            width: '100%',
            maxHeight: '420px',
            objectFit: 'contain',
            display: 'block',
          }}
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              style={{
                position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.65)', border: '1px solid #2a2a2a',
                color: '#e8e0d0', width: '34px', height: '34px',
                cursor: 'pointer', fontSize: '1.2rem', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              ‹
            </button>
            <button
              onClick={next}
              style={{
                position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.65)', border: '1px solid #2a2a2a',
                color: '#e8e0d0', width: '34px', height: '34px',
                cursor: 'pointer', fontSize: '1.2rem', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              ›
            </button>
            <div style={{
              position: 'absolute', bottom: '0.6rem', right: '0.75rem',
              background: 'rgba(0,0,0,0.65)', color: '#888880',
              fontSize: '0.68rem', padding: '0.15rem 0.5rem',
              fontFamily: 'monospace', letterSpacing: '0.05em',
            }}>
              {current + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* 썸네일 목록 */}
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', overflowX: 'auto', paddingBottom: '2px' }}>
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                flexShrink: 0,
                width: '62px', height: '62px',
                padding: 0,
                border: `2px solid ${i === current ? '#dc143c' : '#1a1a1a'}`,
                cursor: 'pointer',
                background: 'none',
                overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}
            >
              <img
                src={src}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
