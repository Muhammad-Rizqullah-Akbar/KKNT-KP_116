'use client'

import { useMemo } from 'react'
import { galleryGradients, type Article } from './articles-types'
import { htmlToBlocks } from './articles-utils'
import type { ArticlesData } from './use-articles-data'

// Manajemen blok konten, galeri dokumentasi, TOC preview, dan preview dari tabel.
export function useArticlesEditor(data: ArticlesData) {
  const { formData, setFormData, setIsPreviewOpen, setIsTocPopoverOpen, setSelectedArticle } = data

  // REORDER & BLOCK MANAGEMENT
  const addBlock = (type: 'p' | 'h2' | 'quote' | 'list' | 'image') => {
    setFormData(prev => ({
      ...prev,
      blocks: [...prev.blocks, { id: `b-${Date.now()}`, type, value: '', quoteAuthor: '', imageUrl: '', imageCaption: '' }]
    }))
  }

  const updateBlockValue = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, blocks: prev.blocks.map(block => block.id === id ? { ...block, value } : block) }))
  }

  const updateBlockAuthor = (id: string, quoteAuthor: string) => {
    setFormData(prev => ({ ...prev, blocks: prev.blocks.map(block => block.id === id ? { ...block, quoteAuthor } : block) }))
  }

  const updateBlockImageCaption = (id: string, imageCaption: string) => {
    setFormData(prev => ({ ...prev, blocks: prev.blocks.map(block => block.id === id ? { ...block, imageCaption } : block) }))
  }

  const removeBlock = (id: string) => {
    if (formData.blocks.length === 1) return
    setFormData(prev => ({ ...prev, blocks: prev.blocks.filter(block => block.id !== id) }))
  }

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = formData.blocks.findIndex(block => block.id === id)
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === formData.blocks.length - 1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const newBlocks = [...formData.blocks]
    const [moved] = newBlocks.splice(index, 1)
    newBlocks.splice(newIndex, 0, moved)
    setFormData(prev => ({ ...prev, blocks: newBlocks }))
  }

  const updateGalleryUrl = (id: string, url: string) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.map(image => image.id === id ? { ...image, url } : image)
    }))
  }

  const updateGalleryCaption = (id: string, caption: string) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.map(image => image.id === id ? { ...image, caption } : image)
    }))
  }

  const removeGalleryImage = (id: string) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter(image => image.id !== id)
    }))
  }

  const addGallerySlot = () => {
    const newId = `g${Date.now()}`
    setFormData(prev => ({
      ...prev,
      gallery: [...prev.gallery, { id: newId, url: '', caption: `Dokumentasi ${prev.gallery.length + 1}`, gradient: galleryGradients[prev.gallery.length % galleryGradients.length] }]
    }))
  }

  const previewHeadings = useMemo(() => {
    return formData.blocks.filter(block => block.type === 'h2' && block.value.trim() !== '').map((block, i) => ({
      blockId: block.id,
      id: `section-${i + 1}`,
      text: block.value
    }))
  }, [formData.blocks])

  const scrollToHeadingBlock = (blockId: string) => {
    setIsTocPopoverOpen(false)
    const el = document.getElementById(`block-${blockId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // Preview opened directly from the table action button
  const openPreviewFromTable = (article: Article) => {
    setSelectedArticle(article)
    setFormData({
      title: article.title,
      category: article.category,
      author: article.author,
      authorBio: article.authorBio,
      status: article.status,
      readTime: article.readTime,
      featuredImage: article.featuredImage,
      excerpt: article.excerpt,
      tags: article.tags ? article.tags.join(', ') : '',
      embeddedDistributionCode: article.embeddedDistributionCode || '',
      pretestCode: article.pretestCode || '',
      posttestCode: article.posttestCode || article.embeddedDistributionCode || '',
      gallery: article.gallery || [],
      blocks: htmlToBlocks(article.content),
    })
    setIsPreviewOpen(true)
    document.body.style.overflow = 'hidden'
  }

  return {
    addBlock,
    updateBlockValue,
    updateBlockAuthor,
    updateBlockImageCaption,
    removeBlock,
    moveBlock,
    updateGalleryUrl,
    updateGalleryCaption,
    removeGalleryImage,
    addGallerySlot,
    previewHeadings,
    scrollToHeadingBlock,
    openPreviewFromTable,
  }
}

export type ArticlesEditor = ReturnType<typeof useArticlesEditor>
