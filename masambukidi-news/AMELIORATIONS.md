# ELUCCO — Dossier technique

État du site `elucco.pages.dev` au 29 juillet 2026 : diagnostic de déploiement et feuille de route priorisée.

## 1. Pourquoi "ça ne marche pas"

Le code est corrigé et fusionné dans `main` sur GitHub (PR #23). Si rien ne change sur le site en ligne, c'est un problème de **déploiement**, pas de code. À vérifier dans l'ordre :

1. **Cloudflare Pages est-il branché sur GitHub ?** Dashboard Cloudflare → Workers & Pages → le projet elucco → onglet *Deployments*. Un nouveau déploiement vers 08h53 (heure du merge) confirme que c'est branché et à jour. Rien de récent → le site n'écoute pas ce dépôt.
2. **Le site a-t-il été fait avec Genspark ?** Si oui, Genspark publie probablement vers Cloudflare depuis sa propre copie du code, indépendante de GitHub. Il faudrait republier depuis Genspark avec les fichiers mis à jour de `masambukidi-news/`.
3. **Le Worker n'est jamais automatique**, quelle que soit la réponse ci-dessus — voir point critique plus bas.

## 2. Déjà fait

- Clé Brevo et mot de passe admin retirés du code (secrets Cloudflare + jeton de session signé).
- Lien "Admin" retiré de la navigation publique (header, menu mobile, footer).
- Bandeaux de date fermables (bouton × mémorisé par occasion) ; le pop-up de notifications ne boucle plus.
- Compte à rebours royal pour le 30 juillet (couronne, message, minuteur en direct, du 23 au 30 juillet).

## 3. Critique

### Le Worker n'a pas encore les nouveaux secrets
Tant que `BREVO_KEY`, `ADMIN_PASSWORD` et `SESSION_SECRET` ne sont pas configurés dans Cloudflare (Dashboard → le Worker → Settings → Variables and Secrets) et que le nouveau `worker.js` n'y est pas recopié, le panneau admin ne peut plus se connecter ni envoyer d'e-mails.
— `elucco-worker/worker.js`, `elucco-worker/README.md`

### Les publications ne sont visibles que dans ton propre navigateur
Le panneau admin écrit les news dans le `localStorage` du navigateur qui les crée. Un visiteur sur un autre appareil ne les verra jamais. Il faut un vrai stockage côté serveur (Cloudflare KV, branché sur le Worker existant) pour que les publications soient réellement partagées.
— `masambukidi-news/admin.html` (fonction `addPost`), `masambukidi-news/index.html` (`getLS('elucco_posts')`)

## 4. Important

### Performance : images non optimisées, CDN externes sans repli
5 Mo de photos, une seule des 15 balises `<img>` utilise `loading="lazy"`. Google Fonts + Font Awesome (cdnjs) sont chargés sans repli : si l'un des deux est bloqué ou lent, tout le texte et toutes les icônes restent invisibles le temps du timeout.

### SEO : le site est quasi invisible pour Google
Contrairement à `hakvision243.blog`, `elucco.pages.dev` n'a ni `robots.txt` ni `sitemap.xml`. L'image de partage (`og:image`) pointe vers un chemin relatif, cassée sur WhatsApp/Facebook/Twitter qui exigent une URL absolue. Le contenu vit sur une seule page à onglets JS : Google n'a qu'une seule URL à indexer.

## 5. Modéré

### Accessibilité
Peu d'images ont un `alt` descriptif ; certains boutons (`onclick` sur des `<div>`/`<a>` sans `href`) ne sont pas atteignables au clavier ni lus correctement par un lecteur d'écran.

### Architecture de déploiement peu claire
GitHub Pages (racine), Cloudflare Pages (elucco), Worker (email), peut-être Genspark : quatre systèmes, aucune documentation de qui déploie quoi.

## 6. Idées, si tu veux aller plus loin

Un vrai formulaire de contact (au lieu d'un simple `mailto:`), une page dédiée par publication (meilleure pour le partage et le SEO), des statistiques de visite respectueuses de la vie privée.

---

Dossier visuel équivalent : voir le lien Artifact partagé dans la conversation Claude Code.
