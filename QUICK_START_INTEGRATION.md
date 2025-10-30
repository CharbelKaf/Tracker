# 🚀 Quick Start - Intégration Backend

## ✅ Fichiers créés

- `services/api.ts` - Service API complet
- `hooks/useAuth.ts` - Hook d'authentification  
- `components/LoginForm.tsx` - Formulaire de login
- `components/ProtectedRoute.tsx` - Protection des routes
- `.env` - Variables d'environnement

## 🔧 Configuration

Le fichier `.env` a été créé. Vérifiez qu'il contient:

```env
VITE_API_URL=http://localhost:4000/api
```

## 📝 Prochaine étape: Modifier App.tsx

Ajoutez l'AuthProvider et les routes dans votre `App.tsx`:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { LoginForm } from './components/LoginForm';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                {/* Votre Dashboard */}
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

## 🧪 Test

1. **Backend doit tourner:**
   ```bash
   cd server
   npm run dev
   ```

2. **Frontend:**
   ```bash
   npm run dev
   ```

3. **Accéder:** `http://localhost:3000/login`

4. **Credentials de test:**
   - Email: `admin@neemba.com`
   - Password: `password123`

## 📡 Utiliser l'API dans vos composants

```tsx
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { user } = useAuth();
  
  const loadData = async () => {
    const equipment = await api.getEquipment({ page: 1, limit: 10 });
    console.log(equipment);
  };
  
  return <div>...</div>;
}
```

## 📚 Documentation complète

Voir `INTEGRATION_GUIDE.md` pour tous les détails.
