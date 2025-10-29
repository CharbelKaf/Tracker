# Liquid Glass Design System - Neemba Tracker

## 🌈 Palette de couleurs translucides

### Couleurs primaires (mode clair)
```css
--glass-primary-50: rgba(255, 255, 255, 0.95);   /* Ultra-light glass */
--glass-primary-100: rgba(255, 255, 255, 0.85);  /* Light glass */
--glass-primary-200: rgba(255, 255, 255, 0.75);  /* Medium glass */
--glass-primary-300: rgba(255, 255, 255, 0.60);  /* Heavy glass */

--glass-tint-blue: rgba(59, 130, 246, 0.15);     /* Blue tint */
--glass-tint-purple: rgba(139, 92, 246, 0.12);   /* Purple tint */
--glass-tint-amber: rgba(251, 191, 36, 0.12);    /* Amber tint */
--glass-tint-rose: rgba(244, 63, 94, 0.10);      /* Rose tint */
```

### Couleurs primaires (mode sombre)
```css
--glass-dark-50: rgba(15, 23, 42, 0.95);         /* Ultra-dark glass */
--glass-dark-100: rgba(15, 23, 42, 0.85);        /* Dark glass */
--glass-dark-200: rgba(30, 41, 59, 0.80);        /* Medium dark glass */
--glass-dark-300: rgba(51, 65, 85, 0.70);        /* Light dark glass */

--glass-dark-tint-cyan: rgba(34, 211, 238, 0.15);
--glass-dark-tint-violet: rgba(167, 139, 250, 0.15);
--glass-dark-tint-yellow: rgba(253, 224, 71, 0.12);
```

### Effets de lumière
```css
--glow-soft: 0 0 20px rgba(255, 255, 255, 0.1);
--glow-medium: 0 0 30px rgba(255, 255, 255, 0.15);
--glow-strong: 0 0 40px rgba(59, 130, 246, 0.25);

--shimmer-gradient: linear-gradient(
  135deg,
  rgba(255, 255, 255, 0) 0%,
  rgba(255, 255, 255, 0.1) 50%,
  rgba(255, 255, 255, 0) 100%
);
```

## 🔮 Niveaux de profondeur (Glass Layers)

### Layer 0 - Background ambiant
- Fond dégradé subtil avec noise texture
- Pas de blur
- Éclairage directionnel doux

### Layer 1 - Elevated glass (cards, modals)
```css
backdrop-filter: blur(20px) saturate(180%);
background: linear-gradient(
  135deg,
  rgba(255, 255, 255, 0.1),
  rgba(255, 255, 255, 0.05)
);
border: 1px solid rgba(255, 255, 255, 0.18);
box-shadow: 
  0 8px 32px 0 rgba(0, 0, 0, 0.1),
  inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
```

### Layer 2 - Ultra-elevated glass (tooltips, popovers)
```css
backdrop-filter: blur(30px) saturate(200%);
background: linear-gradient(
  135deg,
  rgba(255, 255, 255, 0.15),
  rgba(255, 255, 255, 0.08)
);
border: 1px solid rgba(255, 255, 255, 0.25);
box-shadow: 
  0 12px 48px 0 rgba(0, 0, 0, 0.15),
  inset 0 1px 0 0 rgba(255, 255, 255, 0.3),
  0 0 0 1px rgba(255, 255, 255, 0.1) inset;
```

## ✨ Effets spéciaux

### Reflet lumineux (top highlight)
```css
.glass-highlight::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3) 50%,
    transparent
  );
}
```

### Shimmer hover effect
```css
.glass-shimmer {
  position: relative;
  overflow: hidden;
}

.glass-shimmer::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    to bottom right,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: rotate(45deg) translateX(-100%);
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-shimmer:hover::after {
  transform: rotate(45deg) translateX(100%);
}
```

## 🎭 Typographie

### Poids et tailles
```css
--font-display: 'SF Pro Display', -apple-system, sans-serif;
--font-text: 'SF Pro Text', -apple-system, sans-serif;

/* Sizes */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */

/* Line heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* Letter spacing */
--tracking-tight: -0.02em;
--tracking-normal: 0;
--tracking-wide: 0.02em;
```

### Hiérarchie textuelle avec effet de verre
```css
.heading-glass {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9),
    rgba(255, 255, 255, 0.6)
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
```

## 🌊 Animations fluides

### Courbes de timing personnalisées
```css
--ease-fluid: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);
--ease-swift: cubic-bezier(0.55, 0, 0.1, 1);
```

### Durées standard
```css
--duration-instant: 100ms;
--duration-fast: 200ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
--duration-slower: 700ms;
```

### Animations de base
```css
@keyframes fadeInGlass {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(20px);
    transform: translateY(0);
  }
}

@keyframes floatGlass {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.1);
  }
  50% {
    box-shadow: 0 0 40px rgba(59, 130, 246, 0.25);
  }
}
```

## 🎯 Composants de base

### Button Glass
```css
.btn-glass {
  position: relative;
  padding: 0.75rem 1.5rem;
  border-radius: 1rem;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.05)
  );
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all var(--duration-normal) var(--ease-fluid);
}

.btn-glass:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.btn-glass:active {
  transform: translateY(0);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
```

### Card Glass
```css
.card-glass {
  position: relative;
  padding: 1.5rem;
  border-radius: 1.5rem;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.05)
  );
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  overflow: hidden;
  transition: all var(--duration-normal) var(--ease-fluid);
}

.card-glass::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3) 50%,
    transparent
  );
}

.card-glass:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 12px 48px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
```

### Input Glass
```css
.input-glass {
  padding: 0.875rem 1rem;
  border-radius: 0.875rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  color: rgba(255, 255, 255, 0.9);
  transition: all var(--duration-normal) var(--ease-fluid);
}

.input-glass:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(59, 130, 246, 0.4);
  box-shadow: 
    0 0 0 3px rgba(59, 130, 246, 0.1),
    0 4px 16px rgba(59, 130, 246, 0.15);
}

.input-glass::placeholder {
  color: rgba(255, 255, 255, 0.4);
}
```

## 📱 Responsive Design

### Breakpoints
```css
--screen-sm: 640px;
--screen-md: 768px;
--screen-lg: 1024px;
--screen-xl: 1280px;
--screen-2xl: 1536px;
```

### Adaptations mobile
- Sur mobile : `backdrop-filter: blur(15px)` (performance)
- Sur desktop : `backdrop-filter: blur(25px)` (qualité)
- Transitions plus rapides sur mobile : `--duration-fast`
- Effets de hover désactivés sur touch devices

## 🎨 Backgrounds ambiants

### Gradient mesh animé
```css
.ambient-background {
  position: fixed;
  inset: 0;
  z-index: -1;
  background: 
    radial-gradient(
      ellipse at 20% 30%,
      rgba(59, 130, 246, 0.15) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse at 80% 70%,
      rgba(139, 92, 246, 0.12) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse at 50% 50%,
      rgba(251, 191, 36, 0.08) 0%,
      transparent 50%
    ),
    linear-gradient(
      to bottom,
      #f8fafc 0%,
      #e2e8f0 100%
    );
  animation: ambientFlow 20s ease-in-out infinite;
}

@keyframes ambientFlow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}
```

### Noise texture (subtle grain)
```css
.noise-texture {
  position: absolute;
  inset: 0;
  opacity: 0.03;
  background-image: url('data:image/svg+xml;base64,...'); /* SVG noise pattern */
  pointer-events: none;
}
```
