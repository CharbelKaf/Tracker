<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Neemba Tracker

Application web complète de gestion d'actifs IT avec suivi des affectations, validation multi-niveaux, audit physique et génération de rapports.

View your app in AI Studio: https://ai.studio/apps/drive/12fPMd7khnToNzSWcwqgbVOzJ5M2DPAgn

## 🚀 Démarrage rapide

**Prérequis:** Node.js 18+

1. **Installer les dépendances:**
   ```bash
   npm install
   ```

2. **Configurer la clé API Gemini:**
   Créez un fichier `.env.local` à la racine et ajoutez:
   ```
   GEMINI_API_KEY=votre_clé_api_ici
   ```

3. **Lancer l'application:**
   ```bash
   npm run dev
   ```
   Ouvrez http://localhost:3000

## 📦 Stack technique

- **Frontend:** React 19 + TypeScript + Vite 6
- **Styling:** Tailwind CSS (compilé avec PostCSS)
- **Routing:** React Router (Hash-based)
- **State:** React Context API
- **AI:** Google Gemini API (recherche intelligente, auto-complétion)
- **PDF:** jsPDF + jspdf-autotable
- **QR Scan:** html5-qrcode
- **Qualité:** ESLint + Prettier

## 🛠️ Scripts disponibles

```bash
npm run dev          # Démarrer le serveur de développement
npm run build        # Build de production
npm run preview      # Prévisualiser le build
npm run lint         # Vérifier le code avec ESLint
npm run lint:fix     # Corriger automatiquement les erreurs ESLint
npm run format       # Formater le code avec Prettier
npm run format:check # Vérifier le formatage
npm run typecheck    # Vérifier les types TypeScript
```

## 📁 Structure du projet

```
neemba-tracker/
├── components/          # Composants React
├── contexts/           # Contexts (App, Toast, Theme)
├── types.ts            # Définitions TypeScript
├── data.ts             # Données initiales
├── App.tsx             # Composant racine
├── index.tsx           # Point d'entrée
├── index.css           # Styles Tailwind
├── index.html          # Template HTML
├── vite.config.ts      # Configuration Vite
├── tailwind.config.js  # Configuration Tailwind
├── postcss.config.js   # Configuration PostCSS
├── eslint.config.js    # Configuration ESLint
└── .prettierrc         # Configuration Prettier
```

## 🎯 Fonctionnalités principales

- ✅ **Gestion d'inventaire** avec filtres avancés et actions groupées
- ✅ **Gestion des utilisateurs** avec rôles (Admin, Manager, Employé)
- ✅ **Workflow d'affectation** avec validation multi-niveaux (IT, Manager, User)
- ✅ **Audit physique** avec scan QR code
- ✅ **Rapports** exportables (CSV, PDF)
- ✅ **Recherche intelligente** alimentée par Gemini AI
- ✅ **Mode sombre/clair**
- ✅ **Authentification** PIN + WebAuthn (biométrie)
- ✅ **Import/Export** CSV pour équipements, utilisateurs, modèles

## 🔒 Sécurité

- Contrôle d'accès basé sur les rôles (RBAC)
- Validation PIN à 6 chiffres
- Support WebAuthn pour authentification biométrique
- Clé API Gemini injectée côté serveur (non exposée dans le bundle)

## 🚢 Déploiement

L'application utilise le HashRouter, ce qui facilite le déploiement sur des hébergements statiques:

- **Netlify/Vercel:** Déploiement direct depuis Git
- **GitHub Pages:** Compatible sans configuration serveur
- **Build:** `npm run build` génère le dossier `dist/`

## 📝 Notes de développement

- Les erreurs `@tailwind` dans `index.css` sont normales - elles sont traitées par PostCSS
- Les erreurs TypeScript avant `npm install` sont attendues
- Les données sont stockées en mémoire (client-side uniquement)
- Pour la production, envisagez un backend pour la persistance

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amelioration`)
3. Commit (`git commit -m 'Ajout fonctionnalité'`)
4. Push (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

## 📄 Licence

Projet privé - Tous droits réservés
