import { z } from 'zod'

export const articleSchema = z.object({
  articleId: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().optional(),
  content: z.string(),
  blocks: z.array(z.any()),
  category: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  status: z.enum(['draft', 'published']),
  featuredImage: z.string().optional(),
  gallery: z.array(z.any()),
  tags: z.array(z.string()),
  views: z.number().int().nonnegative(),
  readTime: z.number().int(),
  pretestCode: z.string().optional(),
  posttestCode: z.string().optional(),
  createdAt: z.any(),
  updatedAt: z.any(),
})
export type Article = z.infer<typeof articleSchema>

export const articleCategorySchema = z.object({
  categoryId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.any(),
})
export type ArticleCategory = z.infer<typeof articleCategorySchema>
