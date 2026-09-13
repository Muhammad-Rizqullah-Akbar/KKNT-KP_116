import { NextResponse } from 'next/server'
import {
  getFormCategoriesFromDb,
  getRespondentTargetsFromDb,
} from '@/lib/repositories/form-registry.repo'

export async function GET() {
  try {
    const [categories, targets] = await Promise.all([
      getFormCategoriesFromDb(),
      getRespondentTargetsFromDb(),
    ])

    return NextResponse.json({
      success: true,
      categories,
      targets,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengambil registry metadata' },
      { status: 500 }
    )
  }
}
