#!/bin/bash
# ============================================
# SCRIPT DE DÉPLOIEMENT CLOUDFLARE PAGES
# Site: Masambukidi News
# ============================================

echo "🚀 Déploiement Masambukidi News sur Cloudflare Pages..."
echo ""

# Vérifier que le token est défini
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ CLOUDFLARE_API_TOKEN non défini"
    echo ""
    echo "👉 Commande à exécuter :"
    echo "   export CLOUDFLARE_API_TOKEN='votre_token_ici'"
    echo ""
    echo "👉 Pour créer un token :"
    echo "   https://dash.cloudflare.com/profile/api-tokens"
    echo "   → Permissions requises: Cloudflare Pages:Edit"
    exit 1
fi

PROJECT_NAME="masambukidi-news"
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "📁 Dossier: $DIR"
echo "🌐 Projet: $PROJECT_NAME"
echo ""

# Créer le projet si nécessaire
echo "📋 Vérification du projet Cloudflare Pages..."
wrangler pages project list 2>/dev/null | grep -q "$PROJECT_NAME" || {
    echo "✨ Création du projet '$PROJECT_NAME'..."
    wrangler pages project create "$PROJECT_NAME" --production-branch=main
}

# Déployer
echo "📤 Déploiement en cours..."
wrangler pages deploy "$DIR" --project-name="$PROJECT_NAME" --branch=main

echo ""
echo "✅ Déploiement terminé !"
echo "🌐 Site disponible sur: https://$PROJECT_NAME.pages.dev"
echo "🔗 Lié à: https://masambukidi-protection.pages.dev"
