'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const SELL_BUY_CATEGORIES = [
  '전자기기', '의류/잡화', '가구/인테리어', '도서/음반',
  '스포츠/레저', '생활/주방', '장난감/취미', '자동차/바이크',
  '식품/건강', '반려동물', '게임', '음악/악기', '미용/화장품', '공구/산업', '기타',
]

const COMMUNITY_CATEGORIES = [
  '자유게시판', '정보공유', '거래후기', '질문&답변', '모임/이벤트', '공동구매', '기타',
]

const CONDITIONS = [
  { value: 'new', label: '새상품 (미사용)' },
  { value: 'like_new', label: '거의 새것' },
  { value: 'used', label: '사용감 있음' },
  { value: 'worn', label: '많이 사용함' },
]

const POST_TYPE_CONFIG: Record<string, { label: string; accent: string; tabKey: string }> = {
  sell: { label: '판매글', accent: '#dc143c', tabKey: 'sell' },
  buy:  { label: '수요글', accent: '#1e90ff', tabKey: 'buy'  },
  community: { label: '커뮤니티', accent: '#2e8b57', tabKey: 'community' },
}

interface InitialData {
  title: string
  category: string
  price: number | null
  condition: string | null
  location: string | null
  description: string | null
  post_type: string
  images: string[]
}

interface Props {
  postId: string
  initialData: InitialData
}

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

function extractStoragePath(url: string): string | null {
  const marker = '/storage/v1/object/public/product-images/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(url.slice(idx + marker.length))
}

