# ELUCCO Email Worker

Cloudflare Worker qui gère :
- `POST /api/subscribe` — inscription publique à la newsletter (ajout Brevo + email de bienvenue)
- `POST /api/admin/login` — vérifie le mot de passe admin et renvoie un jeton de session signé (4h)
- `POST /api/broadcast` — envoi d'un email à tous les abonnés (protégé, jeton requis)
- `GET /api/subscribers` — liste des abonnés Brevo (protégé, jeton requis)

## Secrets requis

Aucun secret ne doit être écrit dans le code. Ils se configurent dans
Cloudflare Dashboard → Workers & Pages → (le worker) → **Settings → Variables and Secrets**,
ou via Wrangler :

```bash
wrangler secret put BREVO_KEY        # clé API Brevo (Transactional)
wrangler secret put ADMIN_PASSWORD   # mot de passe du panneau admin ELUCCO
wrangler secret put SESSION_SECRET   # chaîne aléatoire longue, ex: openssl rand -hex 32
```

Si l'un de ces secrets manque, le worker répond `500` plutôt que de fonctionner
avec une valeur par défaut — pas de repli silencieux vers un secret codé en dur.

## Rotation

La clé Brevo et le mot de passe admin exposés dans une version précédente de ce
fichier et de `masambukidi-news/admin.html` doivent être considérés comme
compromis (ils étaient visibles publiquement dans le code source du site) :

1. Régénérer la clé API dans Brevo → SMTP & API → API Keys, révoquer l'ancienne.
2. Choisir un nouveau mot de passe admin.
3. Mettre à jour les secrets du Worker avec les nouvelles valeurs.
