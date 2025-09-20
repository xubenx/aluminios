# Instrucciones para configurar Firebase Storage

## ⚠️ ACCIÓN REQUERIDA: Configurar reglas de Firebase Storage

Para completar la migración, necesitas actualizar las reglas de seguridad en Firebase Console:

### 1. Ir a Firebase Console
1. Ve a https://console.firebase.google.com/
2. Selecciona tu proyecto: **aluminios-88a45**
3. En el menú lateral, ve a **Storage**
4. Ve a la pestaña **Rules**

### 2. Actualizar las reglas
Reemplaza las reglas actuales con el contenido del archivo `storage.rules`:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permitir lectura de todas las imágenes de modelos
    match /models/images/{imageId} {
      allow read: if true;
      allow write: if true; // Temporal para migración
    }
    
    // Permitir acceso a archivos de prueba
    match /test/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

### 3. Publicar las reglas
1. Haz clic en **Publish** para aplicar las nuevas reglas
2. Las reglas se aplicarán inmediatamente

### 4. Verificar la configuración
Una vez publicadas las reglas, ejecuta:
```bash
npm run test-storage
```

### 5. Ejecutar la migración
Cuando el test pase, ejecuta:
```bash
npm run migrate-all
```

---

## 📋 Estado actual del proyecto

### ✅ Completado:
- Firebase Storage configurado en `firebase.js`
- Funciones utilitarias creadas en `src/utils/imageStorage.js`
- API de upload actualizada en `src/app/api/upload-image/route.js`
- Componentes de modelos actualizados para usar Firebase Storage
- Scripts de migración creados y listos para usar

### 🔄 En progreso:
- **Configuración de reglas de Firebase Storage** (requiere acción manual)

### ⏳ Pendiente:
- Migración de 70 imágenes existentes a Firebase Storage
- Actualización de otros componentes (presupuestos, proyectos)
- Limpieza de código legacy

---

## 🚀 Próximos pasos después de configurar las reglas:

1. Probar conectividad: `node test-firebase-storage.js`
2. Migrar imágenes: `npm run migrate-all`
3. Verificar que las imágenes se muestren correctamente en el sistema
4. Actualizar otros componentes que usen imágenes de modelos
5. Restringir las reglas de Storage para mayor seguridad (opcional)

---

## 🔧 Scripts disponibles:

- `npm run test-storage` - Probar conectividad con Firebase Storage
- `npm run migrate-all` - Migrar todas las imágenes locales
- `npm run check-migration` - Verificar estado de migración
- `node check-images.js` - Listar imágenes locales disponibles