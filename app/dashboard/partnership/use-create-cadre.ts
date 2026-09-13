'use client'

import { useState } from 'react'
import type { User } from 'firebase/auth'
import type { UserData } from '@/lib/domain/auth/auth-client.service'
import type { UserProfile } from './types'

interface UseCreateCadreParams {
  isPartnershipRole: boolean
  partnersList: UserProfile[]
  user: User | null
  userData: UserData | null
  invalidatePartnershipData: () => void
  show: (msg: string) => void
}

export function useCreateCadre({
  isPartnershipRole,
  partnersList,
  user,
  userData,
  invalidatePartnershipData,
  show,
}: UseCreateCadreParams) {
  const [isCreateCadreOpen, setIsCreateCadreOpen] = useState(false)
  const [cadreContextMitra, setCadreContextMitra] = useState<UserProfile | null>(null)
  const [cadreEmail, setCadreEmail] = useState('')
  const [cadrePassword, setCadrePassword] = useState('')
  const [cadreName, setCadreName] = useState('')
  const [cadrePhone, setCadrePhone] = useState('')
  const [cadreOrganization, setCadreOrganization] = useState('')
  const [cadrePartnershipType, setCadrePartnershipType] = useState('Sekolah')
  const [isSubmittingCadre, setIsSubmittingCadre] = useState(false)

  const openCreateCadreModal = (mitra?: UserProfile) => {
    if (isPartnershipRole) {
      const myMitra = partnersList[0] || (userData ? {
        uid: user?.uid || '',
        email: user?.email || '',
        displayName: userData.displayName || 'Mitra Saya',
        role: 'partnership',
        organization: userData.organization || userData.displayName,
        partnershipType: userData.partnershipType || 'Sekolah',
      } : null)
      setCadreContextMitra(myMitra)
      setCadreOrganization(userData?.organization || userData?.displayName || '')
      setCadrePartnershipType(userData?.partnershipType || 'Sekolah')
    } else if (mitra) {
      setCadreContextMitra(mitra)
      setCadreOrganization(mitra.organization || mitra.displayName)
      setCadrePartnershipType(mitra.partnershipType || 'Sekolah')
    } else {
      setCadreContextMitra(null)
      setCadreOrganization('')
      setCadrePartnershipType('Sekolah')
    }
    setIsCreateCadreOpen(true)
  }

  const handleCreateCadre = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingCadre(true)
    try {
      const targetOrg = cadreContextMitra
        ? cadreContextMitra.organization || cadreContextMitra.displayName
        : cadreOrganization || 'Independen'

      const targetPartnershipId = cadreContextMitra ? cadreContextMitra.uid : undefined

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cadreEmail,
          password: cadrePassword,
          role: 'cadre',
          displayName: cadreName || cadreEmail.split('@')[0],
          organization: targetOrg,
          partnershipType: cadrePartnershipType,
          phone: cadrePhone,
          partnershipId: targetPartnershipId,
          partnershipName: targetOrg,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal mendaftarkan Kader.')

      show(`Kader "${cadreName || cadreEmail}" berhasil didaftarkan di bawah Mitra ${targetOrg}!`)
      setIsCreateCadreOpen(false)
      setCadreEmail('')
      setCadrePassword('')
      setCadreName('')
      setCadrePhone('')
      setCadreOrganization('')
      invalidatePartnershipData()
    } catch (err: any) {
      show(`Error: ${err.message}`)
    } finally {
      setIsSubmittingCadre(false)
    }
  }

  return {
    isCreateCadreOpen,
    setIsCreateCadreOpen,
    cadreContextMitra,
    setCadreContextMitra,
    cadreEmail,
    setCadreEmail,
    cadrePassword,
    setCadrePassword,
    cadreName,
    setCadreName,
    cadrePhone,
    setCadrePhone,
    cadreOrganization,
    setCadreOrganization,
    cadrePartnershipType,
    isSubmittingCadre,
    openCreateCadreModal,
    handleCreateCadre,
  }
}
