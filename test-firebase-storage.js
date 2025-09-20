// Script para probar la conectividad con Firebase Storage
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from './firebase.js';

async function testFirebaseStorage() {
  console.log('🔧 Probando conectividad con Firebase Storage...\n');
  
  try {
    // Crear un archivo de prueba pequeño
    const testContent = new Uint8Array([72, 101, 108, 108, 111]); // "Hello" en bytes
    const testRef = ref(storage, 'test/connectivity-test.txt');
    
    console.log('📤 Subiendo archivo de prueba...');
    const snapshot = await uploadBytes(testRef, testContent);
    console.log('✅ Archivo subido correctamente');
    
    console.log('🔗 Obteniendo URL de descarga...');
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ URL obtenida:', downloadURL);
    
    console.log('\n🎉 ¡Firebase Storage funciona correctamente!');
    console.log('📋 Configuración verificada:');
    console.log(`   Bucket: ${storage.app.options.storageBucket}`);
    console.log(`   Proyecto: ${storage.app.options.projectId}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error conectando con Firebase Storage:');
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);
    console.error('Detalles:', error);
    
    if (error.code === 'storage/unknown' && error.status_ === 404) {
      console.log('\n💡 POSIBLES SOLUCIONES:');
      console.log('1. Verifica que Firebase Storage esté habilitado en tu proyecto');
      console.log('2. Confirma que el storageBucket en firebaseConfig sea correcto');
      console.log('3. Revisa las reglas de seguridad de Storage en Firebase Console');
      console.log('4. Asegúrate de que tu proyecto tenga un plan que incluya Storage');
    }
    
    return false;
  }
}

testFirebaseStorage();