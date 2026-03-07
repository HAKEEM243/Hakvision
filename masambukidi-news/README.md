# 📰 MASAMBUKIDI NEWS

Site web d'actualités simple et moderne pour la communauté Masambukidi.

## ✨ Fonctionnalités

### 📰 Actualités
- Publication d'articles avec images ou vidéos
- Système de likes (❤️)
- Système de commentaires
- Tri chronologique des actualités
- Design responsive et moderne

### 🖼️ Galerie
- 19 photos haute qualité
- Visualisation en plein écran (modal)
- Design avec bordures dorées
- Grille responsive

### ⚡ Caractéristiques Techniques
- **Sans authentification** - Pas besoin de compte
- **LocalStorage** - Toutes les données stockées localement
- **PWA** - Installable comme application
- **0 dépendances** - Vanilla JavaScript pur
- **100% Frontend** - Aucun backend nécessaire

## 🎨 Design

- Palette royale : Or (#D4AF37) et vert foncé (#0a1f0d)
- Glassmorphism premium
- Animations CSS fluides
- Mobile-friendly
- Police Cinzel pour les titres

## 📱 Utilisation

### Ajouter une actualité
1. Cliquer sur le bouton **+** en bas à droite
2. Remplir le formulaire (titre, description, média)
3. Cliquer sur "Publier"

### Interagir avec les actualités
- **Like** : Cliquer sur le cœur ❤️
- **Commenter** : Cliquer sur 💬, écrire et envoyer
- **Voir média** : Cliquer sur l'image/vidéo pour agrandir

### Voir la galerie
- Cliquer sur "Galerie" dans le menu
- Cliquer sur une photo pour l'agrandir

## 🚀 Déploiement

### Option 1 : Netlify Drop
```
1. Zipper le dossier masambukidi-news
2. Aller sur https://app.netlify.com/drop
3. Glisser-déposer le fichier
4. Site en ligne !
```

### Option 2 : GitHub Pages
```bash
1. Créer un repo GitHub
2. Pousser les fichiers
3. Activer GitHub Pages dans Settings
4. Site disponible sur https://username.github.io/repo
```

### Option 3 : Serveur local
```bash
cd masambukidi-news
python -m http.server 8000
# Ouvrir http://localhost:8000
```

## 📂 Structure

```
masambukidi-news/
├── index.html              # Application complète (HTML+CSS+JS)
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── elucco_logo.png        # Logo (68 Ko)
├── README.md              # Ce fichier
└── *.jpg                  # 19 photos (2.9 Mo)
```

## 🛠️ Technologies

- **HTML5** : Structure sémantique
- **CSS3** : Animations, Glassmorphism
- **JavaScript** : Vanilla JS (0 framework)
- **LocalStorage** : Persistance des données
- **PWA** : Installable et offline

## 📊 Données

Toutes les données sont stockées dans le navigateur (LocalStorage) :
- `masambukidi_news` : Liste des actualités
- `masambukidi_likes` : Compteur de likes par article
- `masambukidi_comments` : Commentaires par article
- `{newsId}_user_liked` : État du like de l'utilisateur

## 🎯 Différences avec l'ancienne version

### ❌ Supprimé
- Authentification Firebase
- Système de groupes (FAMAS, ECOMAS, etc.)
- Chat en temps réel
- Notifications de membres
- Calendrier
- Lieux de culte
- Backend/Database

### ✅ Conservé
- Galerie photos (19 images)
- Design royal doré/vert
- Responsive design
- Logo ELUCCO

### 🆕 Nouveau
- Système de news simple
- Likes et commentaires
- Formulaire d'ajout d'actualités
- Tout en LocalStorage (pas de serveur)

## 📱 PWA

L'application peut être installée sur mobile et desktop :
- **Android** : Menu → "Ajouter à l'écran d'accueil"
- **iOS** : Partager → "Sur l'écran d'accueil"
- **Desktop** : Icône + dans la barre d'adresse

## 🌐 Hébergement gratuit

Le site peut être hébergé gratuitement sur :
- ✅ Netlify (recommandé)
- ✅ GitHub Pages
- ✅ Vercel
- ✅ Cloudflare Pages

## 📄 License

© 2026 Masambukidi - Site d'actualités communautaire

---

**✨ Site simple, rapide et sans complications ✨**

Pas de compte, pas de connexion, juste des news !
