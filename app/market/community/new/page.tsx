'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  '자유게시판', '정보공유', '거래후기', '질문&답변', '모임/이벤트', '공동구매', '기타',
]

const inputStyle = {
  width: '100%',
  background: '#1a1a1a',
  border: '1px solid #2a2a2a',
  color: '#e8e0d0',
  padding: '0.75rem 1rem',
  fontSize: '0.9rem',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s',
}

const labelStyle = {
  display: 'block',
  color: '#888880',
  fontSize: '0.75rem',
  letterSpacing: '0.15em',
  marginBottom: '0.5rem',
}

export default function CommunityNewPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) return setError('제목을 입력해 주세요.')
    if (!form.category) return setError('카테고리를 선택해 주세요.')
    if (!form.description.trim()) return setError('내용을 입력해 주세요.')

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error: insertError } = await supabase.from('products').insert({
      seller_id: user.id,
      post_type: 'community',
      title: form.title.trim(),
      category: form.category,
      description: form.description.trim(),
      price: null,
      condition: null,
      location: null,
    })

    if (insertError) {
      setError('저장 중 오류가 발생했습니다. 다시 시도해 주세요.')
      setLoading(false)
      return
    }

    router.push('/market?tab=community')
    router.refresh()
  }

  const focusStyle = (e: React.FocusEvent<HTMLElement>) => {
    (e.target as HTMLElement).style.borderColor = '#2e8b57'
  }
  const blurStyle = (e: React.FocusEvent<HTMLElement>) => {
    (e.target as HTMLElement).style.borderColor = '#2a2a2a'
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p style={{ color: '#2e8b57', fontSize: '0.7rem', letterSpacing: '0.3em', fontFamily: 'monospace', marginBottom: '0.4rem' }}>
          ◆ 커뮤니티 글 등록
        </p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e8e0d0', letterSpacing: '-0.01em' }}>
          커뮤니티 글 작성
        </h1>
        <p style={{ color: '#555550', fontSize: '0.82rem', marginTop: '0.3rem', fontStyle: 'italic' }}>
          거래 정보, 후기, 자유로운 이야기를 나눠보세요
        </p>
      </div>

      <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderTop: '2px solid #2e8b5766', padding: '2rem' }}>
        {error && (
          <div style={{ background: 'rgba(46,139,87,0.1)', border: '1px solid #2e8b5744', color: '#2e8b57', padding: '0.75rem 1rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label style={labelStyle}>제목 <span style={{ color: '#2e8b57' }}>*</span></label>
            <input
              type="text" name="title" value={form.title} onChange={handleChange}
              placeholder="글 제목을 입력하세요"
              maxLength={50} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}
            />
            <p style={{ color: '#3a3a3a', fontSize: '0.7rem', marginTop: '0.3rem', textAlign: 'right', fontFamily: 'monospace' }}>
              {form.title.length} / 50
            </p>
          </div>

          <div>
            <label style={labelStyle}>카테고리 <span style={{ color: '#2e8b57' }}>*</span></label>
            <select name="category" value={form.category} onChange={handleChange}
              style={{ ...inputStyle, cursor: 'pointer' }} onFocus={focusStyle} onBlur={blurStyle}>
              <option value="" style={{ background: '#1a1a1a' }}>선택하세요</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c} style={{ background: '#1a1a1a' }}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>내용 <span style={{ color: '#2e8b57' }}>*</span></label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="자유롭게 내용을 작성해 주세요"
              rows={10} maxLength={2000}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.8 }}
              onFocus={focusStyle} onBlur={blurStyle} />
            <p style={{ color: '#3a3a3a', fontSize: '0.7rem', marginTop: '0.3rem', textAlign: 'right', fontFamily: 'monospace' }}>
              {form.description.length} / 2000
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button type="button" onClick={() => router.back()}
              style={{ flex: '0 0 auto', padding: '0.85rem 1.5rem', background: 'transparent', border: '1px solid #2a2a2a', color: '#888880', fontSize: '0.85rem', letterSpacing: '0.1em', cursor: 'pointer' }}>
              취소
            </button>
            <button type="submit" disabled={loading}
              style={{ flex: 1, padding: '0.85rem', background: loading ? '#0a1a0f' : 'linear-gradient(135deg, #1a5c35, #2e8b57)', border: '1px solid #2e8b5744', color: loading ? '#888880' : '#e8e0d0', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.2em', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 0 20px rgba(46,139,87,0.15)', transition: 'all 0.2s' }}>
              {loading ? '등록 중...' : '글 등록'}
            </button>
          </div>
        </form>
      </div>

      <p style={{ textAlign: 'center', color: '#2a2a2a', fontSize: '0.65rem', marginTop: '1.5rem', letterSpacing: '0.2em', fontFamily: 'monospace' }}>
        ✦ 비밀은 지켜드립니다 ✦
      </p>
    </div>
  )
}
