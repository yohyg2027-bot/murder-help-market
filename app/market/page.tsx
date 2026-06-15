import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const CONDITION_LABEL: Record<string, string> = {
  new: '새상품',
  like_new: '거의 새것',
  used: '사용감 있음',
  worn: '많이 사용함',
}

const SELL_BUY_CATEGORIES = [
  '전체', '전자기기', '의류/잡화', '가구/인테리어', '도서/음반',
  '스포츠/레저', '생활/주방', '장난감/취미', '자동차/바이크',
  '식품/건강', '반려동물', '게임', '음악/악기', '미용/화장품', '공구/산업', '기타',
]

const COMMUNITY_CATEGORIES = [
  '전체', '자유게시판', '정보공유', '거래후기', '질문&답변', '모임/이벤트', '공동구매', '기타',
]

type TabType = 'sell' | 'buy' | 'community'

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

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

type Post = {
  id: string
  title: string
  price: number | null
  category: string
  condition: string | null
  location: string | null
  created_at: string
  post_type: string
  seller: { nickname: string } | null
}

function PostCard({ post, tab }: { post: Post; tab: TabType }) {
  const cfg = TAB_CONFIG[tab]

  return (
    <Link href={`/market/post/${post.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div
        style={{
          background: '#111111',
          border: '1px solid #2a2a2a',
          borderTop: `2px solid ${cfg.accent}55`,
          padding: '1.25rem',
          cursor: 'pointer',
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* 카테고리 + 상태 */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.65rem', letterSpacing: '0.1em',
            padding: '0.15rem 0.5rem',
            background: `${cfg.accent}22`,
            color: cfg.accent,
            border: `1px solid ${cfg.accent}44`,
            fontFamily: 'monospace',
          }}>
            {post.category}
          </span>
          {post.condition && (
            <span style={{
              fontSize: '0.65rem', letterSpacing: '0.1em',
              padding: '0.15rem 0.5rem',
              background: '#1a1a1a', color: '#555550',
              border: '1px solid #2a2a2a', fontFamily: 'monospace',
            }}>
              {CONDITION_LABEL[post.condition] ?? post.condition}
            </span>
          )}
        </div>

        {/* 제목 */}
        <h3 style={{
          color: '#e8e0d0', fontSize: '0.95rem', fontWeight: 600,
          marginBottom: '0.5rem',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {post.title}
        </h3>

        {/* 가격 */}
        {post.price !== null && (
          <p style={{
            color: tab === 'buy' ? '#1e90ff' : '#b8860b',
            fontSize: '1.05rem', fontWeight: 700,
            marginBottom: '0.75rem', letterSpacing: '0.02em',
          }}>
            {cfg.pricePrefix ?? ''}{post.price.toLocaleString('ko-KR')}원
          </p>
        )}

        {/* 하단 */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: '0.7rem', color: '#3a3a3a', fontFamily: 'monospace',
          marginTop: post.price === null ? '0.75rem' : 0,
        }}>
          <span>{post.location ?? (tab === 'community' ? '' : '지역 미정')}</span>
          <span>{post.seller?.nickname ?? '익명'} · {timeAgo(post.created_at)}</span>
        </div>
      </div>
    </Link>
  )
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
    .select('id, title, price, category, condition, location, created_at, post_type, seller:profiles!seller_id(nickname)')
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
    <div className="max-w-4xl mx-auto px-4 py-8">
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
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '0.75rem',
        }}>
          {posts.map((p) => (
            <PostCard key={p.id} post={p} tab={tab} />
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
  )
}
