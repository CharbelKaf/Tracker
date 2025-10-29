# Liquid Glass - Animations & Transitions

## 🎭 Framer Motion Variants pour Liquid Glass

### 1. Page Transitions
```tsx
// Animation d'entrée de page
export const pageTransition = {
  initial: { 
    opacity: 0, 
    y: 20,
    backdropFilter: 'blur(0px)'
  },
  animate: { 
    opacity: 1, 
    y: 0,
    backdropFilter: 'blur(20px)',
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    backdropFilter: 'blur(0px)',
    transition: {
      duration: 0.3
    }
  }
};

// Utilisation
<motion.div
  variants={pageTransition}
  initial="initial"
  animate="animate"
  exit="exit"
>
  {/* Contenu de la page */}
</motion.div>
```

### 2. Stagger Children (Liste items)
```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  show: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 300
    }
  }
};

// Utilisation
<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="show"
>
  {items.map(item => (
    <motion.div key={item.id} variants={itemVariants}>
      <LiquidCard>{item.content}</LiquidCard>
    </motion.div>
  ))}
</motion.div>
```

### 3. Modal/Dialog Animations
```tsx
export const modalBackdrop = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.2
    }
  }
};

export const modalContent = {
  hidden: { 
    opacity: 0,
    scale: 0.9,
    y: 50,
    backdropFilter: 'blur(0px)'
  },
  visible: { 
    opacity: 1,
    scale: 1,
    y: 0,
    backdropFilter: 'blur(30px)',
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 50,
    backdropFilter: 'blur(0px)',
    transition: {
      duration: 0.2
    }
  }
};
```

### 4. Card Hover Effects
```tsx
export const cardHover = {
  rest: { 
    y: 0,
    scale: 1,
    boxShadow: 'var(--shadow-elev-1)'
  },
  hover: { 
    y: -6,
    scale: 1.02,
    boxShadow: 'var(--shadow-elev-2)',
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  tap: {
    scale: 0.98,
    y: 0
  }
};

// Utilisation
<motion.div
  variants={cardHover}
  initial="rest"
  whileHover="hover"
  whileTap="tap"
  className="glass-shimmer"
>
  {/* Card content */}
</motion.div>
```

### 5. Button Interactions
```tsx
export const buttonVariants = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.05,
    y: -2,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  tap: { 
    scale: 0.95,
    y: 0
  }
};

// Button avec effet de glow au hover
<motion.button
  variants={buttonVariants}
  initial="rest"
  whileHover="hover"
  whileTap="tap"
  className="relative"
  animate={{
    boxShadow: isHovered 
      ? 'var(--glow-blue)' 
      : 'var(--shadow-elev-1)'
  }}
>
  <span className="relative z-10">Click me</span>
</motion.button>
```

### 6. Float Animation (Subtle movement)
```tsx
export const floatVariants = {
  initial: { y: 0 },
  animate: {
    y: [-3, 3, -3],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

// Icône ou élément flottant
<motion.div
  variants={floatVariants}
  initial="initial"
  animate="animate"
>
  <span className="material-symbols-outlined">stars</span>
</motion.div>
```

### 7. Pulse Glow (Attention drawer)
```tsx
export const pulseGlow = {
  animate: {
    boxShadow: [
      '0 0 20px rgba(59, 130, 246, 0.1)',
      '0 0 40px rgba(59, 130, 246, 0.3)',
      '0 0 20px rgba(59, 130, 246, 0.1)'
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

// Badge de notification
<motion.div
  variants={pulseGlow}
  animate="animate"
  className="rounded-full bg-blue-500"
>
  3
</motion.div>
```

## 🌊 CSS Animations Complexes

### 1. Shimmer Effect on Load
```css
@keyframes shimmerLoad {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 0px,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  background-size: 1000px 100%;
  animation: shimmerLoad 2s infinite linear;
}
```

### 2. Gradient Mesh Animation (Background)
```css
@keyframes gradientFlow {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.ambient-gradient {
  background: linear-gradient(
    -45deg,
    rgba(59, 130, 246, 0.1),
    rgba(139, 92, 246, 0.08),
    rgba(251, 191, 36, 0.06),
    rgba(244, 63, 94, 0.08)
  );
  background-size: 400% 400%;
  animation: gradientFlow 15s ease infinite;
}
```

### 3. Glass Refraction Effect
```css
@keyframes refract {
  0%, 100% {
    transform: translateX(0) scale(1);
    opacity: 0;
  }
  50% {
    transform: translateX(20px) scale(1.1);
    opacity: 0.15;
  }
}

.glass-refraction::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 70%
  );
  animation: refract 3s ease-in-out infinite;
  pointer-events: none;
}
```

## 📱 Micro-interactions

