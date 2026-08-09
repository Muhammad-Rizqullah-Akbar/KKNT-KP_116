import { NextResponse } from 'next/server'
import { resolveDistributionWorkflow } from '@/lib/forms/v1_5/distribution.service'

interface RouteParams {
  params: Promise<{ distributionCode: string }>
}

/**
 * GET /api/v1_5/public/distributions/[distributionCode]
 * 
 * PUBLIC SECURITY BOUNDARY:
 * Case-insensitive lookup of distribution by code (e.g. KKPD7X9).
 * Resolves active vs pinned published form version in 1 read.
 * Returns ONLY PublicDistributionDTO with toPublicFormProjection().
 * NEVER exposes answer keys, scoring weights, thresholds, or owner UIDs to the browser.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { distributionCode } = await params
    if (!distributionCode) {
      return NextResponse.json(
        { success: false, message: 'Kode distribusi tidak valid.' },
        { status: 400 }
      )
    }

    const publicDistribution = await resolveDistributionWorkflow(distributionCode)
    return NextResponse.json({ success: true, distribution: publicDistribution })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Distribusi formulir tidak ditemukan.' },
      { status: 404 }
    )
  }
}