export default function EditForm({ postId, initialData }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const cfg = POST_TYPE_CONFIG[initialData.post_type] ?? POST_TYPE_CONFIG.sell
  const isCommunity = initialData.post_type === 'community'
  const isBuy = initialData.post_type === 'buy'
  const categories = isCommunity ? COMMUNITY_CATEGORIES : SELL_BUY_CATEGORIES

  const [form, setForm] = useState({
    title: initialData.title,
    category: initialData.category,
    price: initialData.price?.toString() ?? '',
    condition: initialData.condition ?? '',
    location: initialData.location ?? '',
    description: initialData.description ?? '',
  })

  // 이미지 관련 상태
  const [existingImages, setExistingImages] = useState<string[]>(initialData.images)
  const [removedImages, setRemovedImages] = useState<string[]>([])
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleRemoveExisting = (url: string) => {
    setExistingImages(prev => prev.filter(u => u !== url))
    setRemovedImages(prev => [...prev, url])
  }

  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const remaining = 5 - existingImages.length - newImageFiles.length
    if (remaining <= 0) return
    const files = Array.from(e.target.files || []).slice(0, remaining)
    if (files.length === 0) return
    const previews = files.map(f => URL.createObjectURL(f))
    setNewImageFiles(prev => [...prev, ...files])
    setNewImagePreviews(prev => [...prev, ...previews])
    e.target.value = ''
  }

  const handleRemoveNew = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index])
    setNewImageFiles(prev => prev.filter((_, i) => i !== index))
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const totalImages = existingImages.length + newImageFiles.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) return setError('제목을 입력해 주세요.')
    if (!form.category) return setError('카테고리를 선택해 주세요.')
    if (!isCommunity && !isBuy && (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0))
      return setError('올바른 가격을 입력해 주세요.')
    if (isCommunity && !form.description.trim())
      return setError('내용을 입력해 주세요.')

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // 삭제된 이미지를 Storage에서 제거
    for (const url of removedImages) {
      const path = extractStoragePath(url)
      if (path) {
        await supabase.storage.from('product-images').remove([path])
      }
    }

    // 새 이미지 업로드
    const newUrls: string[] = []
    for (const file of newImageFiles) {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (!uploadError) {
        const { data } = supabase.storage.from('product-images').getPublicUrl(path)
        newUrls.push(data.publicUrl)
      }
    }

    const updatePayload: Record<string, unknown> = {
      title: form.title.trim(),
      category: form.category,
      description: form.description.trim() || null,
      images: [...existingImages, ...newUrls],
      updated_at: new Date().toISOString(),
    }

    if (!isCommunity) {
      updatePayload.price = form.price ? Number(form.price) : null
      updatePayload.condition = form.condition || null
      updatePayload.location = form.location.trim() || null
    }

    const { error: updateError } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', postId)

    if (updateError) {
      setError('수정 중 오류가 발생했습니다. 다시 시도해 주세요.')
      setLoading(false)
      return
    }

    router.push(`/market/post/${postId}`)
    router.refresh()
  }

  const focusStyle = (e: React.FocusEvent<HTMLElement>) => {
    (e.target as HTMLElement).style.borderColor = cfg.accent
  }
  const blurStyle = (e: React.FocusEvent<HTMLElement>) => {
    (e.target as HTMLElement).style.borderColor = '#2a2a2a'
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p style={{ color: cfg.accent, fontSize: '0.7rem', letterSpacing: '0.3em', fontFamily: 'monospace', marginBottom: '0.4rem' }}>
          ◆ {cfg.label} 수정
        </p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e8e0d0', letterSpacing: '-0.01em' }}>
          글 수정하기
        </h1>
      </div>

      <div style={{ background: '#111111', border: '1px solid #2a2a2a', borderTop: `2px solid ${cfg.accent}66`, padding: '2rem' }}>
        {error && (
          <div style={{ background: `${cfg.accent}1a`, border: `1px solid ${cfg.accent}44`, color: cfg.accent, padding: '0.75rem 1rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 이미지 관리 */}
          <div>
            <label style={labelStyle}>
              상품 사진 <span style={{ color: '#3a3a3a', fontSize: '0.65rem', fontFamily: 'monospace' }}>({totalImages}/5)</span>
            </label>

            {/* 기존 이미지 */}
            {(existingImages.length > 0 || newImagePreviews.length > 0) && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                {existingImages.map((url, i) => (
                  <div key={url} style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
                    <img
                      src={url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: '1px solid #2a2a2a' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExisting(url)}
                      style={{
                        position: 'absolute', top: '3px', right: '3px',
                        width: '20px', height: '20px',
                        background: 'rgba(0,0,0,0.75)', border: '1px solid #3a3a3a',
                        color: '#e8e0d0', cursor: 'pointer', fontSize: '0.75rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      ×
                    </button>
                    {i === 0 && newImageFiles.length === 0 && (
                      <span style={{
                        position: 'absolute', bottom: '3px', left: '3px',
                        background: `rgba(0,0,0,0.75)`, color: cfg.accent,
                        fontSize: '0.55rem', padding: '1px 4px', fontFamily: 'monospace',
                        border: `1px solid ${cfg.accent}44`,
                      }}>
                        대표
                      </span>
                    )}
                  </div>
                ))}

                {/* 새로 추가된 이미지 미리보기 */}
                {newImagePreviews.map((src, i) => (
                  <div key={`new-${i}`} style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
                    <img
                      src={src}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: `1px solid ${cfg.accent}44` }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveNew(i)}
                      style={{
                        position: 'absolute', top: '3px', right: '3px',
                        width: '20px', height: '20px',
                        background: 'rgba(0,0,0,0.75)', border: '1px solid #3a3a3a',
                        color: '#e8e0d0', cursor: 'pointer', fontSize: '0.75rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      ×
                    </button>
                    <span style={{
                      position: 'absolute', bottom: '3px', left: '3px',
                      background: 'rgba(0,0,0,0.75)', color: '#888880',
                      fontSize: '0.55rem', padding: '1px 4px', fontFamily: 'monospace',
                    }}>
                      NEW
                    </span>
                  </div>
                ))}
              </div>
            )}

            {totalImages < 5 && (
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.5rem',
                border: '1px dashed #2a2a2a',
                padding: '0.85rem',
                cursor: 'pointer',
                color: '#555550',
                fontSize: '0.82rem',
              }}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleNewImageChange}
                  style={{ display: 'none' }}
                />
                <span style={{ fontSize: '1rem' }}>＋</span>
                사진 추가 (최대 5장)
              </label>
            )}
          </div>

          {/* 제목 */}
          <div>
            <label style={labelStyle}>제목 <span style={{ color: cfg.accent }}>*</span></label>
            <input
              type="text" name="title" value={form.title} onChange={handleChange}
              maxLength={50} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}
            />
            <p style={{ color: '#3a3a3a', fontSize: '0.7rem', marginTop: '0.3rem', textAlign: 'right', fontFamily: 'monospace' }}>
              {form.title.length} / 50
            </p>
          </div>

          {/* 카테고리 + 상태 */}
          <div style={{ display: 'grid', gridTemplateColumns: isCommunity ? '1fr' : '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>카테고리 <span style={{ color: cfg.accent }}>*</span></label>
              <select name="category" value={form.category} onChange={handleChange}
                style={{ ...inputStyle, cursor: 'pointer' }} onFocus={focusStyle} onBlur={blurStyle}>
                {categories.map((c) => (
                  <option key={c} value={c} style={{ background: '#1a1a1a' }}>{c}</option>
                ))}
              </select>
            </div>
            {!isCommunity && (
              <div>
                <label style={labelStyle}>{isBuy ? '희망 상태 (선택)' : '상품 상태'}</label>
                <select name="condition" value={form.condition} onChange={handleChange}
                  style={{ ...inputStyle, cursor: 'pointer' }} onFocus={focusStyle} onBlur={blurStyle}>
                  {isBuy && <option value="" style={{ background: '#1a1a1a' }}>무관</option>}
                  {CONDITIONS.map((c) => (
                    <option key={c.value} value={c.value} style={{ background: '#1a1a1a' }}>{c.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 가격 + 지역 */}
          {!isCommunity && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>
                  {isBuy ? '최대 예산 (원, 선택)' : '가격 (원)'}
                  {!isBuy && <span style={{ color: cfg.accent }}> *</span>}
                </label>
                <input type="number" name="price" value={form.price} onChange={handleChange}
                  placeholder="0" min={0} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
              <div>
                <label style={labelStyle}>거래 지역</label>
                <input type="text" name="location" value={form.location} onChange={handleChange}
                  placeholder="예) 서울 강남구" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
            </div>
          )}

          {/* 설명 */}
          <div>
            <label style={labelStyle}>
              {isCommunity ? '내용' : '상품 설명'}
              {isCommunity && <span style={{ color: cfg.accent }}> *</span>}
            </label>
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={isCommunity ? 10 : 6}
              maxLength={isCommunity ? 2000 : 1000}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
              onFocus={focusStyle} onBlur={blurStyle} />
            <p style={{ color: '#3a3a3a', fontSize: '0.7rem', marginTop: '0.3rem', textAlign: 'right', fontFamily: 'monospace' }}>
              {form.description.length} / {isCommunity ? 2000 : 1000}
            </p>
          </div>

          {/* 버튼 */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button type="button" onClick={() => router.back()}
              style={{ flex: '0 0 auto', padding: '0.85rem 1.5rem', background: 'transparent', border: '1px solid #2a2a2a', color: '#888880', fontSize: '0.85rem', letterSpacing: '0.1em', cursor: 'pointer' }}>
              취소
            </button>
            <button type="submit" disabled={loading}
              style={{ flex: 1, padding: '0.85rem', background: loading ? '#1a1a1a' : `linear-gradient(135deg, ${cfg.accent}cc, ${cfg.accent})`, border: `1px solid ${cfg.accent}66`, color: loading ? '#3a3a3a' : '#e8e0d0', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.2em', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
              {loading ? '수정 중...' : '수정 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
