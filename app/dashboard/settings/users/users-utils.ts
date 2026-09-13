import type { IconName } from '@/components/ui/Icons'

export type UserRole = 'super_admin' | 'cadre' | 'partnership' | null

export type User = {
  uid: string
  email: string
  displayName: string
  role: UserRole
  organization?: string
  phone?: string
  partnershipId?: string
  partnershipName?: string
  photoURL?: string
  createdAt?: string
  updatedAt?: string
  isChildOfMitra?: boolean
  parentMitraName?: string
}

export const ROLE_OPTIONS: { id: UserRole; label: string; icon: IconName; colorClass: string; desc: string }[] = [
  {
    id: 'super_admin',
    label: 'Super Admin',
    icon: 'crown',
    colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    desc: 'Akses penuh tanpa batas seluruh fitur, manajemen user, dan pengaturan sistem.',
  },
  {
    id: 'partnership',
    label: 'Mitra / Partnership',
    icon: 'briefcase',
    colorClass: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    desc: 'Akun Organisasi/Instansi Mitra yang dapat mengelola kelompok Kader miliknya sendiri.',
  },
  {
    id: 'cadre',
    label: 'Kader Lapangan / Komunitas',
    icon: 'users',
    colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    desc: 'Kader Lapangan (Sekolah, Komunitas, Pasar, atau Desa) untuk eksekusi kuesioner publik.',
  },
]

// Helper Badge Render
export function getRoleBadge(role: UserRole) {
  const found = ROLE_OPTIONS.find((r) => r.id === role)
  if (found) {
    return {
      label: found.label,
      className: found.colorClass,
      icon: found.icon,
    }
  }
  return {
    label: 'Kader Desa',
    className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    icon: 'users' as IconName,
  }
}

export function getInitials(name?: string, email?: string) {
  const text = name || email || 'User'
  return text.substring(0, 2).toUpperCase()
}

// Hierarchically Sorted Users List: super_admin -> admin -> internal_bpom -> (partnership -> cadre_mitra) -> independent_cadres
export function filterAndSortUsers(users: User[], searchTerm: string, filterRole: string): User[] {
  // 1. Filter by search term & selected role
  const matched = users.filter((u) => {
    const term = searchTerm.toLowerCase()
    const matchSearch =
      (u.email || '').toLowerCase().includes(term) ||
      (u.displayName || '').toLowerCase().includes(term) ||
      (u.organization || '').toLowerCase().includes(term)

    const matchRole = filterRole === 'all' || u.role === filterRole
    return matchSearch && matchRole
  })

  // If specific role filter is active (not 'all'), retain simple filter
  if (filterRole !== 'all') {
    return matched
  }

  // 2. Group into buckets (role merge: admin + internal_bpom → super_admin)
  const superAdmins = matched.filter((u) => u.role === 'super_admin')
  const partnerships = matched.filter((u) => u.role === 'partnership')
  const cadres = matched.filter((u) => u.role === 'cadre' || !u.role)

  const attachedCadreUids = new Set<string>()
  const sortedResult: User[] = [
    ...superAdmins,
  ]

  // 3. Place each Partnership followed immediately by its owned Cadres
  partnerships.forEach((p) => {
    sortedResult.push(p)
    const pOrg = (p.organization || p.partnershipName || p.displayName || '').toLowerCase().trim()

    const ownedCadres = cadres.filter((c) => {
      if (c.partnershipId === p.uid) return true
      const cOrg = (c.organization || c.partnershipName || '').toLowerCase().trim()
      if (pOrg && cOrg && pOrg === cOrg) return true
      return false
    })

    ownedCadres.forEach((c) => {
      attachedCadreUids.add(c.uid)
      sortedResult.push({
        ...c,
        isChildOfMitra: true,
        parentMitraName: p.displayName || p.organization || 'Mitra Induk',
      })
    })
  })

  // 4. Add unattached independent cadres at the bottom
  const unattachedCadres = cadres.filter((c) => !attachedCadreUids.has(c.uid))
  sortedResult.push(...unattachedCadres)

  return sortedResult
}
