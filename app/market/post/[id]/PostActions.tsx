'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Props {
  postId: string
  tabKey: string
}

export default function PostActions({ postId, tabKey }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    setDeleting(true)

    // 이미지 URL 목록 먼저 가져오기
    const { data: product } = await supabase
      .from('products')
      .select('images')
      .eq('id', postId)
      .single()

    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', postId)

    if (deleteError) {
      setError('삭제 중 오류가 발생했습니다.')
      setDeleting(false)
      return
    }

    // Storage에서 이미지 파일도 삭제
    const images: string[] = product?.images ?? []
    if (images.length > 0) {
      const marker = '/storage/v1/object/public/product-images/'
      const paths = images
        .map(url => {
          const idx = url.indexOf(marker)
          return idx !== -1 ? decodeURIComponent(url.slice(idx + marker.length)) : null
        })
        .filter((p): p is string => p !== null)
      if (paths.length > 0) {
        await supabase.storage.from('product-images').remove(paths)
      }
    }

    router.push(`/market?tab=${tabKey}`)
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      {error && (
        <span style={{ color: '#dc143c', fontSize: '0.72rem', fontFamily: 'monospace' }}>
          {error}
        </span>
      )}

      <Link
        href={`/market/post/${postId}/edit`}
        style={{
          fontSize: '0.75rem',
          color: '#888880',
          border: '1px solid #2a2a2a',
          padding: '0.32rem 0.8rem',
          textDecoration: 'none',
          letterSpacing: '0.1em',
          fontFamily: 'monospace',
        }}
      >
        수정
      </Link>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          style={{
            background: 'transparent',
            border: '1px solid #3a0000',
            color: '#8b0000',
            fontSize: '0.75rem',
            padding: '0.32rem 0.8rem',
            cursor: 'pointer',
            letterSpacing: '0.1em',
            fontFamily: 'monospace',
          }}
        >
          삭제
        </button>
      ) : (
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <span style={{ color: '#dc143c', fontSize: '0.72rem', fontFamily: 'monospace' }}>
            정말 삭제할까요?
          </span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              background: deleting ? '#1a1a1a' : '#8b0000',
              border: '1px solid #5c0000',
              color: deleting ? '#3a3a3a' : '#e8e0d0',
              fontSize: '0.72rem',
              padding: '0.3rem 0.7rem',
              cursor: deleting ? 'not-allowed' : 'pointer',
              fontFamily: 'monospace',
            }}
          >
            {deleting ? '...' : '확인'}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            style={{
              background: 'transparent',
              border: '1px solid #2a2a2a',
              color: '#555550',
              fontSize: '0.72rem',
              padding: '0.3rem 0.7rem',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            취소
          </button>
        </div>
      )}
    </div>
  )
}
