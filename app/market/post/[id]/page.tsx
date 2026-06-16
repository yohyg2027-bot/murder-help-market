import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CommentSection from './CommentSection'
import PostActions from './PostActions'
import ImageGallery from './ImageGallery'
import LikeButton from './LikeButton'

const CONDITION_LABEL: Record<string, string> = {
  new: '새상품',
  like_new: '거의 새것',
  used: '사용감 있음',
  worn: '많이 사용함',
}

const POST_TYPE_CONFIG: Record<string, { label: string; color: string; tabKey: string }> = {
  sell: { label: '판매글', color: '#dc143c', tabKey: 'sell' },
  buy:  { label: '수요글', color: '#1e90ff', tabKey: 'buy'  },
  community: { label: '커뮤니티', color: '#2e8b57', tabKey: 'community' },
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

type Seller = { id: string; nickname: string } | null

type CommentType = {
  id: string
  content: string
  offer_price: number | null
  created_at: string
  is_secret: boolean
  locked: boolean
  author: { id: string; nickname: string } | null
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: postRaw } = await supabase
    .from('products')
    .select(`
      id, title, description, price, category, condition, location,
      created_at, post_type, status, images,
      seller:profiles!seller_id(id, nickname)
    `)
    .eq('id', id)
    .single()

  if (!postRaw) notFound()

  const post = postRaw as unknown as {
    id: string; title: string; description: string | null
    price: number | null; category: string; condition: string | null
    location: string | null; created_at: string; post_type: string
    status: string; images: string[] | null; seller: Seller
  }

  if (post.status !== 'active') notFound()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: commentsRaw } = await supabase
    .from('comments')
    .select('id, content, offer_price, created_at, is_secret, author:profiles!author_id(id, nickname)')
    .eq('post_id', id)
    .order('created_at', { ascending: true })

  const isPostOwner = !!user && user.id === post.seller?.id

  // 비밀댓글은 작성자 본인과 글쓴이만 볼 수 있도록, 그 외에는 내용을 가립니다
  const comments = ((commentsRaw ?? []) as unknown as Array<Omit<CommentType, 'locked'>>).map((c) => {
    const isOwnComment = !!user && c.author?.id === user.id
    const locked = c.is_secret && !isOwnComment && !isPostOwner
    return {
      ...c,
      content: locked ? '' : c.content,
      offer_price: locked ? null : c.offer_price,
      locked,
    }
  }) as CommentType[]

  // 좋아요 수 + 내가 눌렀는지 여부
  const { count: likeCountRaw } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', id)
  const likeCount = likeCountRaw ?? 0

  let initialLiked = false
  if (user) {
    const { data: myLike } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    initialLiked = !!myLike
  }

  const typeConfig = POST_TYPE_CONFIG[post.post_type] ?? { label: post.post_type, color: '#888880', tabKey: 'sell' }
  const canNegotiate = post.post_type === 'sell' || post.post_type === 'buy'
  const isAuthor = user?.id === post.seller?.id

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 뒤로가기 + 수정/삭제 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Link
          href={`/market?tab=${typeConfig.tabKey}`}
          style={{
            color: '#555550', fontSize: '0.78rem',
            textDecoration: 'none', fontFamily: 'monospace',
            letterSpacing: '0.1em',
          }}
        >
          ← 목록으로
        </Link>
        {isAuthor && <PostActions postId={id} tabKey={typeConfig.tabKey} />}
      </div>

      {/* 게시글 본문 */}
      <article style={{
        background: '#111111',
        border: '1px solid #2a2a2a',
        borderTop: `2px solid ${typeConfig.color}66`,
        padding: '2rem',
        marginBottom: '1.25rem',
      }}>
        {/* 이미지 갤러리 */}
        {post.images && post.images.length > 0 && (
          <ImageGallery images={post.images} />
        )}

        {/* 배지 */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.68rem', padding: '0.2rem 0.65rem',
            background: `${typeConfig.color}22`, color: typeConfig.color,
            border: `1px solid ${typeConfig.color}55`,
            fontFamily: 'monospace', letterSpacing: '0.1em',
          }}>
            {typeConfig.label}
          </span>
          <span style={{
            fontSize: '0.68rem', padding: '0.2rem 0.65rem',
            background: '#1a1a1a', color: '#555550',
            border: '1px solid #2a2a2a', fontFamily: 'monospace',
          }}>
            {post.category}
          </span>
          {post.condition && (
            <span style={{
              fontSize: '0.68rem', padding: '0.2rem 0.65rem',
              background: '#1a1a1a', color: '#555550',
              border: '1px solid #2a2a2a', fontFamily: 'monospace',
            }}>
              {CONDITION_LABEL[post.condition] ?? post.condition}
            </span>
          )}
        </div>

        {/* 제목 */}
        <h1 style={{
          color: '#e8e0d0', fontSize: '1.4rem', fontWeight: 800,
          marginBottom: '1.5rem', lineHeight: 1.4,
        }}>
          {post.title}
        </h1>

        {/* 가격 */}
        {post.price !== null && (
          <div style={{
            background: 'rgba(184,134,11,0.06)',
            border: '1px solid rgba(184,134,11,0.2)',
            padding: '1rem 1.25rem', marginBottom: '1.5rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: '#555550', fontSize: '0.78rem', fontFamily: 'monospace' }}>
              {post.post_type === 'buy' ? '희망 최대 가격' : '판매 가격'}
            </span>
            <span style={{ color: '#b8860b', fontSize: '1.5rem', fontWeight: 800 }}>
              {post.price.toLocaleString('ko-KR')}원
            </span>
          </div>
        )}

        {/* 메타 정보 */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
          marginBottom: post.description ? '1.5rem' : 0,
        }}>
          <div>
            <p style={{ color: '#3a3a3a', fontSize: '0.65rem', fontFamily: 'monospace', letterSpacing: '0.1em', marginBottom: '0.15rem' }}>
              작성자
            </p>
            <p style={{ color: '#888880', fontSize: '0.82rem' }}>
              {post.seller?.nickname ?? '익명'}
            </p>
          </div>
          {post.post_type !== 'community' && (
            <div>
              <p style={{ color: '#3a3a3a', fontSize: '0.65rem', fontFamily: 'monospace', letterSpacing: '0.1em', marginBottom: '0.15rem' }}>
                거래 지역
              </p>
              <p style={{ color: '#888880', fontSize: '0.82rem' }}>
                {post.location ?? '미정'}
              </p>
            </div>
          )}
          <div>
            <p style={{ color: '#3a3a3a', fontSize: '0.65rem', fontFamily: 'monospace', letterSpacing: '0.1em', marginBottom: '0.15rem' }}>
              등록일
            </p>
            <p style={{ color: '#888880', fontSize: '0.82rem' }}>
              {formatDateTime(post.created_at)}
            </p>
          </div>
        </div>

        {/* 본문 내용 */}
        {post.description && (
          <>
            <div style={{ height: '1px', background: '#1a1a1a', margin: '1.5rem 0' }} />
            <div style={{
              color: '#c8c0b0', fontSize: '0.92rem',
              lineHeight: 1.9, whiteSpace: 'pre-wrap',
            }}>
              {post.description}
            </div>
          </>
        )}

        {/* 좋아요 */}
        <div style={{ height: '1px', background: '#1a1a1a', margin: '1.5rem 0' }} />
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <LikeButton
            postId={id}
            currentUserId={user?.id}
            initialCount={likeCount}
            initialLiked={initialLiked}
          />
        </div>
      </article>

      {/* 댓글 섹션 */}
      <section style={{
        background: '#0d0d0d',
        border: '1px solid #1a1a1a',
        padding: '1.5rem',
      }}>
        <CommentSection
          postId={id}
          currentUserId={user?.id}
          canNegotiate={canNegotiate}
          initialComments={comments}
        />
      </section>
    </div>
  )
}
