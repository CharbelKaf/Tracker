# 🧪 Tests - Neemba Tracker

Ce dossier contient tous les tests unitaires, d'intégration et end-to-end pour le projet Neemba Tracker.

## 📁 Structure

```
tests/
├── setup.ts                      # Configuration globale des tests
├── unit/                         # Tests unitaires
│   ├── utils/                    # Tests des utilitaires
│   │   ├── errorTracking.test.ts
│   │   └── secureStorage.test.ts
│   ├── hooks/                    # Tests des hooks React
│   │   ├── useDebounce.test.ts
│   │   └── useDebouncedCallback.test.ts
│   └── components/               # Tests des composants
│       └── ErrorBoundary.test.tsx
├── integration/                  # Tests d'intégration (à venir)
└── e2e/                         # Tests end-to-end (à venir)
```

## 🚀 Installation

Installez les dépendances de test :

```bash
npm install
```

Les packages suivants seront installés :
- `vitest` - Framework de test rapide
- `@testing-library/react` - Utilitaires pour tester React
- `@testing-library/jest-dom` - Matchers personnalisés pour le DOM
- `@testing-library/user-event` - Simulation d'interactions utilisateur
- `happy-dom` - Implémentation DOM légère pour les tests
- `@vitest/ui` - Interface utilisateur pour visualiser les tests

## 🧪 Commandes de test

### Lancer tous les tests
```bash
npm test
```

### Lancer les tests en mode watch
```bash
npm test -- --watch
```

### Lancer les tests avec l'interface UI
```bash
npm run test:ui
```

### Lancer les tests une seule fois
```bash
npm run test:run
```

### Générer un rapport de couverture
```bash
npm run test:coverage
```

### Lancer des tests spécifiques
```bash
npm test errorTracking
npm test hooks
npm test components
```

## 📝 Écrire des tests

### Test d'un utilitaire

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { myUtilFunction } from '../../../utils/myUtil';

describe('myUtilFunction', () => {
  beforeEach(() => {
    // Setup avant chaque test
  });

  it('should do something', () => {
    const result = myUtilFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### Test d'un hook React

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from '../../../hooks/useMyHook';

describe('useMyHook', () => {
  it('should return expected value', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current).toBeDefined();
  });

  it('should update on action', () => {
    const { result } = renderHook(() => useMyHook());
    
    act(() => {
      result.current.doSomething();
    });

    expect(result.current.value).toBe('updated');
  });
});
```

### Test d'un composant React

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '../../../components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle click', () => {
    const onClick = vi.fn();
    render(<MyComponent onClick={onClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

## 🎯 Bonnes pratiques

### 1. Nommage des fichiers
- Utilisez `.test.ts` ou `.test.tsx` pour les fichiers de test
- Nommez les fichiers de test de la même manière que le fichier testé
- Exemple : `errorTracking.ts` → `errorTracking.test.ts`

### 2. Structure des tests
- Utilisez `describe` pour grouper les tests liés
- Utilisez `it` ou `test` pour les cas de test individuels
- Utilisez `beforeEach` et `afterEach` pour le setup/cleanup

### 3. Assertions
- Utilisez des assertions descriptives
- Testez un seul comportement par test
- Utilisez les matchers appropriés :
  - `toBe` pour les primitives
  - `toEqual` pour les objets/arrays
  - `toBeInTheDocument` pour les éléments DOM
  - `toHaveBeenCalled` pour les mocks

### 4. Mocking
- Moquez les dépendances externes
- Moquez localStorage, fetch, etc.
- Utilisez `vi.mock()` pour les modules
- Nettoyez les mocks dans `afterEach`

### 5. Tests asynchrones
- Utilisez `async/await` pour les tests async
- Utilisez `waitFor` pour attendre les changements
- Utilisez `vi.useFakeTimers()` pour contrôler le temps

## 📊 Couverture de code

### Objectifs de couverture
- **Utilitaires** : 100%
- **Hooks** : 90%
- **Composants critiques** : 80%
- **Composants UI** : 60%

### Voir le rapport de couverture
```bash
npm run test:coverage
```

Le rapport sera généré dans `coverage/index.html`

## 🐛 Débogage des tests

### Mode debug
```bash
npm test -- --run --reporter=verbose
```

### Logs dans les tests
```typescript
import { describe, it } from 'vitest';

it('should debug', () => {
  console.log('Debug info');
  console.table({ key: 'value' });
});
```

### Breakpoints
Si vous utilisez VS Code :
1. Ajoutez un breakpoint dans votre test
2. Lancez "Debug: JavaScript Debug Terminal"
3. Exécutez `npm test` dans le terminal

## 🔧 Configuration

La configuration de Vitest se trouve dans `vitest.config.ts`.

### Configuration actuelle
- **Environment** : happy-dom (DOM léger et rapide)
- **Coverage** : v8 provider
- **Globals** : Activé (pas besoin d'importer describe, it, etc.)
- **Setup** : `tests/setup.ts` exécuté avant tous les tests

### Personnalisation
Modifiez `vitest.config.ts` pour ajuster :
- Timeout des tests
- Reporters personnalisés
- Patterns de fichiers à tester
- Exclusions

## 📚 Ressources

- [Documentation Vitest](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Guide des matchers](https://vitest.dev/api/expect.html)
- [Testing React](https://react.dev/learn/testing)

## ✅ Checklist avant commit

- [ ] Tous les tests passent (`npm test`)
- [ ] Pas de tests en `.skip` ou `.only`
- [ ] Couverture maintenue ou améliorée
- [ ] Pas d'erreurs TypeScript
- [ ] Tests ajoutés pour les nouvelles features

## 🎓 Exemples de tests existants

Consultez ces fichiers pour des exemples :
- `tests/unit/utils/errorTracking.test.ts` - Tests d'utilitaires avec mocks
- `tests/unit/hooks/useDebounce.test.ts` - Tests de hooks avec timers
- `tests/unit/components/ErrorBoundary.test.tsx` - Tests de composants React

---

**Note** : Ce framework de test est conçu pour être rapide et simple. Vitest est 10x plus rapide que Jest et s'intègre parfaitement avec Vite.
