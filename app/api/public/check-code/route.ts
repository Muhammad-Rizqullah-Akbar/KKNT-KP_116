// app/api/public/check-code/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getFormByCode, getFormGroupByCode } from '@/lib/firebase/repositories/forms.repo'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')?.toUpperCase()

    // Validasi input
    if (!code) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Kode akses wajib diisi' 
        },
        { status: 400 }
      )
    }

    // Validasi format kode (hanya huruf, angka, dan dash)
    if (!/^[A-Z0-9-]+$/.test(code)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Format kode tidak valid. Gunakan huruf, angka, dan dash (-)' 
        },
        { status: 400 }
      )
    }

    // ============ 1. CEK APAKAH KODE ADALAH GROUP ============
    try {
      const group = await getFormGroupByCode(code)
      if (group) {
        return NextResponse.json({
          success: true,
          type: 'group',
          data: {
            id: group.id,
            code: group.code,
            title: group.title,
            description: group.description,
            target: group.target,
            color: group.color,
            formCount: group.formCount,
          }
        })
      }
    } catch (groupError) {
      console.error('Error checking group:', groupError)
      // Lanjut ke pengecekan form
    }

    // ============ 2. CEK APAKAH KODE ADALAH SINGLE FORM ============
    try {
      const form = await getFormByCode(code)
      if (form) {
        // Cek status form (hanya published yang bisa diakses publik)
        if (form.status !== 'published') {
          return NextResponse.json(
            { 
              success: false, 
              message: 'Formulir ini belum dipublikasikan' 
            },
            { status: 403 }
          )
        }

        return NextResponse.json({
          success: true,
          type: 'single',
          data: {
            id: form.id,
            code: form.code,
            title: form.title,
            description: form.description,
            target: form.target,
            status: form.status,
            questions: form.questions || [],
          }
        })
      }
    } catch (formError) {
      console.error('Error checking form:', formError)
    }

    // ============ 3. KODE TIDAK DITEMUKAN ============
    return NextResponse.json(
      { 
        success: false, 
        message: 'Kode akses tidak valid. Periksa kembali kode Anda.' 
      },
      { status: 404 }
    )

  } catch (error: any) {
    console.error('Error checking code:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Terjadi kesalahan server. Silakan coba lagi.' 
      },
      { status: 500 }
    )
  }
}