# 🚀 Guide de Déploiement

Ce document explique comment déployer l'application de gestion scolaire sur différentes plateformes cloud gratuites.

## 📋 Avant de commencer

### Checklist pré-déploiement

- [ ] L'application fonctionne en local (`npm run dev`)
- [ ] Les variables d'environnement sont configurées
- [ ] Le Service Account Google a accès au Google Sheet
- [ ] Le code est versionné sur Git/GitHub (recommandé)

## 🌐 Option 1 : Vercel (Recommandé)

**Avantages** : Gratuit, facile, optimisé pour Next.js, déploiement automatique
**Limite gratuite** : 100 GB bandwidth/mois, illimité en projets

### Étape par étape

1. **Créer un compte Vercel**
   - Aller sur https://vercel.com
   - S'inscrire avec GitHub (recommandé)

2. **Importer le projet**
   - Cliquer sur "New Project"
   - Importer depuis GitHub (ou uploader le dossier)
   - Sélectionner le repository

3. **Configurer les variables d'environnement**
   - Dans "Environment Variables", ajouter :
     ```
     GOOGLE_SHEETS_SPREADSHEET_ID
     GOOGLE_SERVICE_ACCOUNT_EMAIL
     GOOGLE_PRIVATE_KEY
     NEXT_PUBLIC_APP_NAME
     ```
   - ⚠️ Pour `GOOGLE_PRIVATE_KEY`, coller toute la valeur avec les `\n`

4. **Déployer**
   - Cliquer sur "Deploy"
   - Attendre 2-3 minutes
   - Votre app est en ligne ! 🎉

5. **Configuration du domaine (optionnel)**
   - Settings → Domains
   - Ajouter votre domaine personnalisé
   - Suivre les instructions DNS

### Déploiements futurs

Chaque push sur la branche `main` déclenchera automatiquement un nouveau déploiement.

---

## 🟣 Option 2 : Netlify

**Avantages** : Gratuit, simple, bon support
**Limite gratuite** : 100 GB bandwidth/mois, 300 minutes build/mois

### Étape par étape

1. **Créer un compte Netlify**
   - Aller sur https://netlify.com
   - S'inscrire avec GitHub

2. **Créer un fichier netlify.toml**
   
   À la racine du projet :
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"
   
   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

3. **Déployer depuis GitHub**
   - New site from Git → GitHub
   - Sélectionner le repository
   - Build command: `npm run build`
   - Publish directory: `.next`

4. **Configurer les variables d'environnement**
   - Site settings → Environment variables
   - Ajouter toutes les variables comme sur Vercel

5. **Déployer**
   - Cliquer sur "Deploy site"
   - Attendre quelques minutes

---

## 🐳 Option 3 : Docker + Cloud générique

**Avantages** : Portable, contrôle total
**Idéal pour** : Railway, Render, DigitalOcean, AWS, etc.

### 1. Créer un Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### 2. Créer un .dockerignore

```
node_modules
.next
.git
.env*.local
README.md
```

### 3. Build et test local

```bash
docker build -t school-management .
docker run -p 3000:3000 --env-file .env.local school-management
```

### 4. Déployer sur Railway.app

1. Créer un compte sur https://railway.app
2. New Project → Deploy from GitHub
3. Sélectionner le repository
4. Railway détecte automatiquement le Dockerfile
5. Ajouter les variables d'environnement
6. Déployer !

---

## ☁️ Option 4 : Render.com

**Avantages** : Gratuit, facile, bon pour les petits projets
**Limite gratuite** : 750 heures/mois, sleep après 15min d'inactivité

### Étape par étape

1. **Créer un compte Render**
   - https://render.com

2. **Nouveau Web Service**
   - New → Web Service
   - Connecter GitHub
   - Sélectionner le repository

3. **Configuration**
   - Name: `school-management`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

4. **Variables d'environnement**
   - Ajouter toutes les variables
   - ⚠️ Important : Ne pas oublier la clé privée Google

5. **Déployer**
   - Cliquer sur "Create Web Service"
   - Attendre le déploiement (5-10 min)

---

## 📊 Comparaison des plateformes

| Plateforme | Gratuit | Facilité | Performance | Sleep ? | Recommandé pour |
|------------|---------|----------|-------------|---------|-----------------|
| **Vercel** | ✅ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | Production |
| **Netlify** | ✅ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ❌ | Production |
| **Railway** | ✅ ($5 crédit) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ❌ | Production |
| **Render** | ✅ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ | Démo/Test |

---

## 🔐 Sécurité en production

### 1. Variables d'environnement

⚠️ **JAMAIS** commiter le fichier `.env.local` !

Toujours configurer les variables dans le dashboard de la plateforme.

### 2. Service Account Google

- Utilisez un Service Account dédié par environnement
- Production et développement doivent avoir des Service Accounts séparés
- Limitez les permissions au strict minimum (Éditeur sur le seul Google Sheet nécessaire)

### 3. HTTPS

Toutes les plateformes mentionnées fournissent automatiquement du HTTPS. Activez la redirection HTTP → HTTPS.

### 4. Rate Limiting

Google Sheets API a des limites :
- 100 requêtes / 100 secondes / utilisateur
- 500 requêtes / 100 secondes / projet

Pour des volumes importants, considérez :
- Mise en cache (Redis)
- Migration vers une vraie base de données

---

## 🎯 Checklist post-déploiement

- [ ] L'application est accessible sur l'URL de production
- [ ] Le dashboard affiche les bonnes données
- [ ] Les élèves peuvent être ajoutés
- [ ] Les paiements peuvent être enregistrés
- [ ] Les données sont bien synchronisées avec Google Sheets
- [ ] Le responsive fonctionne sur mobile
- [ ] Les variables d'environnement sont correctement configurées
- [ ] Le domaine personnalisé est configuré (si applicable)

---

## 🐛 Dépannage production

### "Internal Server Error"

1. Vérifier les logs de la plateforme
2. Vérifier que toutes les variables d'environnement sont présentes
3. Vérifier que le Service Account a accès au Google Sheet

### "API Rate Limit Exceeded"

1. Réduire la fréquence des appels API
2. Implémenter un cache
3. Considérer une base de données si volumétrie élevée

### "Build Failed"

1. Vérifier que `npm run build` fonctionne en local
2. Vérifier la version de Node.js (18+)
3. Consulter les logs de build de la plateforme

---

## 📈 Monitoring

### Logs

- **Vercel** : Dashboard → Logs
- **Netlify** : Site → Logs
- **Railway** : Project → Logs
- **Render** : Service → Logs

### Analytics

Ajoutez Google Analytics ou Plausible pour suivre l'utilisation.

---

## 🔄 Mises à jour

Pour déployer une nouvelle version :

1. Faire les modifications localement
2. Tester en local (`npm run dev`)
3. Commit et push sur GitHub
4. Le déploiement se fait automatiquement ! ✨

---

## 💡 Conseils de performance

1. **Images** : Utilisez Next.js Image pour optimiser
2. **Cache** : Implémentez du cache pour les données statiques
3. **API** : Groupez les requêtes Google Sheets quand possible
4. **Build** : Utilisez `output: 'standalone'` dans next.config.js (déjà fait)

---

## 🎓 Ressources

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com/)
- [Docker Docs](https://docs.docker.com/)

---

Bon déploiement ! 🚀

Si vous rencontrez des problèmes, consultez les logs de la plateforme ou ouvrez une issue sur GitHub.
