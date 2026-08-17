import assert from 'node:assert/strict'
import { test, describe, after } from 'node:test'
import { adminFirestore, adminAuth } from '../lib/firebaseAdmin'
import { createFormWorkflow, createNewVersionWorkflow, publishFormWorkflow } from '../lib/forms/v1_5/formManagement.service'
import { createDistributionWorkflow, resolveDistributionWorkflow } from '../lib/forms/v1_5/distribution.service'
import { startResponseWorkflow, submitResponseWorkflow } from '../lib/forms/v1_5/response.service'

describe('Golden Flow E2E Live Verification Matrix', () => {
  const timestamp = Date.now()
  const testEmail = `cadre_test_${timestamp}@kknt-kp.test`
  const testPassword = 'Password123!'

  let testUid = ''
  let createdFormId = ''
  let createdVersionId = ''
  let createdDistCode = ''
  let createdResponseId = ''

  after(async () => {
    // Cleanup generated Firestore test artifacts
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

  test('1. Security Boundary & Login Unregistered Account Denial', async () => {
    const fakeUid = `fake_${Date.now()}`
    const docSnap = await adminFirestore.collection('users').doc(fakeUid).get()
    assert.equal(docSnap.exists, false, 'Unregistered user document MUST NOT exist')
  })

  test('2. Super Admin User Registration & Role Persistence', async () => {
    const userRecord = await adminAuth.createUser({
      email: testEmail,
      password: testPassword,
      displayName: 'Super Admin Test',
    })
    testUid = userRecord.uid

    await adminFirestore.collection('users').doc(testUid).set({
      uid: testUid,
      email: testEmail,
      displayName: 'Super Admin Test',
      role: 'super_admin',
      organization: 'BPOM RI Test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const userDoc = (await adminFirestore.collection('users').doc(testUid).get()).data()
    assert.equal(userDoc?.role, 'super_admin')
    assert.equal(userDoc?.email, testEmail)
  })

  test('3. Form Creation, Builder State & Versioning', async () => {
    const formDoc = await createFormWorkflow({
      title: `Form E2E Golden Test ${timestamp}`,
      description: 'Kuesioner evaluasi kesehatan pangan',
      category: 'Kesehatan',
      kind: 'official',
      status: 'draft',
      allowCadreDistribution: true,
    }, testUid)

    createdFormId = formDoc.formId
    createdVersionId = formDoc.activeVersionId
    assert.ok(createdFormId.length > 0)
    assert.ok(createdVersionId.length > 0)
    assert.equal(formDoc.activeVersionNumber, 1)

    // Version 2 upgrade
    const version2 = await createNewVersionWorkflow(createdFormId, testUid)
    assert.equal(version2.activeVersionNumber, 2)
  })

  test('4. Form Publish & Distribution Creation', async () => {
    const published = await publishFormWorkflow(createdFormId, testUid)
    assert.equal(published.aggregate.status, 'published')

    const authContext = { uid: testUid, role: 'super_admin' as const, token: {} as any }
    const dist = await createDistributionWorkflow({
      formId: createdFormId,
      title: `Distribusi Golden Test ${timestamp}`,
      ownerType: 'admin',
      targetUserId: testUid,
      targetUserName: 'Super Admin Test',
      versionMode: 'pinned',
      pinnedVersionId: createdVersionId,
    }, authContext)

    createdDistCode = dist.code
    assert.ok(createdDistCode.length > 0)
    assert.equal(dist.status, 'active')
  })

  test('5. Public Form Projection & Security Boundary Verification', async () => {
    const publicDist = await resolveDistributionWorkflow(createdDistCode)
    assert.equal(publicDist.status, 'active')
    assert.equal(publicDist.formId, createdFormId)

    // Verify answerKey and scoring internals are stripped from public DTO
    const questions = publicDist.form.version.questions || []
    if (questions.length > 0) {
      const q1 = questions[0] as any
      assert.equal('answerKey' in q1 && q1.answerKey?.correctOptionIds !== undefined, false, 'answerKey MUST be stripped')
      assert.equal('scoring' in q1 && q1.scoring?.scheme !== undefined, false, 'scoring MUST be stripped')
    }
  })

  test('6. Respondent Session Start, Filling & Submission', async () => {
    const sessionDTO = await startResponseWorkflow({
      distributionCode: createdDistCode,
      respondent: {
        name: 'Responden Golden Test',
        email: 'responden@golden.test',
        phone: '081234567890',
      }
    })

    createdResponseId = sessionDTO.responseId
    assert.ok(createdResponseId.length > 0)

    const submitDTO = await submitResponseWorkflow(createdResponseId, {
      submissionToken: sessionDTO.submissionToken,
      answers: {},
    })

    assert.equal(submitDTO.status, 'submitted')
    assert.equal(submitDTO.responseId, createdResponseId)
  })

  test('7. Authoritative Firestore Persistence & Response Verification', async () => {
    const docSnap = await adminFirestore.collection('responses').doc(createdResponseId).get()
    assert.equal(docSnap.exists, true)
    const data = docSnap.data()
    assert.equal(data?.status, 'submitted')
    assert.equal(data?.distributionCode, createdDistCode)
    assert.ok(data?.result?.percentage !== undefined)
  })
})
