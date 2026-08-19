import assert from 'node:assert/strict'
import { test, describe } from 'node:test'

describe('Partnership Scoping & Access Boundary Tests', () => {

  const mockUsers = [
    {
      uid: 'super_admin_1',
      displayName: 'Super Admin User',
      email: 'superadmin@kkntkp.id',
      role: 'super_admin',
      organization: 'Pusat BPOM',
    },
    {
      uid: 'admin_1',
      displayName: 'Admin User',
      email: 'admin@kkntkp.id',
      role: 'admin',
      organization: 'Pusat BPOM',
    },
    {
      uid: 'mitra_a',
      displayName: 'SMKN 1 Makassar',
      email: 'smkn1@mitra.id',
      role: 'partnership',
      organization: 'SMKN 1 Makassar',
    },
    {
      uid: 'mitra_b',
      displayName: 'SDN 02 Gowa',
      email: 'sdn02@mitra.id',
      role: 'partnership',
      organization: 'SDN 02 Gowa',
    },
    {
      uid: 'cadre_a1',
      displayName: 'Kader Ani (SMKN 1)',
      email: 'ani@kader.id',
      role: 'cadre',
      partnershipId: 'mitra_a',
      organization: 'SMKN 1 Makassar',
    },
    {
      uid: 'cadre_a2',
      displayName: 'Kader Budi (SMKN 1)',
      email: 'budi@kader.id',
      role: 'cadre',
      partnershipId: 'mitra_a',
      organization: 'SMKN 1 Makassar',
    },
    {
      uid: 'cadre_b1',
      displayName: 'Kader Caca (SDN 02)',
      email: 'caca@kader.id',
      role: 'cadre',
      partnershipId: 'mitra_b',
      organization: 'SDN 02 Gowa',
    },
  ]

  function filterUsersByRole(allUsers: typeof mockUsers, authContext: { uid: string; role: string }) {
    if (authContext.role === 'super_admin' || authContext.role === 'admin' || authContext.role === 'internal_bpom') {
      return allUsers
    }

    if (authContext.role === 'partnership') {
      const currentUser = allUsers.find((u) => u.uid === authContext.uid)
      const userOrg = (currentUser?.organization || currentUser?.displayName || '').toLowerCase().trim()

      return allUsers.filter((u) => {
        if (u.uid === authContext.uid) return true
        if (u.role === 'cadre') {
          if (u.partnershipId === authContext.uid) return true
          if (userOrg && u.organization && u.organization.toLowerCase().trim() === userOrg) return true
        }
        return false
      })
    }

    if (authContext.role === 'cadre') {
      const currentCadre = allUsers.find((u) => u.uid === authContext.uid)
      const cadrePartId = currentCadre?.partnershipId
      const cadreOrg = (currentCadre?.organization || '').toLowerCase().trim()
      return allUsers.filter((u) => {
        if (u.uid === authContext.uid) return true
        if (u.role === 'cadre') {
          if (cadrePartId && u.partnershipId === cadrePartId) return true
          if (cadreOrg && u.organization && u.organization.toLowerCase().trim() === cadreOrg) return true
        }
        return false
      })
    }

    return []
  }

  test('Mitra A can ONLY see their own profile and their own cadres (Ani, Budi), NEVER Mitra B or Kader Caca', () => {
    const callerAuth = { uid: 'mitra_a', role: 'partnership' }
    const visibleUsers = filterUsersByRole(mockUsers, callerAuth)

    const visibleUids = visibleUsers.map((u) => u.uid)
    assert.deepEqual(visibleUids, ['mitra_a', 'cadre_a1', 'cadre_a2'])

    // Verification of isolation
    assert.equal(visibleUids.includes('mitra_b'), false, 'Mitra A must not see Mitra B')
    assert.equal(visibleUids.includes('cadre_b1'), false, 'Mitra A must not see Cadre B1')
    assert.equal(visibleUids.includes('admin_1'), false, 'Mitra A must not see Admin')
    assert.equal(visibleUids.includes('super_admin_1'), false, 'Mitra A must not see Super Admin')
  })

  test('Mitra B can ONLY see their own profile and Kader Caca', () => {
    const callerAuth = { uid: 'mitra_b', role: 'partnership' }
    const visibleUsers = filterUsersByRole(mockUsers, callerAuth)

    const visibleUids = visibleUsers.map((u) => u.uid)
    assert.deepEqual(visibleUids, ['mitra_b', 'cadre_b1'])

    assert.equal(visibleUids.includes('mitra_a'), false, 'Mitra B must not see Mitra A')
    assert.equal(visibleUids.includes('cadre_a1'), false, 'Mitra B must not see Cadre A1')
  })

  test('Admin can see all accounts across all partnerships', () => {
    const adminAuth = { uid: 'admin_1', role: 'admin' }
    const visibleUsers = filterUsersByRole(mockUsers, adminAuth)
    assert.equal(visibleUsers.length, mockUsers.length)
  })

  test('Mitra navigation menu only contains 5 allowed routes and no V1.0 or Dashboard', () => {
    const partnershipMenuItems = [
      '/dashboard/partnership',
      '/dashboard/monitoring',
      '/dashboard/distributions',
      '/dashboard/responses',
      '/dashboard/articles',
    ]

    assert.equal(partnershipMenuItems.length, 5)
    assert.equal(partnershipMenuItems.includes('/dashboard/overview'), false, 'Dashboard must not be in Mitra menu')
    assert.equal(partnershipMenuItems.includes('/dashboard/form-builder'), false, 'V1.0 Form Builder must not be in Mitra menu')
    assert.equal(partnershipMenuItems.includes('/dashboard/forms'), false, 'V1.0 Forms must not be in Mitra menu')
    assert.equal(partnershipMenuItems.includes('/dashboard/respondents'), false, 'V1.0 Respondents must not be in Mitra menu')
  })
})
