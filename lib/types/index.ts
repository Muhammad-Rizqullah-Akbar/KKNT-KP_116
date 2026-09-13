/**
 * lib/types/ — TypeScript DTO turunan dari Zod schema (single source of truth).
 * Jangan definisikan type di sini secara manual — selalu re-export dari z.infer
 * agar type selalu sinkron dengan validasi runtime di lib/schemas/.
 */

export type {
  User,
  Partnership,
  Form,
  FormVersion,
  Distribution,
  Response,
  Article,
  ArticleCategory,
  FormAccess,
  FormRegistry,
  Settings,
} from '@/lib/schemas'
