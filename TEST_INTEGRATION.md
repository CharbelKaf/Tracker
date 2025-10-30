# 🧪 Test d'intégration Backend ↔ Frontend

## ✅ État actuel

**Backend:** ✅ Tourne sur `http://localhost:4000`  
**Frontend:** ⏳ À lancer

---

## 📋 Checklist de test

### 1. ✅ Backend (déjà lancé)

Le backend tourne dans le terminal server. Vous devriez voir:
```
✅ Environment configuration loaded
🚀 Server running on port 4000
📝 Environment: development
🔒 Security: Enabled
⚡ Rate limiting: Enabled
```

**Test rapide backend:**

Ouvrir dans le navigateur: `http://localhost:4000/health`

Devrait afficher:
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": 123,
  "environment": "development"
}
```

---

### 2. ⏳ Lancer le Frontend

**Dans un NOUVEAU terminal (à la racine):**

```bash
npm run dev
```

Le frontend devrait démarrer sur `http://localhost:3000`

---

### 3. 🔐 Test Login

#### A. Accéder à la page de login

Ouvrir: `http://localhost:3000/login`

Vous devriez voir:
- ✅ Formulaire de connexion stylisé
- ✅ Logo "N" en haut
- ✅ Champs Email et Password
- ✅ Credentials de test affichés

#### B. Se connecter

**Credentials:**
- Email: `admin@neemba.com`
- Password: `password123`

**Cliquer "Se connecter"**

**Résultat attendu:**
- ✅ Requête POST vers `http://localhost:4000/api/auth/login`
- ✅ Réponse avec `accessToken` et `user`
- ✅ Redirection vers `/dashboard`
- ✅ Token stocké dans localStorage

#### C. Vérifier dans DevTools

**Ouvrir DevTools (F12) > Console:**

Vous devriez voir:
```
POST http://localhost:4000/api/auth/login 200 OK
```

**DevTools > Application > Local Storage:**
```
accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
user: {"id":"...","email":"admin@neemba.com","name":"Admin User","role":"admin"}
```

**DevTools > Application > Cookies:**
```
refreshToken: (HttpOnly cookie)
```

---

### 4. 📡 Test API Calls

#### A. Dans la console du navigateur

```javascript
// Test 1: Get current user
fetch('http://localhost:4000/api/auth/me', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
  }
})
.then(r => r.json())
.then(console.log);

// Devrait retourner:
// { id: "...", email: "admin@neemba.com", name: "Admin User", role: "admin" }
```

```javascript
// Test 2: Get equipment
fetch('http://localhost:4000/api/equipment?page=1&limit=10', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
  }
})
.then(r => r.json())
.then(console.log);

// Devrait retourner:
// { data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }
```

#### B. Test avec le service API

Dans la console:

```javascript
// Import du service (si disponible)
import { api } from './services/api';

// Test login
await api.login('admin@neemba.com', 'password123');

// Test get equipment
const equipment = await api.getEquipment({ page: 1, limit: 10 });
console.log(equipment);
```

---

### 5. 🔒 Test Routes Protégées

#### A. Test sans authentification

1. Supprimer le token: `localStorage.clear()`
2. Essayer d'accéder à `/dashboard`
3. **Résultat attendu:** Redirection vers `/login`

#### B. Test avec authentification

1. Se reconnecter
2. Accéder à `/dashboard`
3. **Résultat attendu:** Page dashboard affichée

#### C. Test rôle admin

1. Connecté en tant qu'admin
2. Accéder à `/users` (si route existe)
3. **Résultat attendu:** Accès autorisé

---

### 6. 🔄 Test Refresh Token

#### A. Attendre expiration du token (15 min)

Ou forcer l'expiration en modifiant le token dans localStorage.

#### B. Faire une requête API

**Résultat attendu:**
- ✅ Détection du token expiré (401)
- ✅ Appel automatique à `/api/auth/refresh`
- ✅ Nouveau token obtenu
- ✅ Requête originale rejouée

---

### 7. 🚪 Test Logout

#### A. Cliquer sur logout (si bouton existe)

Ou dans la console:
```javascript
await api.logout();
```

**Résultat attendu:**
- ✅ Requête POST vers `/api/auth/logout`
- ✅ Token supprimé de localStorage
- ✅ Cookie refreshToken supprimé
- ✅ Redirection vers `/login`

---

## 🐛 Troubleshooting

### Erreur CORS

**Symptôme:** `Access-Control-Allow-Origin` error

**Solution:**
1. Vérifier que backend tourne sur port 4000
2. Vérifier `.env` backend: `CORS_ORIGIN=http://localhost:3000`
3. Redémarrer le backend

### Erreur 404 sur API

**Symptôme:** `404 Not Found` sur `/api/...`

**Solution:**
1. Vérifier URL dans `.env` frontend: `VITE_API_URL=http://localhost:4000/api`
2. Vérifier que backend tourne
3. Tester health check: `http://localhost:4000/health`

### Token non envoyé

**Symptôme:** `401 Unauthorized`

**Solution:**
1. Vérifier localStorage contient `accessToken`
2. Vérifier header Authorization dans DevTools > Network
3. Se reconnecter

### Login ne fonctionne pas

**Symptôme:** Erreur au login

**Solutions:**
1. Vérifier credentials: `admin@neemba.com` / `password123`
2. Vérifier backend logs pour erreurs
3. Vérifier DevTools > Network pour la requête

---

## ✅ Checklist finale

- [ ] Backend tourne sur port 4000
- [ ] Frontend tourne sur port 3000
- [ ] Health check backend fonctionne
- [ ] Page login s'affiche
- [ ] Login avec credentials test réussit
- [ ] Token stocké dans localStorage
- [ ] Refresh token dans cookies
- [ ] Appels API avec token fonctionnent
- [ ] Routes protégées redirigent si non auth
- [ ] Logout fonctionne

---

## 📊 Résultats attendus

### Network (DevTools)

```
POST /api/auth/login          200 OK
GET  /api/auth/me             200 OK
GET  /api/equipment           200 OK
POST /api/auth/logout         200 OK
POST /api/auth/refresh        200 OK
```

### Console

```
✅ Login successful
✅ User loaded
✅ Equipment loaded
✅ Logout successful
```

### LocalStorage

```
accessToken: "eyJ..."
user: "{...}"
```

---

## 🎉 Si tous les tests passent

**Félicitations !** L'intégration backend ↔ frontend fonctionne parfaitement !

**Prochaines étapes:**
1. Créer les pages manquantes (Dashboard, Equipment, Users)
2. Intégrer les appels API dans les composants
3. Ajouter le monitoring (Phase 5)
4. Déployer en production

---

## 📝 Notes

- Les erreurs 401 sont normales si le token expire
- Le refresh automatique devrait gérer les expirations
- Les logs backend montrent toutes les requêtes
- Utilisez DevTools > Network pour débugger

**Bon test ! 🚀**
