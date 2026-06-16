'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import RegionSelect from '@/components/RegionSelect'

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

export default function SellPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    title: '',
    category: '',
    price: '',
    condition: 'used',
    location: '',
    description: '',
  })
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5 - imageFiles.length)
    if (files.length === 0) return
    const newPreviews = files.map(f => URL.createObjectURL(f))
    setImageFiles(prev => [...prev, ...files].slice(0, 5))
    setImagePreviews(prev => [...prev, ...newPreviews].slice(0, 5))
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index])
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) return setError('제목을 입력해 주세요.')
    if (!form.category) return setError('카테고리를 선택해 주세요.')
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0)
      return setError('올바른 가격을 입력해 주세요.')

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // 이미지 먼저 업로드
    const imageUrls: string[] = []
    for (const file of imageFiles) {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (!uploadError) {
        const { data } = supabase.storage.from('product-images').getPublicUrl(path)
        imageUrls.push(data.publicUrl)
      }
    }

    const { error: insertError } = await supabase.from('products').insert({
      seller_id: user.id,
      post_type: 'sell',
      title: form.title.trim(),
      category: form.category,
      price: Number(form.price),
      condition: form.condition,
      location: form.location.trim() || null,
      description: form.description.trim() || null,
      images: imageUrls,
    })

    if (insertError) {
      setError('저장 중 오류가 발생했습니다. 다시 시도해 주세요.')
      setLoading(false)
      return
    }

    router.push('/market?tab=sell')
    router.refresh()
  }

  const focusStyle = (e: React.FocusEvent<HTMLElement>) => {
    (e.target as HTMLElement).style.borderColor = '#8b0000'
  }
  const blurStyle = (e: React.FocusEvent<HTMLElement>) => {
    (e.target as HTMLElement).style.borderColor = '#2a2a2a'
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p style={{ color: '#8b0000', fontSize: '0.7rem', letterSpacing: '0.3em', fontFamily: 'monospace', marginBottom: '0.4rem' }}>
          ◆ 판매글 등록
        </p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e8e0d0', letterSpacing: '-0.01em' }}>
          판매글 작성
        </h1>
        <p style={{ color: '#555550', fontSize: '0.82rem', marginTop: '0.3rem', fontStyle: 'italic' }}>
          정확한 정보를 입력할수록 빠른 거래가 이루어집니다
        </p>
      </div>

      <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderTop: '2px solid #dc143c66', padding: '2rem' }}>
        {error && (
          <div style={{ background: 'rgba(139,0,0,0.2)', border: '1px solid #5c0000', color: '#dc143c', padding: '0.75rem 1rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 상품 사진 */}
          <div>
            <label style={labelStyle}>
              상품 사진 <span style={{ color: '#3a3a3a', fontSize: '0.65rem', fontFamily: 'monospace' }}>({imageFiles.length}/5)</span>
            </label>

            {imagePreviews.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                {imagePreviews.map((src, i) => (
                  <div key={i} style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
                    <img
                      src={src}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: '1px solid #2a2a2a' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      style={{
                        position: 'absolute', top: '3px', right: '3px',
                        width: '20px', height: '20px',
                        background: 'rgba(0,0,0,0.75)', border: '1px solid #3a3a3a',
                        color: '#e8e0d0', cursor: 'pointer', fontSize: '0.75rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                    {i === 0 && (
                      <span style={{
                        position: 'absolute', bottom: '3px', left: '3px',
                        background: 'rgba(139,0,0,0.85)', color: '#e8e0d0',
                        fontSize: '0.55rem', padding: '1px 4px', fontFamily: 'monospace',
                      }}>
                        대표
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {imageFiles.length < 5 && (
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.5rem',
                border: '1px dashed #2a2a2a',
                padding: '0.85rem',
                cursor: 'pointer',
                color: '#555550',
                fontSize: '0.82rem',
                transition: 'border-color 0.2s',
              }}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <span style={{ fontSize: '1rem' }}>＋</span>
                사진 추가 (최대 5장)
              </label>
            )}
          </div>

          <div>
            <label style={labelStyle}>제목 <span style={{ color: '#dc143c' }}>*</span></label>
            <input
              type="text" name="title" value={form.title} onChange={handleChange}
              placeholder="판매할 물건의 이름을 입력하세요"
              maxLength={50} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}
            />
            <p style={{ color: '#3a3a3a', fontSize: '0.7rem', marginTop: '0.3rem', textAlign: 'right', fontFamily: 'monospace' }}>
              {form.title.length} / 50
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>카테고리 <span style={{ color: '#dc143c' }}>*</span></label>
              <select name="category" value={form.category} onChange={handleChange}
                style={{ ...inputStyle, cursor: 'pointer' }} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="" style={{ background: '#1a1a1a' }}>선택하세요</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} style={{ background: '#1a1a1a' }}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>상품 상태 <span style={{ color: '#dc143c' }}>*</span></label>
              <select name="condition" value={form.condition} onChange={handleChange}
                style={{ ...inputStyle, cursor: 'pointer' }} onFocus={focusStyle} onBlur={blurStyle}>
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value} style={{ background: '#1a1a1a' }}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>가격 (원) <span style={{ color: '#dc143c' }}>*</span></label>
              <input type="number" name="price" value={form.price} onChange={handleChange}
                placeholder="0" min={0} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <label style={labelStyle}>거래 지역</label>
              <RegionSelect
                value={form.location}
                onChange={(loc) => setForm((prev) => ({ ...prev, location: loc }))}
                accent="#dc143c"
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>상품 설명</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="상품의 상태, 구매 시기, 하자 여부 등 자세히 적어주세요"
              rows={6} maxLength={1000} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
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
              style={{ flex: 1, padding: '0.85rem', background: loading ? '#3a0000' : 'linear-gradient(135deg, #8b0000, #cc0000)', border: '1px solid #5c0000', color: loading ? '#888880' : '#e8e0d0', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.2em', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 0 20px rgba(220,20,60,0.15)', transition: 'all 0.2s' }}>
              {loading ? '등록 중...' : '판매글 등록'}
            </button>
          </div>
        </form>
      </div>

      <p style={{ textAlign: 'center', color: '#2a2a2a', fontSize: '0.65rem', marginTop: '1.5rem', letterSpacing: '0.2em', fontFamily: 'monospace' }}>
        ✦ 허위 매물 등록 시 계정이 정지될 수 있습니다 ✦
      </p>
    </div>
  )
}
