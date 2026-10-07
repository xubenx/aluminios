import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Ruta por defecto del JSON de la cuenta de servicio (Firebase Console >
// Configuracion del proyecto > Cuentas de servicio > Generar nueva clave privada).
const DEFAULT_SERVICE_ACCOUNT_PATH = "serviceAccountKey.json";

function parseServiceAccount(raw) {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    const fromJson = parseServiceAccount(raw);
    if (fromJson) return fromJson;
  }

  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || DEFAULT_SERVICE_ACCOUNT_PATH;
  const resolvedPath = resolve(process.cwd(), filePath);
  if (existsSync(resolvedPath)) {
    const fromFile = parseServiceAccount(readFileSync(resolvedPath, "utf8"));
    if (fromFile) return fromFile;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  return null;
}

export function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const serviceAccount = loadServiceAccount();
  if (!serviceAccount) {
    throw new Error(
      "Faltan credenciales de Firebase Admin. Define FIREBASE_SERVICE_ACCOUNT_JSON o FIREBASE_ADMIN_CLIENT_EMAIL y FIREBASE_ADMIN_PRIVATE_KEY."
    );
  }

  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  return initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id || serviceAccount.projectId,
    storageBucket,
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getAdminBucket() {
  return getStorage(getAdminApp()).bucket();
}
