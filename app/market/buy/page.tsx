'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  '전자기기', '의류/잡화', '가구/인테리어', '도서/음반',
  '스포츠/레저', '생활/주방', '장난감/취미', '자동차/바이크',
  '식품/건강', '반려동물', '게임', '음악/악기', '미용/화장품', '공구/산업', '기타',
]

const CONDITIONS = [
  { value: 'new', label: '새상품 (미사용)' },
  { value: 'like_new', label: '거의 새것' },
  { value: 'used', label: '사용감 있음' },
  { value: 'worn', label: '많이 사용함' },
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

export default function BuyPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    title: '',
    category: '',
    price: '',
    condition: '',
    location: '',
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

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error: insertError } = await supabase.from('products').insert({
      seller_id: user.id,
      post_type: 'buy',
      title: form.title.trim(),
      category: form.category,
      price: form.price ? Number(form.price) : null,
      condition: form.condition || null,
      location: form.location.trim() || null,
      description: form.description.trim() || null,
    })

    if (insertError) {
      setError('저장 중 오류가 발생했습니다. 다시 시도해 주세요.')
      setLoading(false)
      return
    }

    router.push('/market?tab=buy')
    router.refresh()
  }

  const focusStyle = (e: React.FocusEvent<HTMLElement>) => {
    (e.target as HTMLElement).style.borderColor = '#1e90ff'
  }
  const blurStyle = (e: React.FocusEvent<HTMLElement>) => {
    (e.target as HTMLElement).style.borderColor = '#2a2a2a'
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p style={{ color: '#1e90ff', fontSize: '0.7rem', letterSpacing: '0.3em', fontFamily: 'monospace', marginBottom: '0.4rem' }}>
          ◆ 수요글 등록
        </p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e8e0d0', letterSpacing: '-0.01em' }}>
          수요글 작성
        </h1>
        <p style={{ color: '#555550', fontSize: '0.82rem', marginTop: '0.3rem', fontStyle: 'italic' }}>
          원하는 물건을 구체적으로 적을수록 빠르게 찾을 수 있습니다
        </p>
      </div>

      <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderTop: '2px solid #1e90ff66', padding: '2rem' }}>
        {error && (
          <div style={{ background: 'rgba(30,144,255,0.1)', border: '1px solid #1e90ff44', color: '#1e90ff', padding: '0.75rem 1rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label style={labelStyle}>찾는 물건 제목 <span style={{ color: '#1e90ff' }}>*</span></label>
            <input
              type="text" name="title" value={form.title} onChange={handleChange}
              placeholder="예) 갤럭시 S24 구합니다, 나이키 운동화 구해요"
              maxLength={50} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}
            />
            <p style={{ color: '#3a3a3a', fontSize: '0.7rem', marginTop: '0.3rem', textAlign: 'right', fontFamily: 'monospace' }}>
              {form.title.length} / 50
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>카테고리 <span style={{ color: '#1e90ff' }}>*</span></label>
              <select name="category" value={form.category} onChange={handleChange}
                style={{ ...inputStyle, cursor: 'pointer' }} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="" style={{ background: '#1a1a1a' }}>선택하세요</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} style={{ background: '#1a1a1a' }}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>희망 상태 (선택)</label>
              <select name="condition" value={form.condition} onChange={handleChange}
                style={{ ...inputStyle, cursor: 'pointer' }} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="" style={{ background: '#1a1a1a' }}>무관</option>
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value} style={{ background: '#1a1a1a' }}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>최대 예산 (원, 선택)</label>
              <input type="number" name="price" value={form.price} onChange={handleChange}
                placeholder="0" min={0} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <label style={labelStyle}>거래 희망 지역 (선택)</label>
              <input type="text" name="location" value={form.location} onChange={handleChange}
                placeholder="예) 서울 강남구" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>상세 내용</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="원하는 조건, 색상, 사이즈, 수량 등 자세히 적어주세요"
              rows={6} maxLength={1000}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
              onFocus={focusStyle} onBlur={blurStyle} />
            <p style={{ color: '#3a3a3a', fontSize: '0.7rem', marginTop: '0.3rem', textAlign: 'right', fontFamily: 'monospace' }}>
              {form.description.length} / 1000
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button type="button" onClick={() => router.back()}
              style={{ flex: '0 0 auto', padding: '0.85rem 1.5rem', background: 'transparent', border: '1px solid #2a2a2a', color: '#888880', fontSize: '0.85rem', letterSpacing: '0.1em', cursor: 'pointer' }}>
              취소
            </button>
            <button type="submit" disabled={loading}
              style={{ flex: 1, padding: '0.85rem', background: loading ? '#0a1a2a' : 'linear-gradient(135deg, #0050a0, #1e90ff)', border: '1px solid #1e90ff44', color: loading ? '#888880' : '#e8e0d0', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.2em', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 0 20px rgba(30,144,255,0.15)', transition: 'all 0.2s' }}>
              {loading ? '등록 중...' : '수요글 등록'}
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
