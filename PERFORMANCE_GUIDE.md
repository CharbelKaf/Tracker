# ⚡ Guide d'Optimisation Performance - Neemba Tracker

Ce guide détaille toutes les techniques d'optimisation de performance implémentées et recommandées pour le projet.

## 📊 Table des matières

1. [React Performance](#react-performance)
2. [Code Splitting & Lazy Loading](#code-splitting--lazy-loading)
3. [Mémoïsation](#mémoïsation)
4. [Virtualisation des listes](#virtualisation-des-listes)
5. [Optimisations réseau](#optimisations-réseau)
6. [Bundle Optimization](#bundle-optimization)
7. [Monitoring Performance](#monitoring-performance)

---

## 🎯 React Performance

### 1. React.memo pour composants purs

Utilisez `React.memo` pour éviter les re-renders inutiles :

```tsx
import { memo } from 'react';

// ❌ Avant - Re-render à chaque fois que le parent re-render
const EquipmentCard = ({ equipment }) => {
  return <div>{equipment.name}</div>;
};

// ✅ Après - Re-render seulement si props changent
const EquipmentCard = memo(({ equipment }) => {
  return <div>{equipment.name}</div>;
});

// Avec comparaison personnalisée
const EquipmentCard = memo(
  ({ equipment }) => <div>{equipment.name}</div>,
  (prevProps, nextProps) => prevProps.equipment.id === nextProps.equipment.id
);
```

### 2. useMemo pour calculs coûteux

```tsx
import { useMemo } from 'react';

function InventoryList({ equipment, filters }) {
  // ❌ Avant - Filtre à chaque render
  const filteredEquipment = equipment.filter(item => 
    item.status === filters.status
  );

  // ✅ Après - Filtre seulement si equipment ou filters changent
  const filteredEquipment = useMemo(
    () => equipment.filter(item => item.status === filters.status),
    [equipment, filters.status]
  );

  return <List items={filteredEquipment} />;
}
```

### 3. useCallback pour fonctions stables

```tsx
import { useCallback } from 'react';

function ParentComponent() {
  // ❌ Avant - Nouvelle fonction à chaque render
  const handleClick = (id) => {
    console.log('Clicked:', id);
  };

  // ✅ Après - Fonction stable entre renders
  const handleClick = useCallback((id) => {
    console.log('Clicked:', id);
  }, []); // Dépendances vides = fonction stable

  return <MemoizedChild onClick={handleClick} />;
}
```

---

## 📦 Code Splitting & Lazy Loading

### 1. Lazy Loading des routes

```tsx
import { lazy, Suspense } from 'react';
import { lazyWithPreload } from './utils/performance';

// ❌ Avant - Tout chargé au démarrage
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Users from './components/Users';

// ✅ Après - Chargé à la demande
const Dashboard = lazy(() => import('./components/Dashboard'));
const Inventory = lazyWithPreload(() => import('./components/Inventory'));
const Users = lazy(() => import('./components/Users'));

function App() {
  return (
    <Suspense fallback={<LoadingOverlay isLoading={true} />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/users" element={<Users />} />
      </Routes>
    </Suspense>
  );
}
```

### 2. Preload au hover

```tsx
import { lazyWithPreload } from './utils/performance';

const Inventory = lazyWithPreload(() => import('./components/Inventory'));

function Navigation() {
  return (
    <nav>
      <Link 
        to="/inventory"
        onMouseEnter={() => Inventory.preload()} // Preload au survol
      >
        Inventaire
      </Link>
    </nav>
  );
}
```

### 3. Dynamic imports pour fonctionnalités lourdes

```tsx
// Charger une bibliothèque lourde seulement quand nécessaire
async function exportToPDF() {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  // ...
}

// Charger un composant complexe à la demande
async function openChartModal() {
  const { default: ChartModal } = await import('./ChartModal');
  // Afficher le modal
}
```

---

## 🧠 Mémoïsation

### 1. Mémoïsation de listes filtrées

```tsx
import { useMemo } from 'react';
import { useDebounce } from './hooks/useDebounce';

function SearchableList({ items }) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [items, debouncedSearch]);

  return (
    <>
      <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      <List items={filteredItems} />
    </>
  );
}
```

### 2. Mémoïsation de transformations de données

```tsx
const processedData = useMemo(() => {
  return equipment.map(item => ({
    ...item,
    displayName: `${item.model?.name} - ${item.assetTag}`,
    isWarrantyExpiring: isWarrantyExpiringSoon(item.warrantyEndDate),
    assignedUserName: users.find(u => u.id === item.assignedTo)?.name,
  }));
}, [equipment, users]);
```

### 3. Comparaison personnalisée

```tsx
import { shallowEqual, deepEqual } from './utils/performance';

// Shallow comparison (rapide)
const MemoizedComponent = memo(
  Component,
  (prev, next) => shallowEqual(prev, next)
);

// Deep comparison (si nécessaire)
const DeepMemoizedComponent = memo(
  Component,
  (prev, next) => deepEqual(prev.data, next.data)
);
```

---

## 📜 Virtualisation des listes

### 1. Virtual scrolling pour longues listes

Le projet utilise déjà la virtualisation dans `Inventory.tsx` :

```tsx
const ITEM_HEIGHT = 100;
const OVERSCAN_COUNT = 3;

function VirtualizedList({ items }) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const { startIndex, endIndex, offsetY } = useMemo(() => {
    return calculateVisibleRange(
      scrollTop,
      containerHeight,
      ITEM_HEIGHT,
      items.length,
      OVERSCAN_COUNT
    );
  }, [scrollTop, containerHeight, items.length]);

  const visibleItems = items.slice(startIndex, endIndex);

  return (
    <div 
      style={{ height: '100%', overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * ITEM_HEIGHT, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(item => (
            <Item key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 2. Pagination côté client

Pour listes de taille moyenne (< 1000 items) :

```tsx
const ITEMS_PER_PAGE = 50;

function PaginatedList({ items }) {
  const [page, setPage] = useState(0);

  const paginatedItems = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, page]);

  return (
    <>
      <List items={paginatedItems} />
      <Pagination 
        page={page} 
        total={Math.ceil(items.length / ITEMS_PER_PAGE)}
        onChange={setPage}
      />
    </>
  );
}
```

---

## 🌐 Optimisations réseau

### 1. Debounce des requêtes de recherche

**Déjà implémenté** dans `Inventory.tsx` :

```tsx
import { useDebounce } from './hooks/useDebounce';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearch) {
    fetchResults(debouncedSearch);
  }
}, [debouncedSearch]);
```

### 2. Cache des requêtes

```tsx
const queryCache = new Map();

async function fetchWithCache(url: string) {
  if (queryCache.has(url)) {
    return queryCache.get(url);
  }

  const response = await fetch(url);
  const data = await response.json();
  
  queryCache.set(url, data);
  
  // Expiration après 5 minutes
  setTimeout(() => queryCache.delete(url), 5 * 60 * 1000);
  
  return data;
}
```

### 3. Prefetch des données

```tsx
// Prefetch au hover
function EquipmentCard({ equipment }) {
  const prefetchDetails = useCallback(() => {
    // Charger les détails avant le clic
    fetch(`/api/equipment/${equipment.id}`);
  }, [equipment.id]);

  return (
    <div onMouseEnter={prefetchDetails}>
      <Link to={`/equipment/${equipment.id}`}>
        {equipment.name}
      </Link>
    </div>
  );
}
```

---

## 📦 Bundle Optimization

### 1. Analyser le bundle

```bash
# Installer l'analyseur
npm install --save-dev rollup-plugin-visualizer

# Ajouter au vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true })
  ]
});

