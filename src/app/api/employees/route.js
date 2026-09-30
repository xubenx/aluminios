import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { readSession, requireAdmin } from "../../../lib/apiAuth";
import { getAdminDb } from "../../../lib/firebaseAdmin";
import { hashPassword } from "../../../lib/password";
import { isRole } from "../../../lib/roles";

const USUARIO_PATTERN = /^[a-z0-9._-]{3,32}$/;

function publicEmployee(id, data) {
  return {
    id,
    name: data.name || "",
    usuario: data.usuario || "",
    role: isRole(data.role) ? data.role : "",
  };
}

async function adminCount(db, exceptId) {
  const snapshot = await db.collection("employees").where("role", "==", "admin").get();
  return snapshot.docs.filter((doc) => doc.id !== exceptId).length;
}

export async function GET(request) {
  const session = await readSession(request);
  const gate = requireAdmin(session);
  if (!gate.ok) {
    return NextResponse.json({ message: gate.message }, { status: gate.status });
  }

  const snapshot = await getAdminDb().collection("employees").get();
  const employees = snapshot.docs
    .map((doc) => publicEmployee(doc.id, doc.data()))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  return NextResponse.json({ employees });
}

export async function POST(request) {
  const session = await readSession(request);
  const gate = requireAdmin(session);
  if (!gate.ok) {
    return NextResponse.json({ message: gate.message }, { status: gate.status });
  }

  const body = await request.json();
  const name = String(body.name || "").trim();
  const usuario = String(body.usuario || "").trim().toLowerCase();
  const password = String(body.password || "");
  const role = body.role;

  if (!name || name.length > 80) {
    return NextResponse.json({ message: "El nombre es obligatorio." }, { status: 400 });
  }
  if (!USUARIO_PATTERN.test(usuario)) {
    return NextResponse.json(
      { message: "El usuario debe tener de 3 a 32 caracteres: letras, números, punto, guion o guion bajo." },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json({ message: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
  }
  if (!isRole(role)) {
    return NextResponse.json({ message: "Selecciona un rol válido." }, { status: 400 });
  }

  const db = getAdminDb();
  const existing = await db.collection("employees").where("usuario", "==", usuario).limit(1).get();
  if (!existing.empty) {
    return NextResponse.json({ message: "Ese usuario ya existe." }, { status: 409 });
  }

  const employeeRef = db.collection("employees").doc();
  const passwordHash = await hashPassword(password);
  await employeeRef.set({
    name,
    usuario,
    role,
    createdAt: FieldValue.serverTimestamp(),
  });
  await db.collection("employeeSecrets").doc(employeeRef.id).set({
    passwordHash,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ employee: publicEmployee(employeeRef.id, { name, usuario, role }) });
}

export async function PATCH(request) {
  const session = await readSession(request);
  const gate = requireAdmin(session);
  if (!gate.ok) {
    return NextResponse.json({ message: gate.message }, { status: gate.status });
  }

  const body = await request.json();
  const id = String(body.id || "");
  const name = String(body.name || "").trim();
  const usuario = String(body.usuario || "").trim().toLowerCase();
  const password = body.password ? String(body.password) : "";
  const role = body.role;

  if (!id || !name || name.length > 80) {
    return NextResponse.json({ message: "Nombre y empleado son obligatorios." }, { status: 400 });
  }
  if (!USUARIO_PATTERN.test(usuario)) {
    return NextResponse.json({ message: "El usuario no tiene un formato válido." }, { status: 400 });
  }
  if (!isRole(role)) {
    return NextResponse.json({ message: "Selecciona un rol válido." }, { status: 400 });
  }
  if (password && password.length < 6) {
    return NextResponse.json({ message: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
  }

  const db = getAdminDb();
  const employeeRef = db.collection("employees").doc(id);
  const currentSnap = await employeeRef.get();
  if (!currentSnap.exists) {
    return NextResponse.json({ message: "Empleado no encontrado." }, { status: 404 });
  }

  const duplicate = await db.collection("employees").where("usuario", "==", usuario).limit(1).get();
  if (!duplicate.empty && duplicate.docs[0].id !== id) {
    return NextResponse.json({ message: "Ese usuario ya existe." }, { status: 409 });
  }

  if (currentSnap.data().role === "admin" && role !== "admin") {
    const remaining = await adminCount(db, id);
    if (remaining < 1) {
      return NextResponse.json(
        { message: "Debe quedar al menos un administrador." },
        { status: 400 }
      );
    }
  }

  await employeeRef.update({
    name,
    usuario,
    role,
    password: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (password) {
    await db.collection("employeeSecrets").doc(id).set({
      passwordHash: await hashPassword(password),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return NextResponse.json({ employee: publicEmployee(id, { name, usuario, role }) });
}

export async function DELETE(request) {
  const session = await readSession(request);
  const gate = requireAdmin(session);
  if (!gate.ok) {
    return NextResponse.json({ message: gate.message }, { status: gate.status });
  }

  const body = await request.json();
  const id = String(body.id || "");
  if (!id) {
    return NextResponse.json({ message: "Falta el empleado." }, { status: 400 });
  }
  if (id === session.employeeId) {
    return NextResponse.json({ message: "No puedes eliminar tu propia cuenta." }, { status: 400 });
  }

  const db = getAdminDb();
  const employeeRef = db.collection("employees").doc(id);
  const currentSnap = await employeeRef.get();
  if (!currentSnap.exists) {
    return NextResponse.json({ message: "Empleado no encontrado." }, { status: 404 });
  }
  if (currentSnap.data().role === "admin") {
    const remaining = await adminCount(db, id);
    if (remaining < 1) {
      return NextResponse.json(
        { message: "Debe quedar al menos un administrador." },
        { status: 400 }
      );
    }
  }

  await employeeRef.delete();
  await db.collection("employeeSecrets").doc(id).delete();
  return NextResponse.json({ ok: true });
}
