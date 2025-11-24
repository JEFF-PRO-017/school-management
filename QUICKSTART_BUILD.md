# ⚡ Démarrage Rapide - Génération d'Applications

## 🎯 Vous voulez quoi ?

### 💻 Une application Windows/Mac/Linux ?
```bash
# 1. Installer les dépendances
npm install

# 2. Générer l'installateur Windows
npm run electron:build:win

# ✅ Fichier généré : dist-electron/Gestion Scolaire Setup.exe
```

### 📱 Une application Android (APK) ?
```bash
# 1. Installer les dépendances
npm install

# 2. Initialiser (première fois)
npm run capacitor:init
npm run capacitor:add:android

# 3. Build et sync
BUILD_MOBILE=true npm run mobile:build

# 4. Ouvrir Android Studio
npm run capacitor:open:android

# 5. Dans Android Studio :
#    Build > Build Bundle(s) / APK(s) > Build APK(s)

# ✅ APK généré : android/app/build/outputs/apk/debug/app-debug.apk
```

### 🍎 Une application iOS ?
```bash
# 1. Installer les dépendances (macOS uniquement)
npm install

# 2. Initialiser (première fois)
npm run capacitor:init
npm run capacitor:add:ios

# 3. Build et sync
BUILD_MOBILE=true npm run mobile:build

# 4. Ouvrir Xcode
npm run capacitor:open:ios

# 5. Dans Xcode : cliquer sur Play pour tester
```

---

## 📦 Résultats attendus

### Desktop (Electron)
| Plateforme | Commande | Fichier de sortie |
|------------|----------|-------------------|
| Windows | `npm run electron:build:win` | `dist-electron/Gestion Scolaire Setup.exe` |
| macOS | `npm run electron:build:mac` | `dist-electron/Gestion Scolaire.dmg` |
| Linux | `npm run electron:build:linux` | `dist-electron/Gestion Scolaire.AppImage` |

### Mobile (Capacitor)
| Plateforme | Fichier | Emplacement |
|------------|---------|-------------|
| Android | APK | `android/app/build/outputs/apk/debug/app-debug.apk` |
| iOS | IPA | Généré via Xcode Archive |

---

## ⚠️ Prérequis

### Pour Windows/Mac/Linux (Electron)
- ✅ Node.js 18+ installé
- ✅ npm installé
- ✅ C'est tout !

### Pour Android
- ✅ Node.js 18+ installé
- ✅ Android Studio installé
- ✅ SDK Android (API 21+)
- ✅ Java JDK 17

### Pour iOS (macOS uniquement)
- ✅ Node.js 18+ installé
- ✅ Xcode 14+ installé
- ✅ CocoaPods installé (`sudo gem install cocoapods`)

---

## 🚀 Tester avant de distribuer

### Desktop
```bash
# Mode développement
npm run electron
```

### Android
```bash
# Ouvrir dans Android Studio
npm run capacitor:open:android
# Puis cliquer sur Play (bouton vert)
```

### iOS
```bash
# Ouvrir dans Xcode
npm run capacitor:open:ios
# Puis cliquer sur Play (bouton ▶️)
```

---

## 🆘 Problèmes fréquents

### "command not found: electron"
```bash
npm install
```

### "Android SDK not found"
1. Ouvrir Android Studio
2. Tools > SDK Manager
3. Installer Android SDK Platform 21+

### "Xcode command line tools not found"
```bash
xcode-select --install
```

### "Port 3000 already in use"
```bash
# Tuer le processus
kill -9 $(lsof -ti:3000)
```

---

## 📝 Checklist avant distribution

- [ ] Icône créée (`public/icon.png` 512x512px)
- [ ] Variables d'environnement configurées (`.env.local`)
- [ ] Tests effectués sur la plateforme cible
- [ ] Version mise à jour dans `package.json`
- [ ] Documentation utilisateur préparée

---

## 🎓 Tutoriels vidéo recommandés

- **Electron :** https://www.youtube.com/results?search_query=electron+app+tutorial
- **Android Studio :** https://www.youtube.com/results?search_query=android+studio+apk
- **Capacitor :** https://www.youtube.com/results?search_query=capacitor+ionic+tutorial

---

Pour plus de détails, consultez `BUILD_GUIDE.md`.
