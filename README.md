# KKNT-KP_116 — Platform Edukasi & Survei Keamanan Pangan

Platform web untuk **KKNT-KP UH** (Kuliah Kerja Nyata Tematik Keamanan Pangan, Universitas Hasanuddin) yang mengelola survei/evaluasi keamanan pangan, distribusi kuesioner pre-test & post-test, penilaian otomatis, serta publikasi materi edukasi — terintegrasi dengan BPOM.

## ✨ Fitur Utama

| Modul | Deskripsi |
|---|---|
| **Form Builder** | Bangun kuesioner dengan drag-and-drop, 3 mode penilaian (auto/hybrid/manual), versioning form |
| **Distribusi** | Sebarkan kuesioner via kode akses publik, pantau status, kontrol akses per mitra/kader |
| **Penilaian Otomatis** | Scoring engine canonical (stacked multiple-choice, Likert sikap/perilaku), hasil per-aspek |
| **Dashboard Analitik** | Widget grafik (bar/donut/line/stat/matrix), stacking pretest-vs-posttest, item analysis |
| **Manajemen Responden** | Kelola 130+ responden, export Excel, breakdown skor per aspek |
| **CMS Artikel Edukasi** | Buat/publish materi edukasi, media library, import/export JSON |
| **RBAC Multi-level** | 3 role: `super_admin`, `partnership`, `cadre` |
| **Monitoring Biaya** | Estimasi biaya Firestore per endpoint (observability cost) |

## 🏗 Arsitektur

```
app/                      # Next.js App Router (halaman + API routes)
  ├── api/                # REST API (server-side, guarded)
  ├── dashboard/          # Admin/mitra/kader dashboard (feature-sliced)
  ├── (public pages)      # Landing, edukasi, galeri, form publik
  └── login/

lib/
  ├── domain/             # Business logic (scoring, forms, auth, responses, ...)
  ├── repositories/       # Data access layer (Firestore CRUD)
  ├── infra/              # Firebase client/admin, storage, sanitize, cost estimator
  ├── schemas/            # Zod validation (boundary input)
  └── query-keys.ts       # TanStack Query key factory

features/
  ├── dashboard/          # Shared dashboard components (Sidebar, AuthGuard, Topbar)
  └── form-builder/       # Form builder components

scripts/migration/        # Data migration & seeding (emulator-sandboxed)
test-suites/              # Unit, integration, E2E tests
```

**Prinsip arsitektur**:
- **Feature-sliced + layered** — UI (`app`/`features`) → domain (`lib/domain`) → repository (`lib/repositories`) → infra (`lib/infra`).
- **State management** — TanStack Query v5 (server-state) + Zustand (client-state).
- **Single source of truth** — scoring engine canonical di `lib/domain/scoring/`.
- **Zod boundary validation** — semua input dari API/klien divalidasi.

## 🧰 Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Backend**: Firebase (Auth, Firestore, Storage)
- **State**: TanStack Query v5, Zustand
- **Validation**: Zod
- **Testing**: Node.js built-in test runner, Playwright (E2E)
- **Export**: ExcelJS
- **CI/CD**: GitHub Actions (build, quality, e2e, security, deploy)

## 🚀 Cara Menjalankan

### Prasyarat
- Node.js ≥ 20 (disarankan 22)
- npm
- (Opsional) Java 21 untuk Firebase Emulator

### 1. Install dependencies
```bash
npm install
```

### 2. Setup environment variables
```bash
cp .env.example .env.local
```
Isi `.env.local` dengan kredensial Firebase Anda (lihat `.env.example` untuk panduan lengkap).

### 3. Jalankan Firebase Emulator (untuk development tanpa sentuh produksi)
```bash
npx firebase emulators:start --only firestore,auth
```
Emulator berjalan di:
- Firestore: `localhost:8090`
- Auth: `localhost:9099`

### 4. Jalankan dev server
```bash
npm run dev
```
Buka http://localhost:3000

## 🧪 Testing

```bash
# Unit + integrasi test (Node.js built-in runner)
npm test

# Unit test dengan coverage report
npm run test:coverage

# E2E test (butuh Firebase emulator berjalan)
npx firebase emulators:exec --only firestore,auth --project desa-sehat-2026 "npx playwright test"
```

Struktur test:
- `test-suites/unit/` — unit test (scoring, security, parser, normalizer)
- `test-suites/integration/` — integrasi golden flow
- `test-suites/e2e/` — Playwright E2E (login → builder → distribusi → submit → dashboard)

## 🔐 Keamanan

- **Autentikasi**: Firebase Auth + HttpOnly session cookie (`__session`)
- **Otorisasi**: setiap API route memverifikasi role (`getAuthorizationContext` / `requireRole`)
- **Rate limiting**: `proxy.ts` membatasi request (20/menit untuk endpoint sensitif, 100/menit umum)
- **Validasi input**: Zod schema di boundary API
- **XSS protection**: sanitasi HTML (`sanitize-html.ts`) + CSP header
- **Security headers**: HSTS, CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy
- **Proteksi rute**: `proxy.ts` (Next.js 16 pengganti middleware) mengarahkan `/dashboard` tanpa sesi ke `/login`

## 📊 Observability & Monitoring

- **Cost monitoring**: tab "Monitoring Biaya" di dashboard Settings — estimasi biaya Firestore per endpoint (statis, read-only).
- **Rate limit headers**: `X-RateLimit-*` di tiap response.
- **Struktur logging**: `console.error` di repository layer (untuk integrasi Sentry/CloudWatch di produksi).

## 🚀 Deployment

Lihat `.github/workflows/deploy.yml` untuk pipeline CD (Vercel production + preview).

```bash
# Deploy manual ke Vercel
npm run build
vercel --prod
```

Environment terpisah: production (Firestore `desa-sehat-2026`) vs development (emulator localhost).

## 📁 Struktur Data (Firestore)

| Koleksi | Deskripsi |
|---|---|
| `users` | Akun (super_admin, partnership, cadre) |
| `partnerships` | Data mitra & kader |
| `forms` + `form_versions` | Kuesioner + versioning |
| `distributions` | Distribusi kuesioner (kode akses) |
| `responses` | Jawaban responden + hasil penilaian |
| `articles` | Materi edukasi |
| `form_access` / `form_registry` | Kontrol akses & registri form |
| `settings` | Pengaturan landing page |

## 📄 Lisensi

Proprietary — © KKNT-KP UH. Penggunaan di luar lingkup proyek memerlukan izin.
