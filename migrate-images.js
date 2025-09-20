// Script para migrar imágenes locales a Firebase Storage
// Ejecutar: node migrate-images.js

import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase.js";
import { migrateLocalImageToStorage } from "./src/utils/imageStorage.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateImages() {
  console.log('🚀 Iniciando migración de imágenes a Firebase Storage...\n');
  
  try {
    // Obtener todos los modelos de Firestore
    console.log('📋 Obteniendo lista de modelos...');
    const modelsSnapshot = await getDocs(collection(db, "models"));
    const models = modelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`✅ Encontrados ${models.length} modelos\n`);

    // Obtener lista de imágenes locales
    const localImagesPath = path.join(__dirname, 'public', 'images');
    let localImages = [];
    
    console.log(`📁 Verificando directorio: ${localImagesPath}`);
    
    try {
      if (fs.existsSync(localImagesPath)) {
        localImages = fs.readdirSync(localImagesPath)
          .filter(file => file.match(/\.(png|jpg|jpeg|webp)$/i))
          .map(file => ({
            filename: file,
            modelId: file.split('.')[0],
            path: `/images/${file}`,
            fullPath: path.join(localImagesPath, file)
          }));
        console.log(`✅ Encontradas ${localImages.length} imágenes locales`);
      } else {
        console.log(`❌ No se encontró el directorio ${localImagesPath}`);
      }
    } catch (error) {
      console.error('❌ Error al leer directorio de imágenes locales:', error.message);
      localImages = [];
    }

    if (localImages.length === 0) {
      console.log('ℹ️ No hay imágenes locales para migrar\n');
      return;
    }

    // Migrar cada imagen
    console.log('\n🔄 Iniciando migración de imágenes...\n');
    let migratedCount = 0;
    let errorCount = 0;

    for (const image of localImages) {
      console.log(`📤 Migrando: ${image.filename} (Modelo ID: ${image.modelId})`);
      
      try {
        // Verificar si el modelo existe
        const modelExists = models.some(model => model.id === image.modelId);
        
        if (!modelExists) {
          console.log(`⚠️  Modelo ${image.modelId} no existe en Firestore, saltando imagen`);
          continue;
        }

        // Migrar la imagen
        const downloadURL = await migrateLocalImageToStorage(image.path, image.modelId);
        
        if (downloadURL) {
          console.log(`✅ Migrado exitosamente: ${image.filename}`);
          console.log(`   URL: ${downloadURL}\n`);
          migratedCount++;
        } else {
          console.log(`❌ Error migrando: ${image.filename}\n`);
          errorCount++;
        }
        
        // Pausa pequeña para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Error migrando ${image.filename}:`, error.message);
        errorCount++;
      }
    }

    // Resumen final
    console.log('\n📊 RESUMEN DE MIGRACIÓN:');
    console.log(`✅ Imágenes migradas exitosamente: ${migratedCount}`);
    console.log(`❌ Imágenes con errores: ${errorCount}`);
    console.log(`📁 Total de imágenes procesadas: ${localImages.length}`);

    if (migratedCount > 0) {
      console.log('\n🎉 ¡Migración completada exitosamente!');
      console.log('\n📝 PRÓXIMOS PASOS:');
      console.log('1. Verifica que las imágenes se muestren correctamente en el sistema');
      console.log('2. Una vez verificado, puedes eliminar las imágenes locales de /public/images');
      console.log('3. El sistema ahora usará Firebase Storage para todas las imágenes nuevas');
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  }
}

// Función de ayuda para verificar el estado
async function checkMigrationStatus() {
  console.log('🔍 Verificando estado de migración...\n');
  
  try {
    // Verificar imágenes locales primero
    const localImagesPath = path.join(__dirname, 'public', 'images');
    let localImages = [];
    
    console.log(`📁 Verificando directorio: ${localImagesPath}`);
    
    if (fs.existsSync(localImagesPath)) {
      localImages = fs.readdirSync(localImagesPath)
        .filter(file => file.match(/\.(png|jpg|jpeg|webp)$/i));
      console.log(`✅ Encontradas ${localImages.length} imágenes locales`);
    } else {
      console.log(`❌ No se encontró el directorio ${localImagesPath}`);
      return;
    }

    // Obtener modelos de Firestore
    console.log('📋 Conectando a Firestore...');
    const modelsSnapshot = await getDocs(collection(db, "models"));
    const models = modelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`✅ Encontrados ${models.length} modelos en Firestore`);
    
    console.log(`\n📊 RESUMEN:`);
    console.log(`📋 Modelos en Firestore: ${models.length}`);
    console.log(`📁 Imágenes locales: ${localImages.length}`);
    
    if (localImages.length > 0) {
      console.log('\n📂 Imágenes locales encontradas:');
      localImages.forEach(image => {
        const modelId = image.split('.')[0];
        const modelExists = models.some(model => model.id === modelId);
        console.log(`   ${image} ${modelExists ? '✅' : '⚠️ (modelo no existe)'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error verificando estado:', error.message);
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  
  // Agregar timeout global
  const timeout = setTimeout(() => {
    console.log('\n⏰ Timeout: El proceso se está tomando demasiado tiempo');
    process.exit(1);
  }, 60000); // 1 minuto timeout

  try {
    if (args.includes('--check') || args.includes('-c')) {
      await checkMigrationStatus();
    } else if (args.includes('--help') || args.includes('-h')) {
      console.log('📖 SCRIPT DE MIGRACIÓN DE IMÁGENES');
      console.log('');
      console.log('Uso:');
      console.log('  node migrate-images.js        # Ejecutar migración');
      console.log('  node migrate-images.js -c     # Verificar estado');
      console.log('  node migrate-images.js -h     # Mostrar ayuda');
      console.log('');
      console.log('Este script migra las imágenes locales de /public/images');
      console.log('hacia Firebase Storage para uso en producción.');
    } else {
      await migrateImages();
    }
  } catch (error) {
    console.error('❌ Error en main:', error.message);
  } finally {
    clearTimeout(timeout);
    console.log('\n✅ Proceso completado');
    process.exit(0);
  }
}

// Ejecutar solo si es el archivo principal
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { migrateImages, checkMigrationStatus };