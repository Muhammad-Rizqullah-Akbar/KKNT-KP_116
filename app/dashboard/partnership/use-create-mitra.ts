'use client'

import { useState } from 'react'

interface UseCreateMitraParams {
  invalidatePartnershipData: () => void
  show: (msg: string) => void
}

export function useCreateMitra({ invalidatePartnershipData, show }: UseCreateMitraParams) {
  const [isCreateMitraOpen, setIsCreateMitraOpen] = useState(false)
  const [mitraEmail, setMitraEmail] = useState('')
  const [mitraPassword, setMitraPassword] = useState('')
  const [mitraName, setMitraName] = useState('')
  const [mitraType, setMitraType] = useState('Sekolah')
  const [mitraPhone, setMitraPhone] = useState('')
  const [isSubmittingMitra, setIsSubmittingMitra] = useState(false)

  const handleCreateMitra = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingMitra(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: mitraEmail,
          password: mitraPassword,
          role: 'partnership',
          displayName: mitraName || mitraEmail.split('@')[0],
          organization: mitraName,
          partnershipType: mitraType,
          phone: mitraPhone,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal mendaftarkan Mitra Instansi.')

      show(`Mitra "${mitraName || mitraEmail}" berhasil didaftarkan!`)
      setIsCreateMitraOpen(false)
      setMitraEmail('')
      setMitraPassword('')
      setMitraName('')
      setMitraPhone('')
      invalidatePartnershipData()
    } catch (err: any) {
      show(`Error: ${err.message}`)
    } finally {
      setIsSubmittingMitra(false)
    }
  }

  return {
    isCreateMitraOpen,
    setIsCreateMitraOpen,
    mitraEmail,
    setMitraEmail,
    mitraPassword,
    setMitraPassword,
    mitraName,
    setMitraName,
    mitraType,
    setMitraType,
    mitraPhone,
    setMitraPhone,
    isSubmittingMitra,
    handleCreateMitra,
  }
}
