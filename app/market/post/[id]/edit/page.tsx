import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import EditForm from './EditForm'

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: postRaw } = await supabase
    .from('products')
    .select('id, title, category, price, condition, location, description, post_type, status, seller_id')
    .eq('id', id)
    .single()

  if (!postRaw || postRaw.status !== 'active') notFound()

  // 작성자 본인이 아니면 상세 페이지로 돌려보냄
  if (postRaw.seller_id !== user.id) redirect(`/market/post/${id}`)

  const initialData = {
    title: postRaw.title as string,
    category: postRaw.category as string,
    price: postRaw.price as number | null,
    condition: postRaw.condition as string | null,
    location: postRaw.location as string | null,
    description: postRaw.description as string | null,
    post_type: postRaw.post_type as string,
  }

  return <EditForm postId={id} initialData={initialData} />
}
