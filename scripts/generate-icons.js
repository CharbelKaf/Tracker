/**
 * Script pour générer les icônes PWA à partir d'une image source
 * Utilisation: node scripts/generate-icons.js <source-image>
 * 
 * Prérequis: npm install sharp --save-dev
 */

import sharp from 'sharp';
import { mkdir, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Tailles d'icônes à générer
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const SHORTCUT_SIZE = 96;

// Couleurs
const PRIMARY_COLOR = '#6366f1';
const BACKGROUND_COLOR = '#ffffff';

/**
 * Crée le dossier s'il n'existe pas
 */
async function ensureDir(dir) {
  try {
    await access(dir);
  } catch {
    await mkdir(dir, { recursive: true });
    console.log(`✅ Dossier créé: ${dir}`);
  }
}

/**
 * Génère une icône simple avec texte
 */
async function generateSimpleIcon(size, outputPath) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${PRIMARY_COLOR};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
      <text 
        x="50%" 
        y="50%" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        font-family="Arial, sans-serif" 
        font-weight="bold" 
        font-size="${size * 0.5}" 
        fill="${BACKGROUND_COLOR}">N</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(outputPath);
  
  console.log(`✅ Généré: ${outputPath} (${size}x${size})`);
}

/**
 * Génère une icône de raccourci
 */
async function generateShortcutIcon(name, emoji, outputPath) {
  const size = SHORTCUT_SIZE;
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="${PRIMARY_COLOR}"/>
      <text 
        x="50%" 
        y="50%" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        font-size="${size * 0.6}">${emoji}</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(outputPath);
  
  console.log(`✅ Généré: ${outputPath} (shortcut)`);
}

/**
 * Génère toutes les icônes
 */
async function generateAllIcons(sourceImage = null) {
  const publicDir = join(__dirname, '..', 'public');
  const iconsDir = join(publicDir, 'icons');
  
  await ensureDir(iconsDir);

  console.log('\n🎨 Génération des icônes PWA...\n');

  if (sourceImage) {
    // Utiliser l'image source fournie
    console.log(`📸 Source: ${sourceImage}\n`);
    
    for (const size of ICON_SIZES) {
      const outputPath = join(iconsDir, `icon-${size}x${size}.png`);
      
      await sharp(sourceImage)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Généré: icon-${size}x${size}.png`);
    }
  } else {
    // Générer des icônes simples par défaut
    console.log('📸 Aucune source fournie, génération d\'icônes par défaut\n');
    
    for (const size of ICON_SIZES) {
      const outputPath = join(iconsDir, `icon-${size}x${size}.png`);
      await generateSimpleIcon(size, outputPath);
    }
  }

  // Générer les icônes de raccourcis
  console.log('\n🔗 Génération des icônes de raccourcis...\n');
  
  await generateShortcutIcon(
    'inventory',
    '📦',
    join(iconsDir, 'shortcut-inventory.png')
  );
  
  await generateShortcutIcon(
    'assign',
    '👤',
    join(iconsDir, 'shortcut-assign.png')
  );

  console.log('\n✅ Toutes les icônes ont été générées avec succès!\n');
  console.log('📁 Emplacement: public/icons/\n');
}

/**
 * Génère un favicon.ico
 */
async function generateFavicon() {
  const publicDir = join(__dirname, '..', 'public');
  const iconsDir = join(publicDir, 'icons');
  const faviconPath = join(publicDir, 'favicon.ico');
  
  const iconPath = join(iconsDir, 'icon-192x192.png');
  
  try {
    await sharp(iconPath)
      .resize(32, 32)
      .toFile(faviconPath);
    
    console.log('✅ Favicon généré: public/favicon.ico\n');
  } catch (error) {
    console.warn('⚠️  Impossible de générer favicon.ico:', error.message);
  }
}

// Point d'entrée
const sourceImage = process.argv[2];

generateAllIcons(sourceImage)
  .then(() => generateFavicon())
  .then(() => {
    console.log('🎉 Génération terminée!\n');
    console.log('📋 Prochaines étapes:');
    console.log('   1. Vérifier les icônes dans public/icons/');
    console.log('   2. Tester l\'installation PWA');
    console.log('   3. Lancer un audit Lighthouse\n');
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
