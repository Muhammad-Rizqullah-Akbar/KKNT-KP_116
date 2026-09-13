import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize untrusted HTML sebelum dirender via dangerouslySetInnerHTML.
 * Konten artikel bisa berasal dari parser PDF / input admin → wajib sanitasi XSS.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    // Izinkan tag & atribut yang dipakai renderer konten artikel
    ALLOWED_TAGS: [
      'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'strong', 'b', 'em', 'i', 'u', 's', 'del', 'sup', 'sub',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
      'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'figure', 'figcaption', 'span', 'div',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'width', 'height', 'class'],
    ALLOWED_URI_REGEXP: /^(?:https?:\/\/|data:image\/|mailto:|tel:|#)/i,
  })
}
