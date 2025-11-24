#!/bin/bash

# Script d'installation pour l'application de gestion scolaire
# Usage: bash setup.sh

set -e

echo "🎓 Installation de l'Application de Gestion Scolaire"
echo "=================================================="
echo ""

# Vérifier Node.js
echo "🔍 Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé."
    echo "📥 Installez Node.js depuis https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Version de Node.js trop ancienne: $(node -v)"
    echo "📥 Installez Node.js 18+ depuis https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) détecté"
echo ""

# Installation des dépendances
echo "📦 Installation des dépendances..."
npm install
echo "✅ Dépendances installées"
echo ""

# Vérifier si .env.local existe
if [ ! -f .env.local ]; then
    echo "⚙️  Configuration des variables d'environnement..."
    
    # Créer .env.local depuis le template
    if [ -f .env.local.example ]; then
        cp .env.local.example .env.local
        echo "✅ Fichier .env.local créé depuis le template"
        echo ""
        echo "⚠️  IMPORTANT: Vous devez maintenant configurer .env.local avec vos credentials Google:"
        echo ""
        echo "1. Ouvrez .env.local dans votre éditeur"
        echo "2. Remplacez les valeurs par vos credentials Google Sheets"
        echo "3. Sauvegardez le fichier"
        echo ""
        echo "📖 Consultez QUICKSTART.md pour les instructions détaillées"
    else
        echo "❌ Fichier .env.local.example introuvable"
        echo "Créez manuellement un fichier .env.local avec vos variables d'environnement"
    fi
else
    echo "✅ Fichier .env.local déjà configuré"
fi

echo ""
echo "=================================================="
echo "🎉 Installation terminée !"
echo ""
echo "Prochaines étapes:"
echo "1. Configurez .env.local avec vos credentials Google (si pas encore fait)"
echo "2. Lancez l'application avec: npm run dev"
echo "3. Ouvrez http://localhost:3000 dans votre navigateur"
echo ""
echo "📖 Pour plus d'aide, consultez:"
echo "   - QUICKSTART.md : Guide de démarrage rapide"
echo "   - README.md : Documentation complète"
echo "   - DEPLOYMENT.md : Guide de déploiement"
echo ""
echo "Bon courage ! 🚀"
