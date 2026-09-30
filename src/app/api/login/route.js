import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb, hasAdminCredentials } from "../../../lib/firebaseAdmin";
import { hashPassword, verifyPassword } from "../../../lib/password";
import { isRole } from "../../../lib/roles";
import { rateLimit } from "../../../lib/rateLimit";
import { findEmployeeByUsuario, passwordMatches } from "../../../lib/employeePassword";
import { authEmailForUsuario, ensureEmailPasswordUser } from "../../../lib/firebaseEmailAuth";

async function loginWithWebApi(usuario, password) {
  const employee = await findEmployeeByUsuario(usuario);
  if (!employee || !(await passwordMatches(employee, password))) {
    return { status: 401, body: { message: "Usuario o contraseña incorrectos." } };
  }

  const role = isRole(employee.role) ? employee.role : "";
  if (!role) {
    return {
      status: 403,
      body: { message: "Tu cuenta no tiene un rol asignado. Pide a un administrador que lo configure." },
    };
  }

  const email = authEmailForUsuario(usuario);
  await ensureEmailPasswordUser(email, password);
  return {
    status: 200,
    body: {
      email,
      role,
      name: employee.name || employee.displayName || usuario,
      employeeId: employee.id,
    },
  };
}

function clientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  return forwarded.split(",")[0].trim() || "local";
}

export async function POST(request) {
  try {
    const body = await request.json();
    const usuario = String(body.usuario || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!usuario || !password) {
      return NextResponse.json({ message: "Usuario y contraseña son obligatorios." }, { status: 400 });
    }

    const limit = rateLimit(`login:${clientIp(request)}:${usuario}`, 8, 10 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { message: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." },
        { status: 429 }
      );
    }

    if (!hasAdminCredentials()) {
      const result = await loginWithWebApi(usuario, password);
      return NextResponse.json(result.body, { status: result.status });
    }

    const db = getAdminDb();
    const snapshot = await db.collection("employees").where("usuario", "==", usuario).limit(1).get();
    if (snapshot.empty) {
      return NextResponse.json({ message: "Usuario o contraseña incorrectos." }, { status: 401 });
    }

    const employeeDoc = snapshot.docs[0];
    const employee = employeeDoc.data();
    const secretRef = db.collection("employeeSecrets").doc(employeeDoc.id);
    const secretSnap = await secretRef.get();
    let passwordHash = secretSnap.exists ? secretSnap.data()?.passwordHash : "";

    if (!passwordHash && employee.password) {
      const matchesLegacy = String(employee.password) === password;
      if (!matchesLegacy) {
        return NextResponse.json({ message: "Usuario o contraseña incorrectos." }, { status: 401 });
      }
      passwordHash = await hashPassword(password);
      await secretRef.set({
        passwordHash,
        updatedAt: FieldValue.serverTimestamp(),
      });
      await employeeDoc.ref.update({ password: FieldValue.delete() });
    }

    const valid = await verifyPassword(password, passwordHash);
    if (!valid) {
      return NextResponse.json({ message: "Usuario o contraseña incorrectos." }, { status: 401 });
    }

    if (employee.password) {
      await employeeDoc.ref.update({ password: FieldValue.delete() });
    }

    const role = isRole(employee.role) ? employee.role : "";
    if (!role) {
      return NextResponse.json(
        { message: "Tu cuenta no tiene un rol asignado. Pide a un administrador que lo configure." },
        { status: 403 }
      );
    }

    const name = employee.name || employee.displayName || usuario;
    const token = await getAdminAuth().createCustomToken(employeeDoc.id, {
      role,
      usuario,
      name,
      employeeId: employeeDoc.id,
    });

    return NextResponse.json({ token, role, email: authEmailForUsuario(usuario) });
  } catch (error) {
    console.error("Error en login:", error);
    if (error?.code === "WEAK_PASSWORD" || error?.code === "EMAIL_EXISTS") {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "No se pudo iniciar sesión." }, { status: 500 });
  }
}
