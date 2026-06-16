'use client'

import { SIDO_LIST, SIGUNGU_MAP, buildLocation, parseLocation } from '@/lib/regions'

interface Props {
  // "서울 강남구" 형식의 현재 값
  value: string
  onChange: (location: string) => void
  accent?: string
}

const selectStyle = {
  width: '100%',
  background: '#1a1a1a',
  border: '1px solid #2a2a2a',
  color: '#e8e0d0',
  padding: '0.75rem 1rem',
  fontSize: '0.9rem',
  outline: 'none',
  fontFamily: 'inherit',
  cursor: 'pointer',
  transition: 'border-color 0.2s',
}

export default function RegionSelect({ value, onChange, accent = '#8b0000' }: Props) {
  const { sido, sigungu } = parseLocation(value)
  const sigunguList = sido ? (SIGUNGU_MAP[sido] ?? []) : []

  const focusStyle = (e: React.FocusEvent<HTMLElement>) => {
    (e.target as HTMLElement).style.borderColor = accent
  }
  const blurStyle = (e: React.FocusEvent<HTMLElement>) => {
    (e.target as HTMLElement).style.borderColor = '#2a2a2a'
  }

  const handleSido = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextSido = e.target.value
    // 시/도를 바꾸면 구/군은 '전체'로 초기화
    onChange(nextSido ? buildLocation(nextSido, '전체') : '')
  }

  const handleSigungu = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(buildLocation(sido, e.target.value))
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
      <select value={sido} onChange={handleSido} style={selectStyle} onFocus={focusStyle} onBlur={blurStyle}>
        <option value="" style={{ background: '#1a1a1a' }}>시/도 선택</option>
        {SIDO_LIST.map((s) => (
          <option key={s} value={s} style={{ background: '#1a1a1a' }}>{s}</option>
        ))}
      </select>

      <select
        value={sigungu}
        onChange={handleSigungu}
        disabled={!sido || sigunguList.length === 0}
        style={{
          ...selectStyle,
          opacity: !sido || sigunguList.length === 0 ? 0.5 : 1,
          cursor: !sido || sigunguList.length === 0 ? 'not-allowed' : 'pointer',
        }}
        onFocus={focusStyle}
        onBlur={blurStyle}
      >
        <option value="" style={{ background: '#1a1a1a' }}>
          {sigunguList.length === 0 ? '전체' : '시/군/구 (전체)'}
        </option>
        {sigunguList.map((g) => (
          <option key={g} value={g} style={{ background: '#1a1a1a' }}>{g}</option>
        ))}
      </select>
    </div>
  )
}
