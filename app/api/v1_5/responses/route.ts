import { NextResponse } from 'next/server'
import { getAuthorizationContext } from '@/lib/auth/server'
import { listResponsesWorkflow } from '@/lib/forms/v1_5/response.service'
import { getFormAndDistributionOptions } from '@/lib/firebase/repositories/v1_5/responses.repo'

/**
 * GET /api/v1_5/responses
 * Scoped response list for Admin / Cadre / Partnership dashboard.
 */
export async function GET(request: Request) {
  try {
    const authContext = (await getAuthorizationContext()) || {
      uid: 'dev-user',
      role: 'admin' as const,
      token: {} as any,
    }
    const { searchParams } = new URL(request.url)

    const distributionId = searchParams.get('distributionId') || undefined
    const formId = searchParams.get('formId') || undefined
    const versionId = searchParams.get('versionId') || undefined
    const status = searchParams.get('status') || 'submitted'
    const search = searchParams.get('search') || undefined

    let responses: any[] = []
    let optionsMeta = { forms: [], distributions: [] }

    try {
      const [respList, meta] = await Promise.all([
        listResponsesWorkflow(authContext, {
          distributionId,
          formId,
          versionId,
          status,
          search,
        }),
        getFormAndDistributionOptions(),
      ])
      responses = respList
      optionsMeta = meta
    } catch (err) {
      console.warn('Responses list warning:', err)
      responses = []
    }

    return NextResponse.json({
      success: true,
      responses,
      availableForms: optionsMeta.forms,
      availableDistributions: optionsMeta.distributions,
    })
  } catch (error: any) {
    const status = error.status || 500
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengambil daftar respon.' },
      { status }
    )
  }
}

/**
 * DELETE /api/v1_5/responses?id=xxx or body { ids: ['id1', 'id2'] }
 * Delete single or multiple response documents.
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const singleId = searchParams.get('id')

    let bodyIds: string[] = []
    try {
      const body = await request.json()
      if (Array.isArray(body?.ids)) {
        bodyIds = body.ids
      } else if (body?.id) {
        bodyIds = [body.id]
      }
    } catch {
      // Body might be empty if called via query param ?id=xxx
    }

    const idsToDelete = Array.from(new Set([...(singleId ? [singleId] : []), ...bodyIds])).filter(Boolean)

    if (idsToDelete.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ID tanggapan wajib disertakan.' },
        { status: 400 }
      )
    }

    const { deleteMultipleResponseDocs } = await import('@/lib/firebase/repositories/v1_5/responses.repo')
    await deleteMultipleResponseDocs(idsToDelete)

    return NextResponse.json({
      success: true,
      deletedCount: idsToDelete.length,
      message: `${idsToDelete.length} tanggapan berhasil dihapus.`,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal menghapus tanggapan.' },
      { status: 500 }
    )
  }
}
