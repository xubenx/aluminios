import dotenv from "dotenv";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../src/lib/firebaseAdmin.js";
import { hashPassword } from "../src/lib/password.js";
import { isRole } from "../src/lib/roles.js";

dotenv.config({ path: ".env.local" });

function readOwner() {
  const arg = process.argv.find((item) => item.startsWith("--owner="));
  return arg ? arg.split("=")[1].trim().toLowerCase() : "";
}

async function main() {
  const owner = readOwner();
  if (!owner) {
    console.error("Indica el usuario administrador: node scripts/migrate-employee-secrets.mjs --owner=jperez");
    process.exit(1);
  }

  const db = getAdminDb();
  const snapshot = await db.collection("employees").get();
  if (snapshot.empty) {
    console.log("No hay empleados para migrar.");
    return;
  }

  const ownerDoc = snapshot.docs.find((doc) => String(doc.data().usuario || "").toLowerCase() === owner);
  if (!ownerDoc) {
    console.error(`No existe un empleado con usuario "${owner}".`);
    process.exit(1);
  }

  for (const employeeDoc of snapshot.docs) {
    const data = employeeDoc.data();
    const usuario = String(data.usuario || "").toLowerCase();
    const role = employeeDoc.id === ownerDoc.id ? "admin" : isRole(data.role) && data.role !== "admin" ? data.role : data.role === "admin" ? "admin" : "colaborador";
    const secretRef = db.collection("employeeSecrets").doc(employeeDoc.id);
    const secretSnap = await secretRef.get();

    if (data.password && !secretSnap.exists) {
      await secretRef.set({
        passwordHash: await hashPassword(String(data.password)),
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log(`Hash creado para ${usuario || employeeDoc.id}`);
    } else if (!data.password && !secretSnap.exists) {
      console.log(`Sin contraseña: ${usuario || employeeDoc.id}. Asigna una desde Colaboradores.`);
    }

    await employeeDoc.ref.update({
      role,
      usuario,
      password: FieldValue.delete(),
    });
    console.log(`Rol ${role} para ${usuario || employeeDoc.id}`);
  }

  console.log("Migración terminada. Publica firestore.rules y storage.rules después de este script.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
