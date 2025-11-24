# 📱 Guide PWA (Progressive Web App)

## 🎯 Qu'est-ce qu'une PWA ?

Une **Progressive Web App** est une application web qui se comporte comme une application mobile native :
- ✅ Installation sur l'écran d'accueil (comme une app)
- ✅ Fonctionne hors ligne
- ✅ Notifications push
- ✅ Accès rapide sans navigateur
- ✅ Compatible Android, iOS, Windows, macOS

**Avantage vs Capacitor/Electron :** Une seule codebase, déploiement instantané, pas de stores requis !

---

## 🚀 Installation rapide

### Développement

```bash
npm install
npm run dev
```

### Build pour production

```bash
npm run build
npm start
```

---

## 📱 Installer l'app PWA

### Sur Android (Chrome/Edge)

1. Ouvrir l'app dans Chrome : `https://votre-domaine.com`
2. Cliquer sur le menu (⋮) > "Installer l'application"
3. Ou cliquer sur la bannière "Ajouter à l'écran d'accueil"
4. L'icône apparaît sur l'écran d'accueil

### Sur iOS (Safari)

1. Ouvrir l'app dans Safari
2. Cliquer sur le bouton Partager (⬆️)
3. Sélectionner "Sur l'écran d'accueil"
4. Cliquer sur "Ajouter"
5. L'icône apparaît sur l'écran d'accueil

### Sur Windows/macOS (Chrome/Edge)

1. Ouvrir l'app dans Chrome ou Edge
2. Cliquer sur l'icône d'installation (➕) dans la barre d'adresse
3. Ou aller dans Menu > "Installer Gestion Scolaire"
4. L'app s'ouvre dans sa propre fenêtre

---

## 🎨 Personnalisation

### Icônes requises

Créez ces icônes et placez-les dans `public/` :
- `icon-192.png` (192x192px)
- `icon-512.png` (512x512px)

**Avec ImageMagick :**
```bash
# Créer l'icône principale
convert -size 512x512 xc:none -fill "#3b82f6" \
  -draw "circle 256,256 256,50" \
  -fill white -font Arial -pointsize 200 \
  -gravity center -annotate +0+0 "GS" \
  public/icon-512.png

# Créer la version 192px
convert public/icon-512.png -resize 192x192 public/icon-192.png
```

**Outils en ligne :**
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

### Modifier le manifest

Éditez `public/manifest.json` :

```json
{
  "name": "Votre Nom d'App",
  "short_name": "App",
  "theme_color": "#votre-couleur",
  "background_color": "#ffffff"
}
```

### Modifier les couleurs

Dans `src/app/layout.jsx` :
```javascript
export const metadata = {
  themeColor: '#votre-couleur',
  // ...
};
```

---

## 🔧 Configuration PWA

### Service Worker automatique

Le service worker est généré automatiquement par `next-pwa`.

Fichiers générés dans `public/` :
- `sw.js` - Service worker
- `workbox-*.js` - Cache workers

**Ne pas modifier ces fichiers !** Ils sont régénérés à chaque build.

### Cache Strategy

Par défaut, next-pwa utilise :
- **NetworkFirst** pour les pages
- **CacheFirst** pour les assets statiques
- **StaleWhileRevalidate** pour les API

### Mode offline

L'application fonctionne hors ligne grâce à :
1. **Service Worker** - Cache les pages et assets
2. **localStorage** - Cache les données (SWR)
3. **Queue offline** - Synchronise les opérations

---

## 📊 Tester la PWA

### Chrome DevTools

1. Ouvrir DevTools (F12)
2. Aller dans l'onglet **Application**
3. Vérifier :
   - ✅ Manifest (sections : Identity, Presentation)
   - ✅ Service Workers (doit être activé)
   - ✅ Cache Storage (données en cache)

### Lighthouse Audit

1. Ouvrir DevTools (F12)
2. Aller dans l'onglet **Lighthouse**
3. Cocher "Progressive Web App"
4. Cliquer sur "Generate report"
5. Viser un score > 90/100

### Test sur mobile

