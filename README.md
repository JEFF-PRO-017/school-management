# 🎓 Application de Gestion Scolaire

Application Next.js complète pour la gestion de la scolarité d'une école, utilisant Google Sheets comme base de données.

## ✨ Fonctionnalités

### 📊 Tableau de bord
- Vue d'ensemble des statistiques clés
- Indicateurs de performance financière
- Paiements récents
- Liste des soldes impayés
- Répartition des statuts de paiement

### 👨‍🎓 Gestion des élèves
- Liste complète des élèves
- Ajout et modification d'élèves
- Recherche et filtrage par statut
- Enregistrement rapide des paiements
- Suivi des frais (inscription, scolarité, dossier, autres)
- Calcul automatique des totaux et restes à payer

### 👨‍👩‍👧‍👦 Gestion des familles
- Regroupement des élèves par famille
- Coordonnées des familles (téléphone, email)
- Vue consolidée des paiements par famille
- Statistiques financières par famille
- Ajout de nouvelles familles

### 💰 Historique des paiements
- Liste chronologique de toutes les transactions
- Filtres par type de paiement et date
- Export CSV des paiements
- Statistiques d'encaissement
- Répartition par mode de paiement

### 📅 Moratoires
- Gestion des échelonnements de paiement
- Suivi des délais accordés
- Association aux familles
- Historique des moratoires

## 🚀 Installation

### Prérequis

- Node.js 18+ installé
- Un compte Google Cloud Platform
- Accès au fichier Google Sheets

### 1. Cloner et installer

```bash
# Cloner le projet
cd school-management

# Installer les dépendances
npm install
```

### 2. Configuration Google Sheets API

#### A. Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez-en un existant
3. Activez l'API Google Sheets :
   - Menu → APIs & Services → Library
   - Recherchez "Google Sheets API"
   - Cliquez sur "Enable"

#### B. Créer un compte de service

1. Menu → APIs & Services → Credentials
2. Cliquez sur "Create Credentials" → "Service Account"
3. Remplissez les informations :
   - Nom du service account : `school-management-service`
   - Description : "Service account pour l'app de gestion scolaire"
4. Cliquez sur "Create and Continue"
5. Rôle : Sélectionnez "Editor" (ou "Owner" pour plus de permissions)
6. Cliquez sur "Continue" puis "Done"

#### C. Générer une clé privée

1. Dans la liste des Service Accounts, cliquez sur celui que vous venez de créer
2. Onglet "Keys" → "Add Key" → "Create new key"
3. Format : JSON
4. Cliquez sur "Create" → Un fichier JSON sera téléchargé

#### D. Partager le Google Sheet

1. Ouvrez votre fichier Google Sheets
2. Cliquez sur "Partager"
3. Ajoutez l'email du service account (format: `xxx@xxx.iam.gserviceaccount.com`)
4. Donnez-lui les droits "Éditeur"
5. Cliquez sur "Envoyer"

### 3. Configuration des variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
# ID du Google Spreadsheet (dans l'URL)
GOOGLE_SHEETS_SPREADSHEET_ID=1Tc07cxGpgBMe0Ag2UTMVPcbT-5BhQ6fmQqX57r2gin0

# Email du service account (dans le fichier JSON téléchargé)
GOOGLE_SERVICE_ACCOUNT_EMAIL=votre-service-account@project.iam.gserviceaccount.com

# Clé privée (dans le fichier JSON, copier toute la valeur entre guillemets)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nVOTRE_CLE_PRIVEE_ICI\n-----END PRIVATE KEY-----\n"

# Nom de l'application
NEXT_PUBLIC_APP_NAME="Gestion Scolaire"
```

⚠️ **Important** : Ne jamais commiter le fichier `.env.local` ! Il est déjà dans `.gitignore`.

### 4. Lancer l'application

```bash
# Mode développement
npm run dev

# Accédez à l'application sur http://localhost:3000
```

## 📦 Déploiement

### Option 1 : Vercel (Recommandé)

1. Créez un compte sur [Vercel](https://vercel.com)
2. Installez Vercel CLI :
   ```bash
   npm i -g vercel
   ```
3. Déployez :
   ```bash
   vercel
   ```
4. Configurez les variables d'environnement dans le dashboard Vercel
5. Redéployez : `vercel --prod`

### Option 2 : Netlify

1. Créez un compte sur [Netlify](https://netlify.com)
2. Créez un fichier `netlify.toml` :
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"
   ```
