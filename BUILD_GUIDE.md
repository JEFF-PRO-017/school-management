# 📱 Guide de génération des applications Desktop et Mobile

## 🖥️ Application Desktop (Electron)

### Installation

```bash
npm install
```

### Lancer en mode développement

```bash
npm run electron
```

Cela lance :
1. Le serveur Next.js sur http://localhost:3000
2. L'application Electron qui se connecte au serveur

### Générer l'installateur

#### Windows (.exe)
```bash
npm run electron:build:win
```
📦 Fichier généré : `dist-electron/Gestion Scolaire Setup.exe`

#### macOS (.dmg)
```bash
npm run electron:build:mac
```
📦 Fichier généré : `dist-electron/Gestion Scolaire.dmg`

#### Linux (.AppImage)
```bash
npm run electron:build:linux
```
📦 Fichier généré : `dist-electron/Gestion Scolaire.AppImage`

#### Toutes les plateformes
```bash
npm run electron:build
```

---

## 📱 Application Mobile (Capacitor)

### Prérequis

**Android :**
- Android Studio installé
- SDK Android (API 21+)
- Java JDK 17

**iOS (macOS uniquement) :**
- Xcode 14+
- CocoaPods installé (`sudo gem install cocoapods`)

### Initialisation (première fois seulement)

```bash
# Initialiser Capacitor
npm run capacitor:init

# Ajouter les plateformes
npm run capacitor:add:android
npm run capacitor:add:ios
```

### Build et synchronisation

```bash
# Build Next.js + Sync avec Capacitor
BUILD_MOBILE=true npm run mobile:build
```

### Ouvrir dans Android Studio

```bash
npm run capacitor:open:android
```

Puis dans Android Studio :
1. Cliquer sur `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`
2. L'APK sera dans `android/app/build/outputs/apk/debug/app-debug.apk`

### Ouvrir dans Xcode (macOS uniquement)

```bash
npm run capacitor:open:ios
```

Puis dans Xcode :
1. Sélectionner un simulateur ou appareil
2. Cliquer sur le bouton Play
3. Pour distribuer : `Product` > `Archive`

---

## 🔧 Structure des dossiers

```
school-management/
├── electron/           # Code Electron (desktop)
│   ├── main.js        # Processus principal
│   └── preload.js     # Bridge sécurisé
├── android/           # Projet Android (généré)
├── ios/              # Projet iOS (généré)
├── dist-electron/    # Build desktop (output)
├── out/              # Export statique pour mobile
└── .next/            # Build Next.js
```

---

## 📋 Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run electron` | Lance l'app desktop en dev |
| `npm run electron:build:win` | Build Windows |
| `npm run electron:build:mac` | Build macOS |
| `npm run electron:build:linux` | Build Linux |
| `npm run capacitor:init` | Initialise Capacitor |
| `npm run capacitor:add:android` | Ajoute Android |
| `npm run capacitor:add:ios` | Ajoute iOS |
| `npm run mobile:build` | Build pour mobile |
| `npm run capacitor:open:android` | Ouvre Android Studio |
| `npm run capacitor:open:ios` | Ouvre Xcode |

---

## 🎨 Icône de l'application

Placez votre icône dans `public/icon.png` (512x512px minimum)

Pour générer les icônes multi-tailles :
```bash
# Installer l'outil
npm install -g icon-gen

# Générer les icônes
icon-gen -i public/icon.png -o public/icons
```

---

## 🚀 Distribution

### Windows
1. Double-cliquez sur `Gestion Scolaire Setup.exe`
2. Suivez l'assistant d'installation

### macOS
1. Ouvrez le fichier `.dmg`
2. Glissez l'app dans Applications

### Linux
1. Rendez l'AppImage exécutable : `chmod +x "Gestion Scolaire.AppImage"`
2. Double-cliquez pour lancer

### Android (APK)
1. Activez "Sources inconnues" dans les paramètres Android
2. Installez l'APK
3. Ou publiez sur Google Play Store

### iOS (IPA)
1. Testez avec TestFlight
2. Ou publiez sur l'App Store

---

## ⚠️ Notes importantes

### Desktop (Electron)
- L'app nécessite une connexion internet pour accéder à Google Sheets
- Les données sont cachées localement (localStorage)
- Fonctionne en mode offline avec synchronisation automatique

### Mobile (Android/iOS)
- Nécessite l'export statique de Next.js (`BUILD_MOBILE=true`)
- Les routes API doivent pointer vers un serveur distant
- Ou configurez un serveur Next.js dédié pour l'API

### Environnement
- Créez `.env.local` avec vos credentials Google Sheets
- Ces variables ne seront PAS incluses dans les builds mobiles
- Pour mobile : utilisez un backend API séparé ou Firebase

---

## 🐛 Dépannage

**Electron ne démarre pas :**
```bash
# Vérifier que le serveur Next.js tourne
curl http://localhost:3000
```

**Capacitor ne trouve pas les fichiers :**
```bash
# Rebuild et resync
rm -rf out .next
BUILD_MOBILE=true npm run build
npx cap sync
```

**Android Studio ne trouve pas le SDK :**
1. Ouvrir Android Studio > Preferences > Android SDK
2. Noter le chemin du SDK
3. Définir `ANDROID_SDK_ROOT` dans votre terminal

---

## 📚 Ressources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Studio](https://developer.android.com/studio)
- [Xcode](https://developer.apple.com/xcode/)
