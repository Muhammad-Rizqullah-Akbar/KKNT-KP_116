#!/usr/bin/env bash
# Set semua env vars dari .env lokal ke Vercel (production + preview + development)
set -euo pipefail
cd "$(dirname "$0")/.."

ENVS=("production" "preview" "development")

# Baca .env (hanya key=value valid)
declare -A KV
while IFS='=' read -r key value; do
  # skip komentar & kosong
  [[ -z "$key" || "$key" =~ ^# ]] && continue
  # strip quotes
  value="${value%\"}"; value="${value#\"}"
  value="${value%\'}"; value="${value#\'}"
  KV["$key"]="$value"
done < .env

# Keys yang mau di-set (semua yang dipakai kode)
KEYS=(
  FIREBASE_PROJECT_ID
  FIREBASE_CLIENT_EMAIL
  FIREBASE_PRIVATE_KEY
  NEXT_PUBLIC_FIREBASE_API_KEY
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  NEXT_PUBLIC_FIREBASE_PROJECT_ID
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  NEXT_PUBLIC_FIREBASE_APP_ID
  NEXT_PUBLIC_USE_EMULATOR
)

for env in "${ENVS[@]}"; do
  echo "=== Setting env untuk: $env ==="
  for key in "${KEYS[@]}"; do
    val="${KV[$key]:-}"
    if [[ -n "$val" ]]; then
      printf '%s' "$val" | vercel env add "$key" "$env" --force 2>&1 | head -1
    fi
  done
done

echo ""
echo "✅ Selesai set env vars."
