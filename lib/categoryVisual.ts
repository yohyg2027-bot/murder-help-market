// 카테고리별 썸네일 그림 (이모지 + 색상)
// 실제 사진 파일 대신 코드에 한 번만 담아 데이터 사용을 최소화합니다.

type Visual = { emoji: string; color: string }

const CATEGORY_VISUALS: Record<string, Visual> = {
  // 판매/수요 카테고리
  '전자기기': { emoji: '📱', color: '#1e90ff' },
  '의류/잡화': { emoji: '👕', color: '#c77dff' },
  '가구/인테리어': { emoji: '🛋️', color: '#b8860b' },
  '도서/음반': { emoji: '📚', color: '#2e8b57' },
  '스포츠/레저': { emoji: '⚽', color: '#ff8c00' },
  '생활/주방': { emoji: '🍳', color: '#e07a5f' },
  '장난감/취미': { emoji: '🧸', color: '#d2691e' },
  '자동차/바이크': { emoji: '🏍️', color: '#8b0000' },
  '식품/건강': { emoji: '🥗', color: '#6b8e23' },
  '반려동물': { emoji: '🐶', color: '#cd853f' },
  '게임': { emoji: '🎮', color: '#7b68ee' },
  '음악/악기': { emoji: '🎸', color: '#a0522d' },
  '미용/화장품': { emoji: '💄', color: '#db7093' },
  '공구/산업': { emoji: '🔧', color: '#708090' },
  // 커뮤니티 카테고리
  '자유게시판': { emoji: '💬', color: '#2e8b57' },
  '정보공유': { emoji: '📢', color: '#1e90ff' },
  '거래후기': { emoji: '⭐', color: '#b8860b' },
  '질문&답변': { emoji: '❓', color: '#c77dff' },
  '모임/이벤트': { emoji: '🎉', color: '#ff8c00' },
  '공동구매': { emoji: '🛒', color: '#e07a5f' },
  '기타': { emoji: '📦', color: '#888880' },
}

const FALLBACK: Visual = { emoji: '📦', color: '#888880' }

export function getCategoryVisual(category: string | null | undefined): Visual {
  if (!category) return FALLBACK
  return CATEGORY_VISUALS[category] ?? FALLBACK
}
