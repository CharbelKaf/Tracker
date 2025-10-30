/**
 * Script de test PWA
 * Vérifie que tous les fichiers PWA nécessaires sont présents
 */

import { access, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, '..', 'public');

// Tests à effectuer
const tests = {
  manifest: {
    name: 'Manifest.json',
    path: join(publicDir, 'manifest.json'),
    checks: async (content) => {
      const manifest = JSON.parse(content);
      const errors = [];
      
      if (!manifest.name) errors.push('❌ "name" manquant');
      if (!manifest.short_name) errors.push('❌ "short_name" manquant');
      if (!manifest.start_url) errors.push('❌ "start_url" manquant');
      if (!manifest.display) errors.push('❌ "display" manquant');
      if (!manifest.theme_color) errors.push('❌ "theme_color" manquant');
      if (!manifest.background_color) errors.push('❌ "background_color" manquant');
      if (!manifest.icons || manifest.icons.length === 0) {
        errors.push('❌ Aucune icône définie');
      }
      
      return errors;
    }
  },
  
  serviceWorker: {
    name: 'Service Worker',
    path: join(publicDir, 'sw.js'),
    checks: async (content) => {
      const errors = [];
      
      if (!content.includes('install')) errors.push('❌ Event "install" manquant');
      if (!content.includes('activate')) errors.push('❌ Event "activate" manquant');
      if (!content.includes('fetch')) errors.push('❌ Event "fetch" manquant');
      
      return errors;
    }
  },
  
  offlinePage: {
    name: 'Page Offline',
    path: join(publicDir, 'offline.html'),
    checks: async (content) => {
      const errors = [];
      
      if (!content.includes('<!DOCTYPE html>')) {
        errors.push('❌ HTML invalide');
      }
      
      return errors;
    }
  },
  
  icons: {
    name: 'Icônes PWA',
    paths: [
      join(publicDir, 'icons', 'icon-72x72.png'),
      join(publicDir, 'icons', 'icon-96x96.png'),
      join(publicDir, 'icons', 'icon-128x128.png'),
      join(publicDir, 'icons', 'icon-144x144.png'),
      join(publicDir, 'icons', 'icon-152x152.png'),
      join(publicDir, 'icons', 'icon-192x192.png'),
      join(publicDir, 'icons', 'icon-384x384.png'),
      join(publicDir, 'icons', 'icon-512x512.png'),
    ],
    checkMultiple: true
  }
};

/**
 * Vérifie si un fichier existe
 */
async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Exécute les tests
 */
async function runTests() {
  console.log('\n🧪 Tests PWA\n');
  console.log('═'.repeat(50) + '\n');
  
  let passed = 0;
  let failed = 0;
  let warnings = 0;
  
  for (const [key, test] of Object.entries(tests)) {
    console.log(`📋 ${test.name}`);
    
    if (test.checkMultiple) {
      // Vérifier plusieurs fichiers
      const missing = [];
      
      for (const path of test.paths) {
        const exists = await fileExists(path);
        if (!exists) {
          const filename = path.split(/[/\\]/).pop();
          missing.push(filename);
        }
      }
      
      if (missing.length === 0) {
        console.log(`   ✅ Toutes les icônes présentes (${test.paths.length})`);
        passed++;
      } else if (missing.length === test.paths.length) {
        console.log(`   ❌ Aucune icône trouvée`);
        console.log(`   💡 Exécutez: npm run generate-icons`);
        failed++;
      } else {
        console.log(`   ⚠️  ${missing.length} icône(s) manquante(s):`);
        missing.forEach(name => console.log(`      - ${name}`));
        warnings++;
      }
    } else {
      // Vérifier un seul fichier
      const exists = await fileExists(test.path);
      
      if (!exists) {
        console.log(`   ❌ Fichier non trouvé: ${test.path}`);
        failed++;
      } else {
        console.log(`   ✅ Fichier présent`);
        
        if (test.checks) {
          const content = await readFile(test.path, 'utf-8');
          const errors = await test.checks(content);
          
          if (errors.length > 0) {
            console.log(`   ⚠️  Problèmes détectés:`);
            errors.forEach(err => console.log(`      ${err}`));
            warnings++;
          } else {
            console.log(`   ✅ Validation réussie`);
            passed++;
          }
        } else {
          passed++;
        }
      }
    }
    
    console.log();
  }
  
  // Résumé
  console.log('═'.repeat(50));
  console.log('\n📊 Résumé\n');
  console.log(`   ✅ Tests réussis:  ${passed}`);
  console.log(`   ⚠️  Avertissements: ${warnings}`);
  console.log(`   ❌ Tests échoués:  ${failed}`);
  
  const total = passed + warnings + failed;
  const score = Math.round((passed / total) * 100);
  
  console.log(`\n   Score PWA: ${score}%`);
  
  if (score === 100) {
    console.log('\n   🎉 PWA prête pour le déploiement!\n');
  } else if (score >= 75) {
    console.log('\n   👍 Presque prête, quelques ajustements nécessaires\n');
  } else {
    console.log('\n   ⚠️  Des corrections importantes sont nécessaires\n');
  }
  
  // Prochaines étapes
  if (failed > 0 || warnings > 0) {
    console.log('📋 Prochaines étapes:\n');
    
    if (failed > 0) {
      console.log('   1. Générer les icônes manquantes:');
      console.log('      npm run generate-icons\n');
    }
    
    if (warnings > 0) {
      console.log('   2. Vérifier les fichiers avec avertissements');
      console.log('   3. Corriger les problèmes détectés\n');
    }
  }
  
  console.log('🧪 Tests Lighthouse recommandés:\n');
  console.log('   1. Ouvrir DevTools (F12)');
  console.log('   2. Onglet "Lighthouse"');
  console.log('   3. Cocher "Progressive Web App"');
  console.log('   4. Cliquer "Generate report"\n');
  
  process.exit(score === 100 ? 0 : 1);
}

// Exécuter les tests
runTests().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
