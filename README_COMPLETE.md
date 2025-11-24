# 🎓 Gestion Scolaire - Application Multi-Plateforme

Application complète de gestion scolaire avec Google Sheets comme base de données.

## 🌟 Nouveautés v2.0

### 🖥️ Application Desktop (Electron)
✅ **Windows** - Générez un installateur `.exe`  
✅ **macOS** - Générez une app `.dmg`  
✅ **Linux** - Générez un `.AppImage`

### 📱 Application Mobile (Capacitor)
✅ **Android** - Générez un APK installable  
✅ **iOS** - Générez une app pour iPhone/iPad

### 🚀 Fonctionnalités
- ✅ Architecture SWR avec cache localStorage
- ✅ Support offline avec queue de synchronisation
- ✅ Mutations optimistes pour UX fluide
- ✅ Audit complet des opérations
- ✅ Identification unique par appareil
- ✅ Pages de détail pour chaque entité
- ✅ Filtres par date pour moratoires
- ✅ **Nouveau :** Section paiements du jour sur dashboard
- ✅ **Nouveau :** Bouton "Nouveau paiement" rapide

---

## 📦 Installation

```bash
# Cloner ou extraire le projet
cd school-management

# Installer les dépendances
npm install

# Configurer les credentials Google Sheets
cp .env.local.example .env.local
# Éditer .env.local avec vos informations

# Lancer en mode web
npm run dev
```

---

## 🖥️ Générer l'application Desktop

### Windows
```bash
npm run electron:build:win
```
📦 Installateur : `dist-electron/Gestion Scolaire Setup.exe`

### macOS
```bash
npm run electron:build:mac
```
📦 DMG : `dist-electron/Gestion Scolaire.dmg`

### Linux
```bash
npm run electron:build:linux
```
📦 AppImage : `dist-electron/Gestion Scolaire.AppImage`

**Tester avant de build :**
```bash
npm run electron
```

---

## 📱 Générer l'application Mobile

### Android (APK)

**Prérequis :**
- Android Studio installé
- SDK Android (API 21+)
- Java JDK 17

**Commandes :**
```bash
# 1. Initialiser (première fois)
npm run capacitor:init
npm run capacitor:add:android

# 2. Build et sync
BUILD_MOBILE=true npm run mobile:build

# 3. Ouvrir Android Studio
npm run capacitor:open:android

# 4. Dans Android Studio :
#    Build > Build Bundle(s) / APK(s) > Build APK(s)
```

📦 APK : `android/app/build/outputs/apk/debug/app-debug.apk`

### iOS (macOS uniquement)

**Prérequis :**
- Xcode 14+
- CocoaPods (`sudo gem install cocoapods`)

**Commandes :**
```bash
# 1. Initialiser (première fois)
npm run capacitor:init
npm run capacitor:add:ios

# 2. Build et sync
BUILD_MOBILE=true npm run mobile:build

# 3. Ouvrir Xcode
npm run capacitor:open:ios

# 4. Dans Xcode : cliquer sur Play pour tester
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| `README.md` | Ce fichier - vue d'ensemble |
| `QUICKSTART_BUILD.md` | ⚡ Guide de build rapide |
| `BUILD_GUIDE.md` | 📖 Guide détaillé de génération |
| `QUICKSTART.md` | 🚀 Démarrage rapide web |
| `DEPLOYMENT.md` | 🌐 Déploiement Vercel |
| `PRESENTATION.md` | 📊 Présentation du projet |

---

## 🎯 Scripts npm disponibles

### Développement
```bash
npm run dev              # Lancer Next.js en dev
npm run electron         # Lancer Electron en dev
npm test-connection      # Tester la connexion Google Sheets
```

### Build Desktop
```bash
npm run electron:build       # Build toutes plateformes
npm run electron:build:win   # Build Windows
npm run electron:build:mac   # Build macOS
npm run electron:build:linux # Build Linux
```

### Build Mobile
```bash
npm run capacitor:init           # Initialiser Capacitor
npm run capacitor:add:android    # Ajouter Android
npm run capacitor:add:ios        # Ajouter iOS
npm run mobile:build             # Build + sync
npm run capacitor:open:android   # Ouvrir Android Studio
npm run capacitor:open:ios       # Ouvrir Xcode
```

---

## 🏗️ Architecture

```
school-management/
├── electron/              # 🖥️ Code Electron (desktop)
│   ├── main.js           # Processus principal
│   └── preload.js        # Bridge sécurisé
├── src/
│   ├── app/              # Pages Next.js
│   │   ├── page.jsx      # 🆕 Dashboard avec paiements du jour
│   │   ├── eleves/       # Gestion élèves + pages détail
│   │   ├── familles/     # Gestion familles + pages détail
│   │   ├── paiements/    # Gestion paiements + pages détail
│   │   ├── moratoires/   # Gestion moratoires + pages détail
│   │   └── api/          # Routes API avec audit
│   ├── hooks/            # 🪝 Hooks SWR (useEleves, usePaiements, etc.)
│   ├── lib/              # 🔧 Bibliothèques
│   │   ├── swr-config.js         # Config SWR + cache
│   │   ├── offline-manager.js    # Queue offline
│   │   ├── device-id.js          # ID unique appareil
│   │   ├── api-client.js         # Client API centralisé
│   │   └── audit.js              # Système audit
│   └── components/       # Composants React
├── android/              # 📱 Projet Android (généré)
├── ios/                  # 📱 Projet iOS (généré)
├── dist-electron/        # 🖥️ Build desktop (output)
└── out/                  # 📱 Export statique pour mobile
```

---

## 🎨 Personnalisation

### Icône de l'application

Créez `public/icon.png` (512x512px minimum) avec votre logo.

**Avec ImageMagick :**
```bash
convert -size 512x512 xc:none -fill "#3b82f6" \
  -draw "circle 256,256 256,50" \
  -fill white -font Arial -pointsize 200 \
  -gravity center -annotate +0+0 "GS" \
  public/icon.png
