import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import ChatRoom from './ChatRoom'

type Profile = { id: string; nickname: string } | null
type PostInfo = { id: string; title: string; price: number | null; post_type: string; category: string } | null

export default async function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: chatRaw } = await supabase
    .from('chats')
    .select(`
      id, post_id, buyer_id, seller_id,
      buyer:profiles!buyer_id(id, nickname),
      seller:profiles!seller_id(id, nickname),
      post:products!post_id(id, title, price, post_type, category)
    `)
    .eq('id', id)
    .single()

  if (!chatRaw) notFound()

  const chat = chatRaw as unknown as {
    id: string; post_id: string; buyer_id: string; seller_id: string
    buyer: Profile; seller: Profile; post: PostInfo
  }

  // 참여자(구매자/판매자)가 아니면 접근 불가
  if (chat.buyer_id !== user.id && chat.seller_id !== user.id) notFound()

  const { data: messagesRaw } = await supabase
    .from('messages')
    .select('id, sender_id, content, created_at')
    .eq('chat_id', id)
    .order('created_at', { ascending: true })

  const messages = (messagesRaw ?? []) as {
    id: string; sender_id: string; content: string; created_at: string
  }[]

  const other = chat.buyer_id === user.id ? chat.seller : chat.buyer

  return (
    <ChatRoom
      chatId={id}
      currentUserId={user.id}
      otherNickname={other?.nickname ?? '상대방'}
      post={chat.post}
      initialMessages={messages}
    />
  )
}
