import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SalesRankingSidebar from './SalesRankingSidebar'
import PostCard, { type Post, type TabType } from './PostCard'

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
  searchParams: Promise<{ tab?: string; cat?: string }>
}) {
  const { tab: rawTab = 'sell', cat: categoryFilter } = await searchParams
  const tab = (rawTab in TAB_CONFIG ? rawTab : 'sell') as TabType
  const cfg = TAB_CONFIG[tab]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', user!.id)
    .single()

  const baseQuery = supabase
    .from('products')
    .select('id, title, price, category, condition, location, created_at, post_type, images, seller:profiles!seller_id(nickname)')
    .eq('status', 'active')
    .eq('post_type', tab)
    .order('created_at', { ascending: false })
    .limit(24)

  const { data: postsData } = await (
    categoryFilter && categoryFilter !== '전체'
      ? baseQuery.eq('category', categoryFilter)
      : baseQuery
  )

  const posts = (postsData ?? []) as unknown as Post[]
  const activeCat = categoryFilter ?? '전체'

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
            alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem',
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', flex: 1 }}>
              {cfg.categories.map((cat) => {
                const isActiveCat = cat === activeCat
                return (
                  <Link
                    key={cat}
                    href={
                      cat === '전체'
                        ? `/market?tab=${tab}`
                        : `/market?tab=${tab}&cat=${encodeURIComponent(cat)}`
                    }
                    style={{
                      padding: '0.25rem 0.65rem',
                      fontSize: '0.7rem', fontFamily: 'monospace',
                      letterSpacing: '0.05em', textDecoration: 'none',
                      background: isActiveCat ? `${cfg.accent}22` : 'transparent',
                      color: isActiveCat ? cfg.accent : '#3a3a3a',
                      border: `1px solid ${isActiveCat ? cfg.accent + '66' : '#2a2a2a'}`,
                      transition: 'all 0.15s', whiteSpace: 'nowrap',
                    }}
                  >
                    {cat}
                  </Link>
                )
              })}
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

          {/* 글 목록 */}
          {posts.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '4rem 2rem',
              border: '1px solid #2a2a2a', color: '#3a3a3a',
              fontFamily: 'monospace', fontSize: '0.82rem', letterSpacing: '0.1em',
            }}>
              <p style={{ marginBottom: '1rem' }}>{cfg.emptyMsg}</p>
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