3. Connectez votre repository GitHub
4. Configurez les variables d'environnement
5. Déployez automatiquement à chaque push

### Option 3 : Docker (Cloud générique)

1. Créez un fichier `Dockerfile` :
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. Build et déployez :
   ```bash
   docker build -t school-management .
   docker run -p 3000:3000 --env-file .env.local school-management
   ```

## 🏗️ Architecture

```
school-management/
├── src/
│   ├── app/                    # Pages Next.js (App Router)
│   │   ├── api/               # Routes API
│   │   │   ├── eleves/
│   │   │   ├── familles/
│   │   │   ├── paiements/
│   │   │   └── moratoires/
│   │   ├── eleves/            # Page élèves
│   │   ├── familles/          # Page familles
│   │   ├── paiements/         # Page paiements
│   │   ├── moratoires/        # Page moratoires
│   │   ├── layout.jsx         # Layout principal
│   │   ├── page.jsx           # Dashboard
│   │   └── globals.css        # Styles globaux
│   ├── components/
│   │   ├── ui/                # Composants UI réutilisables
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Table.jsx
│   │   │   └── Badge.jsx
│   │   ├── layout/            # Composants de layout
│   │   │   └── Navbar.jsx
│   │   └── features/          # Composants métier
│   │       ├── StatCard.jsx
│   │       ├── EleveForm.jsx
│   │       └── PaiementForm.jsx
│   └── lib/
│       ├── google-sheets.js   # Intégration Google Sheets
│       └── utils.js           # Fonctions utilitaires
├── public/                     # Fichiers statiques
├── .env.local                 # Variables d'environnement (NON commité)
├── next.config.js             # Configuration Next.js
├── tailwind.config.js         # Configuration Tailwind CSS
├── package.json
└── README.md
```

## 🎨 Technologies utilisées

- **Framework** : Next.js 14 (App Router)
- **UI** : React 18 + Tailwind CSS
- **Base de données** : Google Sheets API
- **Icônes** : Lucide React
- **Dates** : date-fns
- **Authentification API** : Google Service Account

## 📱 Responsive Design

L'application est entièrement responsive et optimisée pour :
- 📱 Mobile (320px+)
- 📱 Tablette (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large Desktop (1280px+)

## 🔒 Sécurité

- Les credentials Google ne sont jamais exposés côté client
- Toutes les requêtes API passent par le serveur Next.js
- Variables d'environnement protégées
- Validation des données côté serveur

## 🐛 Dépannage

### Erreur "Failed to fetch from Google Sheets"

1. Vérifiez que le Service Account a bien accès au Google Sheet
2. Vérifiez que l'API Google Sheets est activée
3. Vérifiez les variables d'environnement dans `.env.local`
4. Redémarrez le serveur de développement

### Erreur "Invalid private key"

La clé privée doit être sur une seule ligne avec des `\n` :
```env
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nLIGNE1\nLIGNE2\n-----END PRIVATE KEY-----\n"
```

### L'application est lente

- Google Sheets API a des limites de taux (100 requêtes/100 secondes/utilisateur)
- Considérez l'ajout de cache avec Redis ou en mémoire
- Pour de grosses volumétries, migrez vers une vraie base de données

## 📈 Améliorations futures possibles

- [ ] Authentification utilisateurs
- [ ] Système de notifications (email/SMS)
- [ ] Génération de reçus PDF
- [ ] Rapports financiers avancés
- [ ] Import/export Excel
- [ ] Historique des modifications
- [ ] Système de rappels automatiques
- [ ] Dashboard graphique avec charts
- [ ] Application mobile React Native
- [ ] Migration vers PostgreSQL/MySQL

## 📄 Licence

Ce projet est sous licence MIT.

## 👨‍💻 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Consultez la documentation Google Sheets API
- Vérifiez les logs dans la console

## 🙏 Remerciements

Développé avec ❤️ pour faciliter la gestion scolaire.
# school-management
