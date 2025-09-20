// Script simple para verificar imágenes locales
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function checkLocalImages() {
  console.log('🔍 Verificando imágenes locales...\n');
  
  const localImagesPath = path.join(__dirname, 'public', 'images');
  console.log(`📁 Buscando en: ${localImagesPath}`);
  
  if (!fs.existsSync(localImagesPath)) {
    console.log('❌ No se encontró el directorio /public/images');
    return;
  }
  
  const files = fs.readdirSync(localImagesPath);
  const imageFiles = files.filter(file => file.match(/\.(png|jpg|jpeg|webp)$/i));
  
  console.log(`✅ Encontrados ${imageFiles.length} archivos de imagen:`);
  
  if (imageFiles.length > 0) {
    imageFiles.forEach((file, index) => {
      const modelId = file.split('.')[0];
      console.log(`   ${index + 1}. ${file} (ID: ${modelId})`);
    });
  } else {
    console.log('ℹ️ No se encontraron imágenes para migrar');
  }
  
  console.log('\n📊 Resumen:');
  console.log(`   Total de archivos: ${files.length}`);
  console.log(`   Imágenes válidas: ${imageFiles.length}`);
}

checkLocalImages();