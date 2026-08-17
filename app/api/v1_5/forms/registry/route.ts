import { NextResponse } from 'next/server'
import {
  getFormCategoriesFromDb,
  getRespondentTargetsFromDb,
} from '@/lib/firebase/repositories/v1_5/v1_5Registry.repo'

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
