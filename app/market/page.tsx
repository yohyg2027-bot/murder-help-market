import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SalesRankingSidebar from './SalesRankingSidebar'
import PostCard, { type Post, type TabType } from './PostCard'
import { SIDO_LIST, SIGUNGU_MAP, PRICE_RANGES, getPriceRange } from '@/lib/regions'

const SELL_BUY_CATEGORIES = [
  '전체', '전자기기', '의류/잡화', '가구/인테리어', '도서/음반',
  '스포츠/레저', '생활/주방', '장난감/취미', '자동차/바이크',
  '식품/건강', '반려동물', '게임', '음악/악기', '미용/화장품', '공구/산업', '기타',
]

const COMMUNITY_CATEGORIES = [
  '전체', '자유게시판', '정보공유', '거래후기', '질문&답변', '모임/이벤트', '공동구매', '기타',
]

const TAB_CONFIG: Record<TabType, {
  label: string
  writeHref: string
  writeLabel: string
  accent: string
  categories: string[]
  emptyMsg: string
  pricePrefix?: string
}> = {
  sell: {
    label: '판매글',
    writeHref: '/market/sell',
    writeLabel: '+ 판매하기',
    accent: '#dc143c',
    categories: SELL_BUY_CATEGORIES,
    emptyMsg: '아직 등록된 판매글이 없습니다',
  },
  buy: {
    label: '수요글',
    writeHref: '/market/buy',
    writeLabel: '+ 수요글 쓰기',
    accent: '#1e90ff',
    categories: SELL_BUY_CATEGORIES,
    emptyMsg: '아직 등록된 수요글이 없습니다',
    pricePrefix: '최대 ',
  },
  community: {
    label: '커뮤니티',
    writeHref: '/market/community/new',
    writeLabel: '+ 글 쓰기',
    accent: '#2e8b57',
    categories: COMMUNITY_CATEGORIES,
    emptyMsg: '아직 등록된 게시글이 없습니다',
  },
}

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; cat?: string; sido?: string; gu?: string; price?: string }>
}) {
  const { tab: rawTab = 'sell', cat: categoryFilter, sido = '', gu = '', price: priceKey = '' } = await searchParams
  const tab = (rawTab in TAB_CONFIG ? rawTab : 'sell') as TabType
  const cfg = TAB_CONFIG[tab]
  const showLocationPrice = tab !== 'community'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', user!.id)
    .single()

  // 필터를 하나씩 쌓아가며 조건을 추가합니다
  let query = supabase
    .from('products')
    .select('id, title, price, category, condition, location, created_at, post_type, images, seller:profiles!seller_id(nickname), likes(count)')
    .eq('status', 'active')
    .eq('post_type', tab)

  if (categoryFilter && categoryFilter !== '전체') {
    query = query.eq('category', categoryFilter)
  }

  // 지역 필터: 구/군까지 고르면 정확히, 시/도만 고르면 해당 시/도 전체
  if (showLocationPrice && sido) {
    query = gu
      ? query.eq('location', `${sido} ${gu}`)
      : query.like('location', `${sido}%`)
  }

  // 가격대 필터
  const range = showLocationPrice ? getPriceRange(priceKey) : null
  if (range) {
    query = query.gte('price', range.min)
    if (range.max !== null) query = query.lte('price', range.max)
  }

  query = query.order('created_at', { ascending: false }).limit(48)

  const { data: postsData } = await query

  const posts = (postsData ?? []).map((p) => {
    const likesField = (p as { likes?: { count: number }[] }).likes
    const likeCount = Array.isArray(likesField) ? (likesField[0]?.count ?? 0) : 0
    return { ...p, likeCount }
  }) as unknown as Post[]

  const activeCat = categoryFilter ?? '전체'
  const sigunguList = sido ? (SIGUNGU_MAP[sido] ?? []) : []

  // 현재 필터 상태를 유지하면서 일부만 바꾼 링크를 만듭니다
  const makeHref = (overrides: Record<string, string | undefined>) => {
    const params: Record<string, string | undefined> = {
      tab,
      cat: activeCat !== '전체' ? activeCat : undefined,
      sido: sido || undefined,
      gu: gu || undefined,
      price: priceKey || undefined,
      ...overrides,
    }
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '' && v !== '전체')
      .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
      .join('&')
    return `/market?${qs}`
  }

  // 필터 칩 공통 스타일
  const chip = (active: boolean) => ({
    padding: '0.25rem 0.65rem',
    fontSize: '0.7rem',
    fontFamily: 'monospace',
    letterSpacing: '0.05em',
    textDecoration: 'none',
    background: active ? `${cfg.accent}22` : 'transparent',
    color: active ? cfg.accent : '#3a3a3a',
    border: `1px solid ${active ? cfg.accent + '66' : '#2a2a2a'}`,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
  })

  const filterLabelStyle = {
    fontSize: '0.62rem',
    color: '#555550',
    fontFamily: 'monospace',
    letterSpacing: '0.1em',
    flexShrink: 0,
    width: '52px',
    paddingTop: '0.3rem',
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* 환영 메시지 */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{
          color: '#8b0000', fontSize: '0.7rem', letterSpacing: '0.3em',
          fontFamily: 'monospace', marginBottom: '0.3rem',
        }}>
          ◆ 접속 확인됨 ◆
        </p>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#e8e0d0' }}>
          어서오세요,{' '}
          <span style={{ color: '#dc143c' }}>{profile?.nickname || user?.email}</span>
          <span style={{ color: '#888880' }}>님</span>
        </h2>
      </div>

      {/* 2컬럼 레이아웃: 메인 + 사이드바 */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* 메인 콘텐츠 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 탭 네비게이션 */}
          <div style={{ display: 'flex', borderBottom: '1px solid #2a2a2a', marginBottom: '1.5rem' }}>
            {(Object.entries(TAB_CONFIG) as [TabType, typeof TAB_CONFIG[TabType]][]).map(([key, val]) => {
              const isActive = key === tab
              return (
                <Link
                  key={key}
                  href={`/market?tab=${key}`}
                  style={{
                    padding: '0.8rem 1.5rem',
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? val.accent : '#555550',
                    borderBottom: isActive ? `2px solid ${val.accent}` : '2px solid transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                    marginBottom: '-1px',
                    letterSpacing: '0.05em',
                  }}
                >
                  {val.label}
                </Link>
              )
            })}
          </div>

          {/* 카테고리 필터 + 글쓰기 버튼 */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem',
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', flex: 1 }}>
              {cfg.categories.map((cat) => (
                <Link
                  key={cat}
                  href={makeHref({ cat: cat === '전체' ? undefined : cat })}
                  style={chip(cat === activeCat)}
                >
                  {cat}
                </Link>
              ))}
            </div>

            <Link
              href={cfg.writeHref}
              style={{
                flexShrink: 0, fontSize: '0.8rem',
                color: cfg.accent, border: `1px solid ${cfg.accent}66`,
                padding: '0.45rem 1rem', letterSpacing: '0.1em',
                textDecoration: 'none', whiteSpace: 'nowrap',
                background: `${cfg.accent}11`,
              }}
            >
              {cfg.writeLabel}
            </Link>
          </div>

          {/* 지역 + 가격대 필터 (판매글/수요글만) */}
          {showLocationPrice && (
            <div style={{
              border: '1px solid #1e1e1e', background: '#0d0d0d',
              padding: '0.85rem 1rem', marginBottom: '1.5rem',
              display: 'flex', flexDirection: 'column', gap: '0.6rem',
            }}>
              {/* 시/도 */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span style={filterLabelStyle}>지역</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', flex: 1 }}>
                  <Link href={makeHref({ sido: undefined, gu: undefined })} style={chip(!sido)}>전체</Link>
                  {SIDO_LIST.map((s) => (
                    <Link key={s} href={makeHref({ sido: s, gu: undefined })} style={chip(s === sido)}>
                      {s}
                    </Link>
                  ))}
                </div>
              </div>

              {/* 구/군 (시/도 선택 시) */}
              {sido && sigunguList.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={filterLabelStyle}>{sido}</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', flex: 1 }}>
                    <Link href={makeHref({ gu: undefined })} style={chip(!gu)}>전체</Link>
                    {sigunguList.map((g) => (
                      <Link key={g} href={makeHref({ gu: g })} style={chip(g === gu)}>
                        {g}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 가격대 */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span style={filterLabelStyle}>가격대</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', flex: 1 }}>
                  <Link href={makeHref({ price: undefined })} style={chip(!priceKey)}>전체</Link>
                  {PRICE_RANGES.map((r) => (
                    <Link key={r.key} href={makeHref({ price: r.key })} style={chip(r.key === priceKey)}>
                      {r.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 글 목록 */}
          {posts.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '4rem 2rem',
              border: '1px solid #2a2a2a', color: '#3a3a3a',
              fontFamily: 'monospace', fontSize: '0.82rem', letterSpacing: '0.1em',
            }}>
              <p style={{ marginBottom: '1rem' }}>
                {sido || priceKey || (activeCat !== '전체')
                  ? '조건에 맞는 게시글이 없습니다'
                  : cfg.emptyMsg}
              </p>
              <Link href={cfg.writeHref} style={{ color: cfg.accent, textDecoration: 'none', fontSize: '0.78rem' }}>
                {cfg.writeLabel}
              </Link>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '0.75rem',
            }}>
              {posts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  cfg={{ accent: cfg.accent, pricePrefix: cfg.pricePrefix }}
                />
              ))}
            </div>
          )}

          {/* 푸터 */}
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #2a2a2a, transparent)',
            margin: '3rem 0 1.5rem',
          }} />
          <p style={{
            textAlign: 'center', color: '#2a2a2a', fontSize: '0.65rem',
            letterSpacing: '0.2em', fontFamily: 'monospace',
          }}>
            ✦ 비밀은 지켜드립니다 ✦
          </p>
        </div>

        {/* 우측 실시간 순위 사이드바 */}
        <SalesRankingSidebar />
      </div>
    </div>
  )
}
