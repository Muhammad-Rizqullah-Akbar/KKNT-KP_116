// Verifikasi data emulator siap migrasi: cek result.aspects + form target
import fs from 'fs'
const responses = JSON.parse(fs.readFileSync('./data/emulator-export/responses.json', 'utf8'))
const forms = JSON.parse(fs.readFileSync('./data/emulator-export/forms.json', 'utf8'))

console.log('=== RESPONSES: cek result.aspects + percentage ===')
let withResult = 0
let withAspects = 0
let withPercentage = 0
for (const r of responses) {
  if (r.result) withResult++
  if (r.result?.aspects?.length) withAspects++
  if (typeof r.result?.percentage === 'number') withPercentage++
}
console.log(`total: ${responses.length}`)
console.log(`punya result: ${withResult}`)
console.log(`punya result.aspects: ${withAspects}`)
console.log(`punya result.percentage: ${withPercentage}`)

console.log('\n=== FORMS: cek format target ===')
for (const f of forms) {
  console.log(`- ${f.formId || f.id}: ${f.metadata?.title || f.title || '(no title)'} | questions: ${(f.questions?.length || 0)}`)
}

console.log('\n=== FORM VERSIONS ===')
const fv = JSON.parse(fs.readFileSync('./data/emulator-export/form_versions.json', 'utf8'))
for (const v of fv) {
  console.log(`- ${v.versionId || v.id}: formId=${v.formId} | number=${v.versionNumber}`)
}

console.log('\n=== SAMPLE result.aspects (response pertama dengan result) ===')
const withR = responses.find(r => r.result?.aspects?.length)
if (withR) {
  console.log(JSON.stringify(withR.result, null, 2).slice(0, 800))
}
