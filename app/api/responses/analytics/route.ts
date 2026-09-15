import { NextResponse } from 'next/server'
import { getAuthorizationContext } from '@/lib/domain/auth/authorization'
import { safeCountDocs, safeGetCollectionDocs } from '@/lib/repositories/safe-firestore'

/**
 * GET /api/responses/analytics
 *
 * Ringkasan hemat biaya untuk dashboard.
 *
 * BIAYA: hanya memakai count aggregation (1 read per 1000 dokumen) +
 * dokumen formulir yang jumlahnya sedikit. TIDAK membaca seluruh response.
 *
 * Perbandingan (10.000 response):
 *   - cara lama (baca semua response) : 10.000 reads
 *   - cara ini (count + form)         : ~14 reads
 */

const VALID_GROUP = ['formId', 'distributionId', 'status', 'ownerId'] as const

export async function GET(request: Request) {
  try {
    const authContext = await getAuthorizationContext()
    if (!authContext) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    if (authContext.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const groupBy = (searchParams.get('groupBy') || 'formId') as (typeof VALID_GROUP)[number]
    if (!VALID_GROUP.includes(groupBy)) {
      return NextResponse.json(
        { success: false, message: `groupBy tidak valid. Pilihan: ${VALID_GROUP.join(', ')}` },
        { status: 400 },
      )
    }

    const formId = searchParams.get('formId') || undefined

    // 1. Total + status (count aggregation, bukan baca dokumen)
    const baseFilters = formId ? [{ field: 'formId', value: formId }] : []
    const [total, submitted, inProgress] = await Promise.all([
      safeCountDocs('responses', baseFilters),
      safeCountDocs('responses', [...baseFilters, { field: 'status', value: 'submitted' }]),
      safeCountDocs('responses', [...baseFilters, { field: 'status', value: 'in_progress' }]),
    ])

    // 2. Rincian per grup (dipecah per form yang aktif saja — jumlah form kecil)
    const forms = formId
      ? await safeGetCollectionDocs('forms').then((all) => all.filter((f) => f.id === formId))
      : await safeGetCollectionDocs('forms')

    const breakdown = await Promise.all(
      forms.map(async (f) => {
        const fid = f.id
        const [count, done] = await Promise.all([
          safeCountDocs('responses', [{ field: 'formId', value: fid }]),
          safeCountDocs('responses', [
            { field: 'formId', value: fid },
            { field: 'status', value: 'submitted' },
          ]),
        ])
        const meta: any = f.data?.metadata || {}
        return {
          id: fid,
          title: meta.title || f.data?.title || 'Formulir',
          total: count,
          submitted: done,
        }
      }),
    )

    return NextResponse.json({
      success: true,
      data: {
        total,
        submitted,
        inProgress,
        formsCount: forms.length,
        breakdown: breakdown.sort((a, b) => b.total - a.total),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Gagal menghitung ringkasan.' },
      { status: 500 },
    )
  }
}