# Build et ouvrir le rapport
npm run build
```

### 2. Tree-shaking optimal

```tsx
// ❌ Mauvais - Importe tout lodash
import _ from 'lodash';
const result = _.debounce(fn, 300);

// ✅ Bon - Import nommé (tree-shakeable)
import { debounce } from 'lodash-es';
const result = debounce(fn, 300);

// ✅ Encore mieux - Import direct
import debounce from 'lodash-es/debounce';
```

### 3. Code splitting dynamique

```tsx
// Grouper les imports par route
const inventoryRoutes = {
  list: () => import('./routes/InventoryList'),
  details: () => import('./routes/InventoryDetails'),
  edit: () => import('./routes/InventoryEdit'),
};
```

---

## 📊 Monitoring Performance

### 1. Performance Monitor (déjà disponible)

```tsx
import { performanceMonitor, withPerformanceMonitor } from './utils/performance';

// HOC pour monitorer un composant
const MonitoredDashboard = withPerformanceMonitor(Dashboard, 'Dashboard');

// Utilisation manuelle
function MyComponent() {
  const endMeasure = performanceMonitor.start('MyComponent');
  
  useEffect(() => {
    return endMeasure;
  });
  
  return <div>Content</div>;
}

// Voir le rapport
performanceMonitor.logReport();
```

### 2. React DevTools Profiler

```tsx
import { Profiler } from 'react';

