# 🔐 Configuración de Variables de Entorno

Este proyecto utiliza variables de entorno para proteger información sensible como credenciales de Firebase, tokens de Telegram y otras configuraciones.

## 📋 Variables Requeridas

Para que el proyecto funcione correctamente, necesitas crear un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=tu_measurement_id

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=tu_telegram_bot_token
TELEGRAM_CHAT_ID=tu_telegram_chat_id

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://tudominio.com

# Firebase Migration (for scripts)
FIREBASE_MIGRATION_API_KEY=tu_migration_api_key
```

## 🚀 Configuración Inicial

1. **Copia el archivo de ejemplo:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edita `.env.local`** con tus credenciales reales.

3. **Verifica la configuración:**
   ```bash
   npm run test-env
   ```

## 🔒 Seguridad

- ✅ El archivo `.env.local` está incluido en `.gitignore` y **NO se sube al repositorio**
- ✅ Las variables con prefijo `NEXT_PUBLIC_` son accesibles en el frontend
- ✅ Las variables sin prefijo solo están disponibles en el servidor
- ✅ Nunca hardcodees credenciales en el código fuente

## 📁 Archivos Importantes

- `.env.local` - Variables de entorno (NO subir al repo)
- `.env.example` - Plantilla de variables (SÍ subir al repo)
- `firebase.js` - Configuración de Firebase usando variables de entorno
- `migrate.js` - Script de migración usando variables de entorno

## ⚠️ Importante

**NUNCA** subas archivos `.env*` (excepto `.env.example`) al repositorio. Estas contienen información sensible que podría comprometer la seguridad del proyecto.
