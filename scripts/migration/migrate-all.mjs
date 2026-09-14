#!/usr/bin/env node
/**
 * MIGRATE-ALL — satu pipeline bersih untuk replika data emulator.
 *
 * clear → seed → normalize-values (label) → compute-results (result.aspects)
 *
 * Usage: FIRESTORE_EMULATOR_HOST=localhost:8090 node scripts/migration/migrate-all.mjs
 */
import { execSync } from 'node:child_process'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const db = getFirestore(initializeApp({ projectId: 'desa-sehat-2026' }))
db.settings({ host: 'localhost:8090', ssl: false })

const ROOT = process.cwd()
const run = (cmd) => {
  console.log(`\n$ ${cmd}`)
  execSync(cmd, { cwd: ROOT, stdio: 'inherit', env: { ...process.env, FIRESTORE_EMULATOR_HOST: 'localhost:8090' } })
}

// 1. Clear
const cols = ['users','partnerships','forms','form_versions','distributions','responses','articles','article_categories','form_registry','settings','form_access']
for (const c of cols) {
  const s = await db.collection(c).get()
  for (const d of s.docs) await d.ref.delete()
}
console.log('✅ cleared')

// 2. Seed
run('npx tsx scripts/migration/seed.mjs')

// 3. Normalize values (label)
run('node scripts/migration/normalize-values.mjs')

// 4. Compute results (result.aspects)
run('npx tsx scripts/migration/compute-results.mjs')

console.log('\n✅ MIGRATE-ALL COMPLETE')
process.exit(0)