function App() {
  const onRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
  ) => {
    console.log(`${id} (${phase}) took ${actualDuration}ms`);
  };

  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <YourApp />
    </Profiler>
  );
}
```

### 3. Web Vitals

```tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  console.log(metric);
  // Envoyer à votre service d'analytics
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

---

## ✅ Checklist d'optimisation

### Pour chaque composant

- [ ] Utilise `React.memo` si pur
- [ ] Utilise `useMemo` pour calculs coûteux
- [ ] Utilise `useCallback` pour fonctions passées aux enfants
- [ ] Pas de création d'objets/arrays dans le render
- [ ] Pas d'inline functions dans les props des composants mémoïsés

### Pour les listes

- [ ] Virtualisation si > 100 items
- [ ] Pagination si 50-500 items
- [ ] Keys stables et uniques
- [ ] Debounce sur les filtres
- [ ] Mémoïsation des items filtrés

### Pour le bundle

- [ ] Code splitting des routes
- [ ] Lazy loading des composants lourds
- [ ] Tree-shaking optimal (imports nommés)
- [ ] Bundle size < 500KB (gzippé)
- [ ] Pas de dépendances inutilisées

### Pour le réseau

- [ ] Debounce des requêtes de recherche
- [ ] Cache des données fréquentes
- [ ] Prefetch des routes probables
- [ ] Compression gzip/brotli activée
- [ ] CDN pour les assets statiques

---

## 🎯 Objectifs de performance

| Métrique | Cible | Actuel |
|----------|-------|--------|
| **First Contentful Paint** | < 1.8s | À mesurer |
| **Largest Contentful Paint** | < 2.5s | À mesurer |
| **Time to Interactive** | < 3.5s | À mesurer |
| **Cumulative Layout Shift** | < 0.1 | À mesurer |
| **First Input Delay** | < 100ms | À mesurer |
| **Bundle size (gzipped)** | < 500KB | À mesurer |

---

## 🔧 Outils recommandés

### Développement

- **React DevTools** - Profiler pour identifier les re-renders
- **Chrome DevTools** - Performance tab, Lighthouse
- **Vite** - Build ultrarapide avec HMR

### Production

- **Lighthouse CI** - Tests de performance automatisés
- **web-vitals** - Métriques Core Web Vitals
- **Bundle analyzer** - Analyser la taille du bundle
- **Sentry** - Monitoring des performances réelles

---

## 📚 Ressources

- [React Performance](https://react.dev/learn/render-and-commit)
- [useMemo vs useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)
- [Code Splitting](https://react.dev/reference/react/lazy)
- [Web Vitals](https://web.dev/vitals/)
- [Vite Performance](https://vitejs.dev/guide/performance.html)

---

**Note** : Les optimisations prématurées peuvent nuire à la lisibilité du code. Profilez d'abord, optimisez ensuite.