**Méthode 1 : Déployer**
```bash
# Déployer sur Vercel (gratuit)
npm install -g vercel
vercel deploy
```

**Méthode 2 : Localhost sur réseau**
```bash
# Trouver votre IP locale
ipconfig  # Windows
ifconfig  # Mac/Linux

# Lancer avec l'IP
npm run dev

# Accéder depuis mobile : http://192.168.1.X:3000
```

---

## 🌐 Déploiement

### Vercel (Recommandé)

```bash
npm install -g vercel
vercel deploy --prod
```

URLs :
- Production : `https://votre-app.vercel.app`
- PWA : Installable automatiquement

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Votre propre serveur

```bash
npm run build
npm start
```

Servir avec nginx/Apache sur HTTPS (requis pour PWA).

---

## 📋 Checklist PWA

- [ ] Icônes créées (192px et 512px)
- [ ] manifest.json configuré
- [ ] Thème personnalisé
- [ ] HTTPS activé (requis en production)
- [ ] Service worker enregistré
- [ ] Test Lighthouse > 90
- [ ] Installation testée sur mobile
- [ ] Mode offline testé

---

## 🎯 Fonctionnalités PWA de l'app

### ✅ Installation
- Bannière d'installation automatique
- Icône sur écran d'accueil
- Lancement en plein écran

### ✅ Offline
- Pages consultées en cache
- Données en localStorage
- Queue de synchronisation
- Bannière "Mode hors ligne"

### ✅ Performance
- Cache agressif des assets
- Préchargement des pages
- Chargement instantané

### ✅ Mobile-friendly
- Design responsive
- Boutons tactiles (48px minimum)
- Pas de hover states sur mobile
- Gestes natifs

---

## 🔍 Dépannage

### "Installer" n'apparaît pas

**Causes :**
- ❌ Pas de HTTPS (localhost OK)
- ❌ manifest.json invalide
- ❌ Icônes manquantes
- ❌ Service worker non enregistré

**Solutions :**
```bash
# Vérifier manifest
curl https://votre-domaine.com/manifest.json

# Vérifier service worker
# Ouvrir DevTools > Application > Service Workers
```

### L'app ne fonctionne pas hors ligne

**Vérifier :**
1. Service worker activé
2. Cache contient les pages
3. localStorage contient les données

**Nettoyer le cache :**
```javascript
// Dans DevTools Console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});
```

### Mises à jour ne s'appliquent pas

**Solution :**
```bash
# Vider le cache du service worker
# DevTools > Application > Service Workers > Unregister

# Rebuild
npm run build
```

---

## 📱 Distribution

### Android - TWA (Trusted Web Activity)

Créer une vraie app Android avec PWABuilder :

1. Aller sur https://www.pwabuilder.com/
2. Entrer l'URL de votre PWA
3. Télécharger le package Android
4. Signer et publier sur Play Store

### iOS - App Clip

Créer une app iOS légère :

1. Utiliser https://appmaker.xyz/pwa-to-ios
2. Ou attendre qu'Apple améliore le support PWA

---

## 🎓 Ressources

- **Next.js PWA :** https://github.com/shadowwalker/next-pwa
- **PWA Checklist :** https://web.dev/pwa-checklist/
- **Manifest Generator :** https://www.pwabuilder.com/
- **Icon Generator :** https://realfavicongenerator.net/
- **Testing :** https://web.dev/lighthouse-pwa/

---

## 💡 Conseils

### Pour développeurs

- Toujours tester sur mobile réel
- Utiliser Chrome DevTools Device Mode
- Tester avec 3G lent
- Vérifier le score Lighthouse

### Pour utilisateurs

- Installer l'app pour une expérience optimale
- Activer les notifications (futur)
- Utiliser en mode plein écran

### Pour administrateurs

- HTTPS obligatoire en production
- CDN recommandé (Vercel, Netlify, Cloudflare)
- Monitoring avec Analytics
- Mettre à jour régulièrement

---

**🎉 Votre app est maintenant une PWA complète, installable sur tous les appareils !**
