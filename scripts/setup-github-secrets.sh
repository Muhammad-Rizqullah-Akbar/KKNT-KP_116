#!/usr/bin/env bash
# ============================================================
# Setup GitHub Actions Secrets & Variables untuk CD
# ============================================================
# Script ini MEMBANTU Anda mengisi secret & variable yang
# dibutuhkan workflow CI/CD agar bisa deploy ke Vercel.
#
# Cara pakai:
#   1. Isi nilai di bawah (jangan commit file ini dengan nilai asli!)
#   2. Jalankan:  bash scripts/setup-github-secrets.sh
#   3. Script meminta input interaktif lalu `gh secret set` / `gh variable set`.
#
# ATAU set manual via web:
#   GitHub → repo → Settings → Secrets and variables → Actions
# ============================================================

set -euo pipefail

REPO="Muhammad-Rizqullah-Akbar/KKNT-KP_116"

echo "============================================================"
echo " Setup GitHub Actions Secrets & Variables"
echo " Repo: $REPO"
echo "============================================================"
echo ""
echo "Kategori nilai:"
echo "  - VARS (variable)  = nilai PUBLIK (NEXT_PUBLIC_* dikirim ke browser)"
echo "  - SECRETS          = nilai RAHASIA (private key, token)"
echo ""
echo "Tekan Enter untuk melewati (skip) suatu nilai."
echo ""

# ---------- Vercel (SECRETS) ----------
echo "--- Vercel deployment token (SECRETS) ---"
read -rp "VERCEL_TOKEN       [skip]: " VERCEL_TOKEN
if [ -n "$VERCEL_TOKEN" ]; then
  gh secret set VERCEL_TOKEN --repo "$REPO" --body "$VERCEL_TOKEN"
fi

read -rp "VERCEL_ORG_ID      [skip]: " VERCEL_ORG_ID
if [ -n "$VERCEL_ORG_ID" ]; then
  gh secret set VERCEL_ORG_ID --repo "$REPO" --body "$VERCEL_ORG_ID"
fi

read -rp "VERCEL_PROJECT_ID  [skip]: " VERCEL_PROJECT_ID
if [ -n "$VERCEL_PROJECT_ID" ]; then
  gh secret set VERCEL_PROJECT_ID --repo "$REPO" --body "$VERCEL_PROJECT_ID"
fi

# ---------- Firebase web config (VARIABLES, public) ----------
echo ""
echo "--- Firebase web config (VARIABLES, public) ---"
echo "Sumber: Firebase Console → Project settings → General → Web app"

read -rp "NEXT_PUBLIC_FIREBASE_API_KEY             [skip]: " NEXT_PUBLIC_FIREBASE_API_KEY
[ -n "$NEXT_PUBLIC_FIREBASE_API_KEY" ] && gh variable set NEXT_PUBLIC_FIREBASE_API_KEY --repo "$REPO" --body "$NEXT_PUBLIC_FIREBASE_API_KEY"

read -rp "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN         [skip]: " NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
[ -n "$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" ] && gh variable set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN --repo "$REPO" --body "$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"

read -rp "NEXT_PUBLIC_FIREBASE_PROJECT_ID          [skip]: " NEXT_PUBLIC_FIREBASE_PROJECT_ID
[ -n "$NEXT_PUBLIC_FIREBASE_PROJECT_ID" ] && gh variable set NEXT_PUBLIC_FIREBASE_PROJECT_ID --repo "$REPO" --body "$NEXT_PUBLIC_FIREBASE_PROJECT_ID"

read -rp "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET      [skip]: " NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
[ -n "$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" ] && gh variable set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET --repo "$REPO" --body "$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"

read -rp "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID [skip]: " NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
[ -n "$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" ] && gh variable set NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --repo "$REPO" --body "$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"

read -rp "NEXT_PUBLIC_FIREBASE_APP_ID              [skip]: " NEXT_PUBLIC_FIREBASE_APP_ID
[ -n "$NEXT_PUBLIC_FIREBASE_APP_ID" ] && gh variable set NEXT_PUBLIC_FIREBASE_APP_ID --repo "$REPO" --body "$NEXT_PUBLIC_FIREBASE_APP_ID"

# ---------- Firebase Admin SDK (SECRETS) ----------
echo ""
echo "--- Firebase Admin SDK (SECRETS) ---"
echo "Sumber: Firebase Console → Project settings → Service accounts → Generate private key"

read -rp "FIREBASE_PROJECT_ID   [skip]: " FIREBASE_PROJECT_ID
[ -n "$FIREBASE_PROJECT_ID" ] && gh secret set FIREBASE_PROJECT_ID --repo "$REPO" --body "$FIREBASE_PROJECT_ID"

read -rp "FIREBASE_CLIENT_EMAIL [skip]: " FIREBASE_CLIENT_EMAIL
[ -n "$FIREBASE_CLIENT_EMAIL" ] && gh secret set FIREBASE_CLIENT_EMAIL --repo "$REPO" --body "$FIREBASE_CLIENT_EMAIL"

read -rp "FIREBASE_PRIVATE_KEY  [skip, paste full key with \\n]: " FIREBASE_PRIVATE_KEY
[ -n "$FIREBASE_PRIVATE_KEY" ] && gh secret set FIREBASE_PRIVATE_KEY --repo "$REPO" --body "$FIREBASE_PRIVATE_KEY"

echo ""
echo "============================================================"
echo " Selesai. Verifikasi dengan:  gh secret list --repo $REPO"
echo "                             gh variable list --repo $REPO"
echo "============================================================"
