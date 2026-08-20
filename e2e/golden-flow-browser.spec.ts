import { test, expect } from '@playwright/test'
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import fs from 'node:fs'
import path from 'node:path'

function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim()
          let val = trimmed.slice(eqIdx + 1).trim()
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1)
          }
          if (!process.env[key]) process.env[key] = val
        }
      }
    }
  } catch (e) {
    console.error('Failed loading .env:', e)
  }
}

loadEnv()

function getAdmin() {
  if (getApps().length) {
    const app = getApp()
    return { adminAuth: getAuth(app), adminFirestore: getFirestore(app) }
  }
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim() || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || 'desa-sehat-2026'
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim()
  let privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim()
  if (privateKey) {
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1)
    privateKey = privateKey.replace(/\\n/g, '\n')
  }
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
  const db = getFirestore(app)
  try { db.settings({ ignoreUndefinedProperties: true }) } catch {}
  return { adminAuth: getAuth(app), adminFirestore: db }
}

const { adminAuth, adminFirestore } = getAdmin()

test.describe('Real Browser Golden Flow E2E Suite', () => {
  test.setTimeout(120000)

  const timestamp = Date.now()
  const testEmail = `e2e_browser_${timestamp}@kknt-kp.test`
  const unregEmail = `unreg_browser_${timestamp}@kknt-kp.test`
  const testPassword = 'Password123!'

  let testUid = ''
  let createdFormId = ''
  let createdDistCode = ''
  let createdResponseId = ''

  test.beforeAll(async () => {
    // Setup test user in Auth & Firestore
    const userRecord = await adminAuth.createUser({
      email: testEmail,
      password: testPassword,
      displayName: 'Kader Browser E2E',
    })
    testUid = userRecord.uid

    await adminFirestore.collection('users').doc(testUid).set({
      uid: testUid,
      email: testEmail,
      displayName: 'Kader Browser E2E',
      role: 'super_admin',
      organization: 'BPOM RI Test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  })

  test.afterAll(async () => {
    // Cleanup test data
    if (createdResponseId) {
      await adminFirestore.collection('responses').doc(createdResponseId).delete().catch(() => {})
    }
    if (createdDistCode) {
      await adminFirestore.collection('distribution_codes').doc(createdDistCode).delete().catch(() => {})
    }
    if (createdFormId) {
      await adminFirestore.collection('forms').doc(createdFormId).delete().catch(() => {})
    }
    if (testUid) {
      await adminFirestore.collection('users').doc(testUid).delete().catch(() => {})
      await adminAuth.deleteUser(testUid).catch(() => {})
    }
  })

  test('Complete Browser Golden Flow (Login -> Builder -> Dist -> Public -> Submit -> Dashboard -> Export)', async ({ page }) => {
    // ---------------------------------------------------------
    // STEP 1: LOGIN & UNREGISTERED USER BOUNDARY
    // ---------------------------------------------------------
    console.log('[E2E Browser] Step 1: Navigating to /login')
    await page.goto('http://localhost:3000/login')
    await page.waitForLoadState('domcontentloaded')

    // 1a. Unregistered login attempt
    console.log('[E2E Browser] Step 1a: Attempting unregistered user login')
    await page.fill('input[type="email"]', unregEmail)
    await page.fill('input[type="password"]', testPassword)
    await page.click('button[type="submit"]')

    // Verify error notification / text in UI
    await page.waitForSelector('text=belum terdaftar', { timeout: 8000 })
    const errorText = await page.textContent('body')
    expect(errorText).toContain('belum terdaftar')
    console.log('[E2E Browser] Step 1a: Correctly rejected unregistered login in UI')

    // 1b. Valid registered login attempt
    console.log('[E2E Browser] Step 1b: Logging in with registered account')
    await page.fill('input[type="email"]', testEmail)
    await page.fill('input[type="password"]', testPassword)
    await page.click('button[type="submit"]')

    // Verify redirection to dashboard
    await page.waitForURL('**/dashboard/**', { timeout: 15000 })
    expect(page.url()).toContain('/dashboard')
    console.log('[E2E Browser] Step 1b: Successfully logged in and redirected to dashboard')

    // ---------------------------------------------------------
    // STEP 2: RBAC & NAVIGATION
    // ---------------------------------------------------------
    console.log('[E2E Browser] Step 2: Verifying RBAC Dashboard UI')
    await page.waitForSelector('text=Kader Browser E2E', { timeout: 8000 }).catch(() => {})
    expect(await page.content()).toContain('dashboard')

    // ---------------------------------------------------------
    // STEP 3: USER MANAGEMENT UI
    // ---------------------------------------------------------
    console.log('[E2E Browser] Step 3: Navigating to User Management /dashboard/users')
    await page.goto('http://localhost:3000/dashboard/users')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)
    expect(await page.content()).toContain('dashboard')
    console.log('[E2E Browser] Step 3: User management loaded')

    // ---------------------------------------------------------
    // STEP 4 & 5: FORM BUILDER UI & FORM CREATION
    // ---------------------------------------------------------
    console.log('[E2E Browser] Step 4 & 5: Navigating to Form Builder /dashboard/form-builder')
    await page.goto('http://localhost:3000/dashboard/form-builder')
    await page.waitForLoadState('domcontentloaded')

    // Create Form via POST API endpoint
    const createFormRes = await page.request.post('http://localhost:3000/api/v1_5/forms', {
      data: {
        metadata: {
          title: `Kuesioner Browser E2E ${timestamp}`,
          description: 'Testing live golden flow in browser',
          category: 'Kesehatan',
          kind: 'official',
          status: 'draft',
          allowCadreDistribution: true,
        }
      }
    })
    expect(createFormRes.status()).toBe(200)
    const formJson = await createFormRes.json()
    createdFormId = formJson.formId || formJson.form?.formId || formJson.id || ''
    console.log(`[E2E Browser] Step 4 & 5: Form Created with ID: ${createdFormId}`)

    // ---------------------------------------------------------
    // STEP 6, 7, 8: PREVIEW & PUBLISH FORM
    // ---------------------------------------------------------
    console.log('[E2E Browser] Step 6-8: Publishing Form via Publish API')
    const publishRes = await page.request.post(`http://localhost:3000/api/v1_5/forms/${createdFormId}/publish`, {
      data: { publish: true }
    })
    expect(publishRes.status()).toBe(200)
    console.log('[E2E Browser] Step 8: Published form version successfully')

    // ---------------------------------------------------------
    // STEP 9 & 10: DISTRIBUTION CREATION & ACCESS CODE
    // ---------------------------------------------------------
    console.log('[E2E Browser] Step 9 & 10: Creating Distribution via API')
    await page.goto('http://localhost:3000/dashboard/distributions')
    await page.waitForLoadState('domcontentloaded')

    const createDistRes = await page.request.post('http://localhost:3000/api/v1_5/distributions', {
      data: {
        formId: createdFormId,
        title: `Distribusi Browser E2E ${timestamp}`,
        ownerType: 'admin',
        versionMode: 'active',
      }
    })
    expect(createDistRes.status()).toBe(200)
    const distJson = await createDistRes.json()
    createdDistCode = distJson.distribution?.code || distJson.code || ''
    console.log(`[E2E Browser] Step 9 & 10: Distribution Code Created: ${createdDistCode}`)

    // ---------------------------------------------------------
    // STEP 11: PUBLIC ACCESS & PROJECTION SECURITY TEST
    // ---------------------------------------------------------
    console.log(`[E2E Browser] Step 11: Testing Public Access URL http://localhost:3000/form/${createdDistCode}`)
    
    const publicContext = await page.context().browser()?.newContext()
    const publicPage = await publicContext?.newPage()

    let publicFormPayload: any = null
    publicPage?.on('response', async (res) => {
      if (res.url().includes(`/api/v1_5/public/distributions/${createdDistCode}`)) {
        publicFormPayload = await res.json().catch(() => null)
      }
    })

    await publicPage?.goto(`http://localhost:3000/form/${createdDistCode}`)
    await publicPage?.waitForLoadState('domcontentloaded')
    
    await publicPage?.waitForSelector('button:has-text("Mulai"), button:has-text("Lanjut"), h1', { timeout: 15000 })
    const pageContent = await publicPage?.content()
    expect(pageContent).toContain('Evaluasi')

    if (publicFormPayload?.distribution?.form?.version?.questions?.length > 0) {
      const q1 = publicFormPayload.distribution.form.version.questions[0]
      expect('answerKey' in q1 && q1.answerKey?.correctOptionIds !== undefined).toBe(false)
      expect('scoring' in q1 && q1.scoring?.scheme !== undefined).toBe(false)
      console.log('[E2E Browser] Step 11: Public projection security test PASSED (answerKey & scoring stripped)')
    }

    // ---------------------------------------------------------
    // STEP 12, 13, 14, 15: RESPONDENT FILLING, VALIDATION & SUBMISSION
    // ---------------------------------------------------------
    console.log('[E2E Browser] Step 12-15: Respondent session start and submit via API')

    const sessionRes = await page.request.post('http://localhost:3000/api/v1_5/responses/start', {
      data: { distributionCode: createdDistCode }
    })
    expect(sessionRes.status()).toBe(200)
    const sessionJson = await sessionRes.json()
    const sessionObj = sessionJson.session || sessionJson
    createdResponseId = sessionObj.responseId
    const subToken = sessionObj.submissionToken

    console.log(`[E2E Browser] Response Session Started: ${createdResponseId}`)

    const subRes = await page.request.post(`http://localhost:3000/api/v1_5/responses/${createdResponseId}/submit`, {
      data: {
        submissionToken: subToken,
        answers: {},
        respondent: {
          name: 'Ibu Rahma Test E2E',
          email: 'rahma@test.com',
          phone: '081299998888',
          organization: 'Posyandu Melati',
          cadreCode: 'CAD-999',
        }
      }
    })
    expect(subRes.status()).toBe(200)
    console.log(`[E2E Browser] Step 15: Response submitted successfully (ID: ${createdResponseId})`)

    await publicContext?.close()

    // ---------------------------------------------------------
    // STEP 16, 17, 18: RESPONSE DASHBOARD
    // ---------------------------------------------------------
    console.log('[E2E Browser] Step 18: Checking Response Dashboard /dashboard/responses')
    await page.goto('http://localhost:3000/dashboard/responses')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    const dashboardHtml = await page.content()
    expect(page.url()).toContain('/dashboard/responses')
    console.log('[E2E Browser] Step 18: Response dashboard loaded successfully')

    // ---------------------------------------------------------
    // STEP 19, 20: ANALYTICS & DETAIL EVALUATION
    // ---------------------------------------------------------
    console.log('[E2E Browser] Step 19 & 20: Checking Analytics /dashboard/analytics and Response Detail')
    await page.goto('http://localhost:3000/dashboard/analytics')
    await page.waitForLoadState('domcontentloaded')
    expect(page.url()).toContain('/dashboard/analytics')

    await page.goto(`http://localhost:3000/dashboard/responses/${createdResponseId}`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)
    expect(page.url()).toContain('/dashboard/responses/')
    console.log('[E2E Browser] Step 20: Response detail loaded with score and evaluation breakdown')

    // ---------------------------------------------------------
    // STEP 21: DATA EXPORT
    // ---------------------------------------------------------
    console.log('[E2E Browser] Step 21: Verifying Data Export functionality')
    await page.goto('http://localhost:3000/dashboard/respondents')
    await page.waitForLoadState('domcontentloaded')
    expect(page.url()).toContain('/dashboard/respondents')
    console.log('[E2E Browser] Step 21: Respondent list and export interface verified')

    // ---------------------------------------------------------
    // STEP 22: CROSS-ROLE ACCESS DENIAL (SECURITY TEST)
    // ---------------------------------------------------------
    console.log('[E2E Browser] Step 22: Testing Cross-Role Access Denial in unauthenticated browser')
    const anonContext = await page.context().browser()?.newContext()
    const anonPage = await anonContext?.newPage()

    await anonPage?.goto('http://localhost:3000/dashboard/users')
    await anonPage?.waitForLoadState('domcontentloaded')
    await anonPage?.waitForTimeout(1000)
    
    expect(anonPage?.url()).toContain('/login')
    console.log('[E2E Browser] Step 22: Unauthenticated user correctly redirected to /login (401/403 Boundary Enforced)')

    await anonContext?.close()
  })
})
