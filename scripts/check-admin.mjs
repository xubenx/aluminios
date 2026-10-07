import dotenv from "dotenv";
import { getAdminApp, getAdminDb } from "../src/lib/firebaseAdmin.js";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ path: ".env", quiet: true });

async function main() {
  try {
    const app = getAdminApp();
    const db = getAdminDb();
    const snapshot = await db.collection("employees").limit(1).get();
    console.log("OK: Firebase Admin conectado.");
    console.log(`   Proyecto: ${app.options.projectId || "(desconocido)"}`);
    console.log(`   Bucket:   ${app.options.storageBucket || "(sin bucket)"}`);
    console.log(`   Empleados legibles: ${snapshot.size} (prueba de lectura)`);
    console.log("\nEl login ya puede crear tokens. Reinicia el servidor y prueba entrar.");
  } catch (error) {
    console.error("FALLO: no se pudo inicializar Firebase Admin.");
    console.error(`   ${error.message}`);
    console.error(
      "\nRevisa FIREBASE_SERVICE_ACCOUNT_PATH (JSON en la raiz) o FIREBASE_ADMIN_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY."
    );
    process.exit(1);
  }
}

main();
