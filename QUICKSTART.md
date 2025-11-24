# 🚀 Démarrage Rapide

Ce guide vous permet de lancer l'application en 10 minutes chrono !

## ⚡ Étapes rapides

### 1️⃣ Installation (2 min)

```bash
cd school-management
npm install
```

### 2️⃣ Configuration Google (5 min)

#### A. Créer un Service Account Google

1. **Aller sur** : https://console.cloud.google.com/
2. **Créer un projet** (ou en sélectionner un)
3. **Activer l'API** : 
   - Menu ☰ → APIs & Services → Library
   - Rechercher "Google Sheets API"
   - Cliquer sur "Enable"

4. **Créer le Service Account** :
   - Menu ☰ → APIs & Services → Credentials
   - "Create Credentials" → "Service Account"
   - Nom : `school-app-service`
   - Rôle : "Editor"
   - Créer une clé JSON (elle se télécharge automatiquement)

#### B. Partager votre Google Sheet

1. Ouvrir le fichier : https://docs.google.com/spreadsheets/d/1Tc07cxGpgBMe0Ag2UTMVPcbT-5BhQ6fmQqX57r2gin0/edit
2. Cliquer sur "Partager" en haut à droite
3. Ajouter l'email du service account (format: `xxx@xxx.iam.gserviceaccount.com`)
   - Vous trouverez cet email dans le fichier JSON téléchargé
4. Permissions : "Éditeur"
5. Cliquer sur "Envoyer"

### 3️⃣ Configuration locale (2 min)

Créer un fichier `.env.local` à la racine du projet :

```env
GOOGLE_SHEETS_SPREADSHEET_ID=1Tc07cxGpgBMe0Ag2UTMVPcbT-5BhQ6fmQqX57r2gin0
GOOGLE_SERVICE_ACCOUNT_EMAIL=VOTRE_EMAIL@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nVOTRE_CLE\n-----END PRIVATE KEY-----\n"
NEXT_PUBLIC_APP_NAME="Gestion Scolaire"
```

**Pour la clé privée** : Ouvrez le fichier JSON téléchargé et copiez la valeur de `private_key` (avec les guillemets et les `\n`).

### 4️⃣ Lancement (1 min)

```bash
npm run dev
```

Ouvrir : http://localhost:3000

## ✅ Checklist de vérification

Avant de commencer, assurez-vous que :

- [ ] Node.js 18+ est installé (`node -v`)
- [ ] Les dépendances sont installées (`npm install`)
- [ ] Le fichier `.env.local` existe avec toutes les variables
- [ ] Le Service Account a accès au Google Sheet
- [ ] L'API Google Sheets est activée dans votre projet Google Cloud

## 🎯 Premiers pas

### Tester l'application

1. **Accéder au tableau de bord** : http://localhost:3000
   - Vous devriez voir les statistiques globales

2. **Voir les élèves** : http://localhost:3000/eleves
   - Liste de tous les élèves du Google Sheet

3. **Ajouter un élève** :
   - Cliquer sur "Nouvel élève"
   - Remplir le formulaire
   - Vérifier dans Google Sheets que l'élève est ajouté

4. **Enregistrer un paiement** :
   - Dans la liste des élèves, cliquer sur "Payer"
   - Entrer le montant
   - Vérifier la mise à jour dans Google Sheets

## 🐛 Problèmes courants

### "Failed to fetch"

**Cause** : Le Service Account n'a pas accès au Google Sheet

**Solution** : 
1. Vérifiez que vous avez bien partagé le Google Sheet
2. Vérifiez l'email du service account dans `.env.local`
3. Redémarrez le serveur

### "Invalid credentials"

**Cause** : La clé privée est mal formatée

**Solution** :
1. Ouvrez le fichier JSON téléchargé
2. Copiez la valeur complète de `private_key`
3. Assurez-vous qu'elle est entre guillemets doubles
4. Gardez les `\n` (ne les remplacez pas par des retours à la ligne réels)

### "API not enabled"

**Cause** : L'API Google Sheets n'est pas activée

**Solution** :
1. https://console.cloud.google.com/
2. Sélectionnez votre projet
3. Menu → APIs & Services → Library
4. Cherchez "Google Sheets API"
5. Cliquez sur "Enable"

## 📚 Ressources

- [Documentation complète](./README.md)
- [Guide Google Sheets API](https://developers.google.com/sheets/api)
- [Documentation Next.js](https://nextjs.org/docs)

## 💡 Conseils

1. **Sauvegarde** : Faites une copie de votre Google Sheet avant de tester
2. **Test** : Commencez avec des données de test
3. **Sécurité** : Ne partagez jamais votre fichier `.env.local`
4. **Performance** : Pour de gros volumes, considérez une vraie base de données

## 🎉 Vous êtes prêt !

L'application est maintenant fonctionnelle. Consultez le [README.md](./README.md) pour plus de détails sur les fonctionnalités et le déploiement en production.

Bon courage ! 🚀
