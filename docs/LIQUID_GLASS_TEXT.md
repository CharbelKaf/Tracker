# 🎨 Guide de lisibilité du texte sur Liquid Glass

## Vue d'ensemble

Ce guide explique comment améliorer la lisibilité du texte sur les interfaces liquid glass (glassmorphism) en utilisant les classes CSS personnalisées.

## 🎯 Problème

Sur les fonds liquid glass avec `backdrop-blur` et transparence, le texte peut être difficile à lire, surtout :
- Sur des images de fond complexes
- En mode sombre
- Avec des couleurs de texte claires
- Sur des surfaces très transparentes

## ✨ Solutions disponibles

### 1. Classes de text-shadow

#### `.text-glass-enhanced`
Ombre portée légère + poids de police renforcé
```tsx
<p className="text-glass-enhanced">
  Texte avec lisibilité améliorée
</p>
```
**Utilisation** : Texte principal sur liquid glass

#### `.text-glass-strong`
Ombre portée forte pour contraste maximum
```tsx
<h2 className="text-glass-strong">
  Titre très lisible
</h2>
```
**Utilisation** : Titres importants, texte sur images

#### `.text-glass-subtle`
Ombre portée très légère
```tsx
<span className="text-glass-subtle">
  Texte secondaire
</span>
```
**Utilisation** : Labels, texte secondaire

### 2. Classes de fond semi-opaque

#### `.text-backdrop`
Fond blanc semi-transparent avec blur
```tsx
<span className="text-backdrop">
  Texte avec fond
</span>
```
**Utilisation** : Texte sur images, badges

#### `.text-backdrop-dark`
Fond noir semi-transparent avec blur
```tsx
<span className="text-backdrop-dark">
  Texte avec fond sombre
</span>
```
**Utilisation** : Texte clair sur fond clair

### 3. Classes spécialisées

#### `.heading-glass`
Pour les titres sur liquid glass
```tsx
<h1 className="heading-glass">
  Titre principal
</h1>
```
**Caractéristiques** :
- Ombre portée double
- Font-weight: 700
- Letter-spacing optimisé

#### `.label-glass`
Pour les labels et badges
```tsx
<span className="label-glass">
  Label
</span>
```
**Caractéristiques** :
- Fond semi-opaque
- Padding intégré
- Border-radius
- Display: inline-block

## 📋 Exemples d'utilisation

### Exemple 1 : Modal avec liquid glass

```tsx
<Modal isOpen={true} onClose={handleClose}>
  <div className="space-y-4">
    {/* Titre principal */}
    <h2 className="heading-glass text-white text-2xl">
      Modifier le code PIN
    </h2>
    
    {/* Description */}
    <p className="text-glass-enhanced text-gray-100">
      Définissez un nouveau code PIN à 6 chiffres
    </p>
    
    {/* Label de champ */}
    <label className="text-glass-strong text-white">
      Nouveau PIN
    </label>
    
    {/* Texte d'aide */}
    <p className="text-glass-subtle text-gray-300 text-sm">
      Utilisez uniquement des chiffres
    </p>
  </div>
</Modal>
```

### Exemple 2 : Card avec image de fond

```tsx
<div className="relative rounded-xl overflow-hidden">
  {/* Image de fond */}
  <img src="background.jpg" className="absolute inset-0 w-full h-full object-cover" />
  
  {/* Overlay liquid glass */}
  <div className="relative surface-card surface-card-gradient p-6">
    {/* Titre avec fond */}
    <h3 className="text-backdrop text-white text-xl font-bold mb-2">
      Équipement #12346
    </h3>
    
    {/* Statut avec label-glass */}
    <span className="label-glass text-white">
      En attente
    </span>
    
    {/* Description */}
    <p className="text-glass-enhanced text-white mt-4">
      Dell Latitude 7420
    </p>
  </div>
</div>
```

### Exemple 3 : Validation screen

```tsx
<div className="surface-card surface-card-gradient p-6">
  {/* En-tête */}
  <h2 className="heading-glass text-white text-2xl mb-4">
    Valider en tant que Responsable
  </h2>
  
  {/* Informations */}
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <span className="label-glass text-white text-sm">
        MONITEUR
      </span>
      <span className="text-glass-enhanced text-white">
        Dell U2723DE
      </span>
    </div>
    
    <div className="flex items-center gap-2">
      <span className="label-glass text-white text-sm">
        STATUT
      </span>
      <span className="text-glass-strong text-yellow-300">
        En attente de validation
      </span>
    </div>
  </div>
  
  {/* Instructions */}
  <p className="text-glass-subtle text-gray-200 text-sm mt-4">
    Confirmez l'attribution ou la restitution en tant que responsable.
  </p>
</div>
```

## 🎨 Combinaisons recommandées

### Sur fond clair (light mode)
```tsx
<div className="bg-white/90 backdrop-blur-lg">
  <h2 className="text-glass-strong text-gray-900">Titre</h2>
  <p className="text-glass-enhanced text-gray-800">Texte principal</p>
  <span className="text-glass-subtle text-gray-600">Texte secondaire</span>
</div>
```

