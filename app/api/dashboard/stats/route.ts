/**
 * Dashboard Statistics API
 * 
 * GET /api/dashboard/stats
 * 
 * Returns optimized dashboard statistics for admin overview
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDashboardStats } from '@/lib/dashboard/stats.service'
import { auth } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authContext = await auth()
    if (!authContext) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const formId = searchParams.get('formId') || undefined
    const distributionId = searchParams.get('distributionId') || undefined
    const days = parseInt(searchParams.get('days') || '30', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    // Get stats
    const stats = await getDashboardStats({
      formId,
      distributionId,
      ownerId: authContext.uid,
      days,
      limit,
    })

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error: any) {
    console.error('[Dashboard Stats API Error]:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