### 1. Ripple Effect on Click
```tsx
const RippleButton: React.FC = ({ children, onClick }) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setRipples([...ripples, { x, y, id: Date.now() }]);
    
    setTimeout(() => {
      setRipples(ripples => ripples.slice(1));
    }, 600);
    
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className="relative overflow-hidden glass-primary"
    >
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full bg-white/30"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0
          }}
          animate={{
            width: 300,
            height: 300,
            opacity: [0.5, 0],
            x: -150,
            y: -150
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
      {children}
    </button>
  );
};
```

### 2. Magnetic Button Effect
```tsx
const MagneticButton: React.FC = ({ children }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) * 0.2;
    const deltaY = (e.clientY - centerY) * 0.2;
    
    setPosition({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        x: position.x,
        y: position.y
      }}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 300
      }}
      className="glass-primary"
    >
      {children}
    </motion.button>
  );
};
```

### 3. Smooth Number Counter
```tsx
const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const stepValue = (value - displayValue) / steps;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(prev => prev + stepValue);
      }
    }, stepDuration);
    
    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.span
      key={value}
      initial={{ scale: 1.2, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="font-bold text-2xl"
    >
      {Math.round(displayValue)}
    </motion.span>
  );
};
```

## 🎬 Page Transition Examples

### 1. Slide & Fade Transition
```tsx
import { AnimatePresence } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
    x: -20,
    backdropFilter: 'blur(0px)'
  },
  in: {
    opacity: 1,
    x: 0,
    backdropFilter: 'blur(20px)'
  },
  out: {
    opacity: 0,
    x: 20,
    backdropFilter: 'blur(0px)'
  }
};

const pageTransition = {
  type: 'tween',
  ease: [0.4, 0, 0.2, 1],
  duration: 0.4
};

<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    initial="initial"
    animate="in"
    exit="out"
    variants={pageVariants}
    transition={pageTransition}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

### 2. Scale & Blur Transition
```tsx
const scaleVariants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    filter: 'blur(10px)'
  },
  animate: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: {
    opacity: 0,
    scale: 1.1,
    filter: 'blur(10px)',
    transition: {
      duration: 0.3
    }
  }
};
```

## 🔄 Loading States

### 1. Skeleton Loader with Glass Effect
```tsx
export const GlassSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`
        skeleton-shimmer
        bg-white/5 dark:bg-white/3
        rounded-[var(--radius-card)]
        backdrop-blur-[10px]
        ${className}
      `}
    />
  );
};

// Usage
<div className="space-y-3">
  <GlassSkeleton className="h-20" />
  <GlassSkeleton className="h-20" />
  <GlassSkeleton className="h-20" />
</div>
```

### 2. Pulse Loader
```tsx
export const GlassPulse: React.FC = () => {
  return (
    <div className="flex gap-2 items-center justify-center">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-3 h-3 rounded-full bg-primary-500/50 backdrop-blur-sm"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
    </div>
  );
};
```

## ✨ Special Effects

### 1. Particle Float Effect
```tsx
const ParticleFloat: React.FC = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 rounded-full bg-white/20"
          style={{ left: `${particle.x}%`, bottom: -10 }}
          animate={{
            y: [-10, -600],
            opacity: [0, 1, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  );
};
```

### 2. Aurora Effect Background
```css
@keyframes aurora {
  0%, 100% {
    opacity: 0.3;
    transform: translateY(0) rotate(0deg);
  }
  33% {
    opacity: 0.5;
    transform: translateY(-10%) rotate(5deg);
  }
  66% {
    opacity: 0.4;
    transform: translateY(10%) rotate(-5deg);
  }
}

.aurora-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  background: 
    radial-gradient(
      ellipse at 30% 20%,
      rgba(59, 130, 246, 0.15) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse at 70% 80%,
      rgba(139, 92, 246, 0.12) 0%,
      transparent 50%
    );
  animation: aurora 20s ease-in-out infinite;
}
```

## 📊 Recommendations

### Performance Optimization
1. Use `will-change` CSS property sparingly for animated elements
2. Prefer `transform` and `opacity` for smooth 60fps animations
3. Use `backdrop-filter` with moderation (GPU intensive)
4. Implement `IntersectionObserver` for lazy animation triggers
5. Debounce scroll/mousemove handlers

### Accessibility
1. Respect `prefers-reduced-motion` media query
2. Provide alternative interactions for keyboard users
3. Ensure sufficient contrast ratios with glass surfaces
4. Add ARIA labels to animated components

### Mobile Optimization
1. Reduce blur intensity on mobile (15px instead of 30px)
2. Disable complex hover effects on touch devices
3. Use shorter animation durations (200ms vs 300ms)
4. Simplify particle effects on low-end devices
