# 🔧 Fix - Icônes PWA en développement

## Problème résolu ✅

**Erreur:** `GET http://localhost:3000/icons/icon-144x144.png 404 (Not Found)`

**Cause:** Le `base: "/Tracker/"` dans vite.config.ts était appliqué en développement, causant des chemins incorrects pour les icônes.

## Corrections appliquées

### 1. vite.config.ts
```typescript
// AVANT
base: "/Tracker/",

// APRÈS
base: mode === 'production' ? "/Tracker/" : "/",
```

### 2. manifest.json
```json
// AVANT
"start_url": "/",
"scope": "/",

// APRÈS
"start_url": "./",
"scope": "./",
```

## Action requise

**Redémarrer le serveur dev:**

```bash
# Arrêter le serveur actuel (Ctrl+C)
# Puis relancer:
npm run dev
```

## Vérification

Après redémarrage:
1. Ouvrir `http://localhost:3000`
2. DevTools > Console - Plus d'erreurs 404
3. DevTools > Application > Manifest - Toutes les icônes chargées ✅
4. L'icône "Installer" devrait apparaître dans la barre d'adresse

## Explication

- **En développement:** `base: "/"` permet aux icônes d'être accessibles à `/icons/...`
- **En production:** `base: "/Tracker/"` pour GitHub Pages à `/Tracker/icons/...`
- **Chemins relatifs:** `./` dans manifest.json rend l'app compatible avec les deux environnements

## Test installation PWA

Une fois le serveur redémarré:
1. Chrome devrait détecter l'app comme installable
2. Icône "Installer" dans la barre d'URL
3. Cliquer pour installer
4. Vérifier le mode standalone

✅ **Problème résolu !**