### Sur fond sombre (dark mode)
```tsx
<div className="bg-gray-900/90 backdrop-blur-lg">
  <h2 className="text-glass-strong text-white">Titre</h2>
  <p className="text-glass-enhanced text-gray-100">Texte principal</p>
  <span className="text-glass-subtle text-gray-300">Texte secondaire</span>
</div>
```

### Sur image de fond
```tsx
<div className="relative">
  <img src="bg.jpg" className="absolute inset-0" />
  <div className="relative backdrop-blur-md bg-black/30 p-6">
    <h2 className="text-backdrop text-white heading-glass">Titre</h2>
    <p className="text-glass-strong text-white">Texte important</p>
  </div>
</div>
```

## 📊 Tableau de décision

| Contexte | Classe recommandée | Couleur de texte |
|----------|-------------------|------------------|
| Titre principal sur glass | `.heading-glass` | `text-white` |
| Titre sur image | `.text-backdrop` + `.heading-glass` | `text-white` |
| Texte principal | `.text-glass-enhanced` | `text-gray-900` / `text-gray-100` |
| Texte important | `.text-glass-strong` | `text-white` / `text-gray-900` |
| Label / Badge | `.label-glass` | `text-white` |
| Texte secondaire | `.text-glass-subtle` | `text-gray-600` / `text-gray-300` |
| Texte sur fond complexe | `.text-backdrop-dark` | `text-white` |

## 🔧 Personnalisation

### Modifier l'intensité de l'ombre

Dans `index.css` :

```css
.text-glass-enhanced {
  /* Augmenter l'ombre */
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.25), 0 3px 6px rgba(0, 0, 0, 0.15);
  font-weight: 600;
}
```

### Créer une variante custom

```css
.text-glass-custom {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  font-weight: 500;
  letter-spacing: 0.01em;
}
```

## ✅ Bonnes pratiques

### 1. Hiérarchie visuelle
```tsx
{/* ✅ Bon : Hiérarchie claire */}
<div>
  <h1 className="heading-glass text-white text-3xl">Titre</h1>
  <p className="text-glass-enhanced text-gray-100 text-lg">Sous-titre</p>
  <span className="text-glass-subtle text-gray-300 text-sm">Détails</span>
</div>

{/* ❌ Mauvais : Tout au même niveau */}
<div>
  <h1 className="text-white text-3xl">Titre</h1>
  <p className="text-gray-100 text-lg">Sous-titre</p>
  <span className="text-gray-300 text-sm">Détails</span>
</div>
```

### 2. Contraste suffisant
```tsx
{/* ✅ Bon : Contraste élevé */}
<div className="bg-gray-900/80 backdrop-blur-lg">
  <p className="text-glass-strong text-white">Texte lisible</p>
</div>

{/* ❌ Mauvais : Contraste faible */}
<div className="bg-gray-900/80 backdrop-blur-lg">
  <p className="text-gray-400">Texte peu lisible</p>
</div>
```

### 3. Adapter au contexte
```tsx
{/* ✅ Bon : Adapté au fond */}
<div className="surface-card-gradient">
  <h2 className="heading-glass text-white">Titre</h2>
</div>

{/* ❌ Mauvais : Pas adapté */}
<div className="surface-card-gradient">
  <h2 className="text-gray-900">Titre</h2> {/* Invisible sur fond sombre */}
</div>
```

### 4. Utiliser les labels pour les badges
```tsx
{/* ✅ Bon : Label avec fond */}
<span className="label-glass text-white">
  En attente
</span>

{/* ❌ Mauvais : Texte seul */}
<span className="text-white">
  En attente
</span>
```

## 🎯 Checklist d'accessibilité

- [ ] Ratio de contraste ≥ 4.5:1 pour texte normal
- [ ] Ratio de contraste ≥ 3:1 pour texte large (18pt+)
- [ ] Ombres portées n'affectent pas la lisibilité
- [ ] Texte lisible en mode sombre ET clair
- [ ] Pas de dépendance uniquement à la couleur
- [ ] Font-weight suffisant (≥ 500)

## 🧪 Tests

### Test de lisibilité

1. **Sur fond clair** : Texte visible et net
2. **Sur fond sombre** : Texte visible et net
3. **Sur image** : Texte toujours lisible
4. **Zoom 200%** : Texte reste lisible
5. **Mode daltonien** : Contraste suffisant

### Outils de test

- Chrome DevTools : Lighthouse (Accessibility)
- Contrast Checker : WebAIM
- Test manuel : Lire à 2m de distance

## 📱 Responsive

Les classes s'adaptent automatiquement :

```tsx
<h1 className="heading-glass text-white text-xl md:text-2xl lg:text-3xl">
  Titre responsive
</h1>
```

## 🚀 Performance

Les text-shadows ont un impact minimal sur les performances :
- ✅ GPU-accelerated
- ✅ Pas de repaint coûteux
- ✅ Compatible avec animations

## 📚 Ressources

- [MDN: text-shadow](https://developer.mozilla.org/en-US/docs/Web/CSS/text-shadow)
- [WebAIM: Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Dernière mise à jour** : 30 octobre 2025
