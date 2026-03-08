#!/bin/bash
# ╔══════════════════════════════════════════════════════╗
# ║  ELUCCO — Déploiement Cloudflare Pages               ║
# ║  Projet: elucco → https://elucco.pages.dev           ║
# ╚══════════════════════════════════════════════════════╝

set -e

PROJECT_NAME="elucco"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================"
echo "  ELUCCO — Déploiement Cloudflare Pages"
echo "========================================"

# Check token
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo ""
  echo "ERREUR: Variable CLOUDFLARE_API_TOKEN manquante."
  echo ""
  echo "Pour obtenir votre token:"
  echo "  1. Allez sur https://dash.cloudflare.com/profile/api-tokens"
  echo "  2. Cliquez 'Créer un token'"
  echo "  3. Utilisez le modèle 'Edit Cloudflare Workers' ou 'Custom token'"
  echo "     avec permissions: Cloudflare Pages:Edit"
  echo "  4. Copiez le token et exécutez:"
  echo "     export CLOUDFLARE_API_TOKEN=votre_token"
  echo "     ./deploy-cloudflare.sh"
  echo ""
  exit 1
fi

echo ""
echo "[1/3] Installation de Wrangler CLI..."
npm install -g wrangler@latest --quiet 2>/dev/null || true

echo "[2/3] Vérification du projet Cloudflare Pages..."
# Try to create project if it doesn't exist
wrangler pages project create "$PROJECT_NAME" --production-branch main 2>/dev/null || echo "(projet existe déjà)"

echo "[3/3] Déploiement du site ELUCCO..."
cd "$DIR"
wrangler pages deploy . \
  --project-name="$PROJECT_NAME" \
  --branch="main" \
  --commit-message="Site ELUCCO v3 - Admin, bannière 6 Mars, emails Brevo"

echo ""
echo "✅ Déploiement terminé !"
echo "   URL: https://elucco.pages.dev"
echo "   Admin: https://elucco.pages.dev/admin.html"
echo "========================================"
