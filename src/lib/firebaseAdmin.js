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
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

// Quita comillas que a veces se pegan en los valores de entorno de Vercel.
function stripQuotes(value) {
  const s = String(value ?? "").trim();
  if (s.length >= 2 && ((s[0] === '"' && s.endsWith('"')) || (s[0] === "'" && s.endsWith("'")))) {
    return s.slice(1, -1);
  }
  return s;
}

// Normaliza la llave privada sin importar como se haya guardado:
// con \n literales, con saltos reales, con \r\n, con comillas, o pegada junto
// al nombre del campo (ej: "\"private_key\": \"-----BEGIN...\"").
function normalizePrivateKey(value) {
  let key = stripQuotes(value);
  if (!key) return "";
  // Comillas escapadas dentro del valor.
  key = key.replace(/^"|"$/g, "");
  // Doble escape (\\n) y escape simple (\n) -> salto real.
  key = key.replace(/\\\\n/g, "\n");
  key = key.replace(/\\n/g, "\n");
  key = key.replace(/\r/g, "");

  // Extrae exactamente el bloque PEM, descartando cualquier texto alrededor.
  const begin = key.indexOf("-----BEGIN");
  if (begin !== -1) {
    const endStart = key.indexOf("-----END", begin);
    if (endStart !== -1) {
      const endClose = key.indexOf("-----", endStart + 8);
      const end = endClose !== -1 ? endClose + 5 : key.length;
      key = key.slice(begin, end);
    } else {
      key = key.slice(begin);
    }
  }
  return key.trim();
}

function normalizeServiceAccount(sa) {
  if (!sa || typeof sa !== "object") return null;
  return {
    ...sa,
    projectId: sa.projectId || sa.project_id,
    clientEmail: sa.clientEmail || sa.client_email,
    privateKey: normalizePrivateKey(sa.privateKey || sa.private_key),
  };
}

function loadServiceAccount() {
  // 1) JSON en variable de entorno (admite JSON crudo o base64).
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    const cleaned = stripQuotes(raw);
    const fromJson =
      parseServiceAccount(cleaned) ||
      parseServiceAccount(Buffer.from(cleaned, "base64").toString("utf8"));
    if (fromJson) return normalizeServiceAccount(fromJson);
  }

  // 2) Archivo JSON. Se prueban varias rutas por si el proceso arranca desde otra carpeta.
  const candidates = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    DEFAULT_SERVICE_ACCOUNT_PATH,
    resolve(process.cwd(), "serviceAccountKey.json"),
  ].filter(Boolean);
  for (const candidate of candidates) {
    const resolvedPath = resolve(process.cwd(), candidate);
    if (existsSync(resolvedPath)) {
      const fromFile = parseServiceAccount(readFileSync(resolvedPath, "utf8"));
      if (fromFile) return normalizeServiceAccount(fromFile);
    }
  }

  // 3) Par correo + llave.
  const projectId = stripQuotes(
    process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
  const clientEmail = stripQuotes(process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
  const privateKey = normalizePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  console.error(
    "[firebaseAdmin] No se encontraron credenciales. cwd=%s, probado: %s",
    process.cwd(),
    candidates.map((c) => resolve(process.cwd(), c)).join(", ")
  );
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

  if (!serviceAccount.privateKey || !serviceAccount.clientEmail || !(serviceAccount.projectId || serviceAccount.project_id)) {
    console.error("[firebaseAdmin] Credenciales incompletas: falta projectId, clientEmail o privateKey.");
    throw new Error("Credenciales de Firebase Admin incompletas.");
  }

  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  try {
    return initializeApp({
      credential: cert({
        projectId: serviceAccount.projectId || serviceAccount.project_id,
        clientEmail: serviceAccount.clientEmail,
        privateKey: serviceAccount.privateKey,
      }),
      projectId: serviceAccount.projectId || serviceAccount.project_id,
      storageBucket,
    });
  } catch (error) {
    console.error("[firebaseAdmin] No se pudo inicializar con las credenciales:", error?.message);
    throw new Error(`Credenciales de Firebase Admin invalidas: ${error?.message || "error desconocido"}`);
  }
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

/**
 * Diagnostico seguro (sin exponer secretos) del estado de las credenciales.
 * Sirve para saber exactamente donde falla la configuracion en produccion.
 */
export function describeAdminCredentials() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const out = {
    envPresent: {
      FIREBASE_SERVICE_ACCOUNT_JSON: !!raw,
      FIREBASE_SERVICE_ACCOUNT_PATH: !!process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
      FIREBASE_ADMIN_PROJECT_ID: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
      FIREBASE_ADMIN_CLIENT_EMAIL: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      FIREBASE_ADMIN_PRIVATE_KEY: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    },
  };

  if (raw) {
    const cleaned = stripQuotes(raw);
    const isBase64Json = !!parseServiceAccount(Buffer.from(cleaned, "base64").toString("utf8"));
    out.jsonParse = {
      rawJson: !!parseServiceAccount(cleaned),
      base64Json: isBase64Json,
      looksLikeBase64: /^[A-Za-z0-9+/=\s]+$/.test(cleaned) && cleaned.length > 40,
    };
  }

  const sa = loadServiceAccount();
  out.credentialsFound = !!sa;
  if (sa) {
    out.fields = {
      projectId: !!sa.projectId,
      clientEmail: !!sa.clientEmail,
      privateKey: !!sa.privateKey,
      privateKeyHasRealNewlines: typeof sa.privateKey === "string" && sa.privateKey.includes("\n"),
      privateKeyHeaderOk: typeof sa.privateKey === "string" && sa.privateKey.startsWith("-----BEGIN PRIVATE KEY-----"),
      projectIdValue: sa.projectId || null,
    };
  }
  return out;
}
