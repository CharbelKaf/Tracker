# 🔒 Phase 3 - Backend API - Guide d'utilisation

## 📦 Structure du projet

```
neemba-tracker/
├── server/                    # Backend API
│   ├── auth/                  # JWT & password utils
│   ├── config/                # Configuration
│   ├── middleware/            # Middleware Express
│   ├── routes/                # API routes
│   ├── schemas/               # Zod validation
│   ├── index.ts               # Entry point
│   ├── package.json           # Backend dependencies
│   └── .env.example           # Variables d'environnement
│
└── (frontend files...)        # Frontend React

```

---

## 🚀 Installation & Démarrage

### 1. Installer les dépendances backend

```bash
# Aller dans le dossier server
cd server

# Installer les dépendances
npm install --legacy-peer-deps
```

### 2. Configuration

```bash
# Copier .env.example vers .env
copy .env.example .env

# Éditer .env et changer les secrets JWT !
```

**⚠️ IMPORTANT**: En production, changer TOUTES les clés secrètes JWT !

### 3. Lancer le serveur backend

```bash
# En mode développement (avec hot reload)
npm run dev
```

Le backend sera disponible sur: `http://localhost:4000`

### 4. Lancer le frontend (dans un autre terminal)

```bash
# Retour à la racine
cd ..

# Lancer le frontend
npm run dev
```

Le frontend sera sur: `http://localhost:3000`

---

## 🔑 Configuration .env

```env
# Environment
NODE_ENV=development

# Server
PORT=4000

# JWT Secrets (CHANGER EN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars-long-change-in-production
JWT_REFRESH_EXPIRES_IN=7d
JWT_COOKIE_SECRET=your-super-secret-cookie-key-min-32-chars-long-change-in-production

# CORS (domaine frontend)
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=100        # 100 requêtes max
```

---

## 📡 Endpoints API

### 🔐 Authentication

**POST `/api/auth/login`**
- Body: `{ email, password }`
- Returns: `{ user, accessToken }`

**POST `/api/auth/register`**
- Body: `{ email, password, name, role, department }`
- Returns: `{ user, accessToken }`

**POST `/api/auth/refresh`**
- Cookie: `refreshToken`
- Returns: `{ accessToken }`

**POST `/api/auth/logout`**
- Header: `Authorization: Bearer <token>`
- Clears refresh token

**GET `/api/auth/me`**
- Header: `Authorization: Bearer <token>`
- Returns: Current user info

### 📦 Equipment

**GET `/api/equipment`**
- Query: `page, limit, category, status, search, sortBy, sortOrder`
- Returns: Paginated list

**GET `/api/equipment/:id`**
- Returns: Single equipment

**POST `/api/equipment`** (Auth required)
- Body: Equipment data
- Returns: Created equipment

**PUT `/api/equipment/:id`** (Auth required)
- Body: Updated fields
- Returns: Updated equipment

**DELETE `/api/equipment/:id`** (Admin only)
- Returns: 204 No Content

### 👥 Users

**GET `/api/users`** (Admin only)
- Query: `page, limit, role, status, department, search`
- Returns: Paginated list

**GET `/api/users/:id`** (Self or Admin)
- Returns: User info

**POST `/api/users`** (Admin only)
- Body: User data
- Returns: Created user

**PUT `/api/users/:id`** (Self or Admin)
- Body: Updated fields
- Returns: Updated user

**DELETE `/api/users/:id`** (Admin only)
- Returns: 204 No Content

### 📋 Assignments

**GET `/api/assignments`**
- Query: `page, limit, status, userId, equipmentId`
- Returns: Paginated list

**GET `/api/assignments/:id`**
- Returns: Single assignment

**POST `/api/assignments`** (Auth required)
- Body: Assignment data
- Returns: Created assignment

**PUT `/api/assignments/:id`** (Auth required)
- Body: Updated fields
- Returns: Updated assignment

**POST `/api/assignments/:id/return`** (Auth required)
- Marks assignment as returned
- Returns: Updated assignment

**DELETE `/api/assignments/:id`** (Admin only)
- Returns: 204 No Content

---

## 🔒 Sécurité implémentée

### Headers sécurisés (Helmet)
```
Content-Security-Policy
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security
```

### Rate Limiting (3 niveaux)
- **Général**: 100 req/15min
- **Auth**: 5 req/15min
- **API Key**: 30 req/min

### XSS Protection
- DOMPurify sanitization
- Input validation
- No script tags allowed

### Authentication
- JWT Access tokens (15 min)
- JWT Refresh tokens (7 jours)
- HttpOnly cookies
- Bcrypt (12 rounds)

### Authorization
- Role-based (admin, user, viewer)
- Route protection
- Self/Admin checks

### Validation
- Zod schemas
- Type-safe inputs
- SQL injection prevention

---

## 🧪 Test avec curl

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@neemba.com","password":"password123"}'
```

### Get equipment (avec token)
```bash
curl http://localhost:4000/api/equipment \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create equipment
```bash
curl -X POST http://localhost:4000/api/equipment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "MacBook Pro 14",
    "category": "laptop",
    "model": "M3 Pro",
    "status": "available"
  }'
```

---

## 🎯 Utilisateur par défaut

Pour tester, un utilisateur admin est pré-créé:

```
Email: admin@neemba.com
Password: password123
Role: admin
```

---

## 📝 Scripts disponibles

```bash
# Développement avec hot reload
npm run dev

# Build pour production
npm run build

# Démarrer en production
npm start

# Tests
npm test
```

---

## 🔗 Intégration Frontend

### 1. Créer un service API

```typescript
// services/api.ts
const API_URL = 'http://localhost:4000/api';

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Pour les cookies
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  // Equipment
  getEquipment: async (token: string, params?: any) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/equipment?${query}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return res.json();
  },

  // etc...
};
```

### 2. Utiliser dans un composant

```tsx
import { useState } from 'react';
import { api } from './services/api';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const data = await api.login(email, password);
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      // Redirect to dashboard
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  );
}
```

---

## ⚠️ Important

### En développement
- Backend: `http://localhost:4000`
- Frontend: `http://localhost:3000`
- CORS configuré pour accepter le frontend

### En production
- Changer TOUS les secrets JWT dans `.env`
- Configurer `CORS_ORIGIN` avec le domaine de production
- Utiliser HTTPS
- Configurer rate limiting approprié
- Mettre `NODE_ENV=production`

---

## 🐛 Troubleshooting

### Port déjà utilisé
```bash
# Changer PORT dans .env
PORT=5000
```

### CORS errors
```bash
# Vérifier CORS_ORIGIN dans .env
CORS_ORIGIN=http://localhost:3000
```

### JWT errors
```bash
# Vérifier que les secrets JWT sont configurés
# Et qu'ils font au moins 32 caractères
```

### Rate limiting trop strict
```bash
# Ajuster dans .env
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=200
```

---

## 📚 Documentation complète

Pour plus de détails, voir:
- `server/README.md` - Documentation API complète
- `server/.env.example` - Variables d'environnement
- `server/schemas/validation.ts` - Schémas de validation

---

**Backend sécurisé et production-ready ! 🔒**

