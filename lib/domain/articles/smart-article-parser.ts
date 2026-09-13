/**
 * SMART ARTICLE PARSER & UTILITIES (100% DETERMINISTIC, ZERO-AI REQUIRED)
 *
 * Barrel module preserving the original public export API. Implementation is
 * split across per-concern modules.
 */

export type { ArticleBlock, ArticleGalleryItem, ParsedArticle } from './article-types'
export { DEFAULT_GRADIENTS } from './article-types'
export { inferCategoryFromContent, cleanAndRepairJson } from './article-category'
export { parseRawTextToArticle } from './article-raw-parser'
export { normalizeJsonToArticle } from './article-json-normalizer'
export { exportArticleToJson, getSampleDraftText } from './article-export'
