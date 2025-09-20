// Script de migración simplificado para todas las imágenes locales
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadModelImage } from './src/utils/imageStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateAllImages() {
  console.log('🚀 Iniciando migración de todas las imágenes locales a Firebase Storage...\n');
  
  const localImagesPath = path.join(__dirname, 'public', 'images');
  
  if (!fs.existsSync(localImagesPath)) {
    console.log('❌ No se encontró el directorio /public/images');
    return;
  }
  
  const imageFiles = fs.readdirSync(localImagesPath)
    .filter(file => file.match(/\.(png|jpg|jpeg|webp)$/i));
  
  console.log(`📁 Encontradas ${imageFiles.length} imágenes para migrar\n`);
  
  let migratedCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  
  for (let i = 0; i < imageFiles.length; i++) {
    const filename = imageFiles[i];
    const modelId = filename.split('.')[0];
    const filePath = path.join(localImagesPath, filename);
    
    console.log(`📤 [${i + 1}/${imageFiles.length}] Migrando: ${filename}`);
    console.log(`   Modelo ID: ${modelId}`);
    
    try {
      // Leer el archivo como buffer
      const fileBuffer = fs.readFileSync(filePath);
      const fileType = path.extname(filename).toLowerCase().replace('.', '');
      
      // Crear un objeto File-like para la función uploadModelImage
      const file = {
        buffer: fileBuffer,
        originalname: filename,
        mimetype: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
        size: fileBuffer.length
      };
      
      // Subir la imagen
      const downloadURL = await uploadModelImage(file, modelId);
      
      if (downloadURL) {
        console.log(`✅ Migrada exitosamente`);
        console.log(`   URL: ${downloadURL}\n`);
        migratedCount++;
      } else {
        console.log(`❌ Error en la migración\n`);
        errorCount++;
      }
      
    } catch (error) {
      console.error(`❌ Error migrando ${filename}:`, error.message);
      errorCount++;
    }
    
    // Pausa para evitar sobrecargar Firebase
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Resumen final
  console.log('\n🎯 RESUMEN FINAL DE MIGRACIÓN:');
  console.log('═'.repeat(50));
  console.log(`✅ Imágenes migradas exitosamente: ${migratedCount}`);
  console.log(`❌ Imágenes con errores: ${errorCount}`);
  console.log(`⏭️  Imágenes saltadas: ${skippedCount}`);
  console.log(`📊 Total procesadas: ${imageFiles.length}`);
  console.log('═'.repeat(50));
  
  if (migratedCount > 0) {
    console.log('\n🎉 ¡Migración completada!');
    console.log('\n📝 PRÓXIMOS PASOS:');
    console.log('1. ✓ Las imágenes están ahora en Firebase Storage');
    console.log('2. ✓ El sistema usará automáticamente Firebase Storage');
    console.log('3. 🔍 Verifica que las imágenes se muestren correctamente');
    console.log('4. 🗑️  Opcionalmente, puedes eliminar /public/images después de verificar');
  }
  
  return {
    migrated: migratedCount,
    errors: errorCount,
    skipped: skippedCount,
    total: imageFiles.length
  };
}

// Ejecutar migración
async function main() {
  try {
    const result = await migrateAllImages();
    process.exit(result.errors > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  }
}

main();