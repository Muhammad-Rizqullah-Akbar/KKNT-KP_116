import ArticleDetailPage from '@/app/articles/[slug]/page'

export default function EdukasiDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return <ArticleDetailPage params={params} />
}