```

### Nom de l'application

Modifiez dans `package.json` :
```json
{
  "name": "votre-nom-app",
  "build": {
    "productName": "Votre Nom"
  }
}
```

Et dans `capacitor.config.json` :
```json
{
  "appName": "Votre Nom"
}
```

---

## 🔐 Sécurité

### Variables d'environnement

Pour le web et desktop, créez `.env.local` :
```env
GOOGLE_SHEETS_PRIVATE_KEY="..."
GOOGLE_SHEETS_CLIENT_EMAIL="..."
GOOGLE_SHEET_ID="..."
```

⚠️ **Pour mobile :** Ces variables ne sont PAS incluses dans l'APK/IPA.  
→ Utilisez un backend API séparé ou Firebase.

---

## 📊 Fonctionnalités détaillées

### ✨ Dashboard
- 📈 Stats globales en temps réel
- 💰 **Section paiements du jour** avec total
- 📋 Liste des 5 derniers paiements
- 🚨 Top 5 des soldes impayés
- 🔄 Synchronisation automatique (SWR)

### 👨‍🎓 Gestion Élèves
- ➕ Ajout/modification/suppression
- 📄 Page de détail avec historique complet
- 💳 Paiements liés
- 📊 Situation financière
- 🔍 Recherche et filtres

### 👪 Gestion Familles
- 👥 Vue par famille avec enfants
- 💰 Total dû par famille
- 📄 Page de détail avec tous les enfants
- 📞 Coordonnées complètes

### 💵 Gestion Paiements
- 💳 Multi-types (Espèces, Chèque, Virement, Mobile Money)
- 🧾 Reçu imprimable
- 📄 Page de détail par paiement
- 📅 Historique chronologique

### 📅 Gestion Moratoires
- ⏱️ **Filtres par période** (aujourd'hui, ce mois, etc.)
- 🎯 Dates personnalisées (début/fin)
- 📊 Stats (en cours, terminés, en retard)
- 📄 Page de détail avec jours restants

### 🔄 Fonctionnalités transversales
- 💾 Cache localStorage persistant
- 📶 Mode offline avec queue de synchronisation
- 🎯 Mutations optimistes
- 🔍 Système d'audit complet
- 📱 Identification unique par appareil
- 🔄 Synchronisation automatique
- 🎨 Interface moderne et responsive

---

## 🆘 Dépannage

### "Module not found: Can't resolve 'swr'"
```bash
npm install
```

### "Port 3000 already in use"
```bash
kill -9 $(lsof -ti:3000)
```

### "Electron ne démarre pas"
```bash
# Vérifier que Next.js tourne
curl http://localhost:3000
```

### "Android SDK not found"
1. Ouvrir Android Studio
2. Tools > SDK Manager
3. Installer Android SDK (API 21+)

---

## 📞 Support

Pour plus d'informations :
- 📖 Consultez `BUILD_GUIDE.md` pour les détails techniques
- ⚡ Voir `QUICKSTART_BUILD.md` pour un guide rapide
- 🎓 Tutoriels vidéo : recherchez "Electron build" ou "Capacitor Android" sur YouTube

---

## 📝 Licence

Ce projet est destiné à un usage éducatif et professionnel.

---

## 🎉 Nouveautés de cette version

### v2.0 - Support Multi-Plateforme
- ✨ Electron pour Windows/Mac/Linux
- 📱 Capacitor pour Android/iOS
- 🖥️ Menu natif dans l'app desktop
- 📦 Builds optimisés par plateforme

### v1.5 - Dashboard amélioré
- 💰 Section paiements du jour
- ➕ Bouton "Nouveau paiement" rapide
- 📊 Stats en temps réel avec SWR

### v1.0 - Architecture SWR complète
- 🔄 Cache automatique
- 📶 Support offline
- 🎯 Mutations optimistes
- 🔍 Système d'audit
- 📄 Pages de détail

---

**Développé avec ❤️ en utilisant Next.js 14, React 18, Electron 28 et Capacitor 5**
