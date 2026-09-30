import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { readSession, requireSession } from "../../../../lib/apiAuth";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { isOfficeRole, statusesForRole } from "../../../../lib/roles";

export async function POST(request) {
  const session = await readSession(request);
  const gate = requireSession(session);
  if (!gate.ok) {
    return NextResponse.json({ message: gate.message }, { status: gate.status });
  }

  const body = await request.json();
  const projectId = String(body.projectId || "");
  const itemIndex = Number(body.itemIndex);
  const status = String(body.status || "");
  const allowed = statusesForRole(session.role);

  if (!projectId || !Number.isInteger(itemIndex) || itemIndex < 0) {
    return NextResponse.json({ message: "Datos de la pieza incompletos." }, { status: 400 });
  }
  if (!allowed.includes(status)) {
    return NextResponse.json({ message: "Ese estado no está permitido para tu rol." }, { status: 403 });
  }

  const projectRef = getAdminDb().collection("projects").doc(projectId);
  const projectSnap = await projectRef.get();
  if (!projectSnap.exists) {
    return NextResponse.json({ message: "Proyecto no encontrado." }, { status: 404 });
  }

  const items = Array.isArray(projectSnap.data().items) ? [...projectSnap.data().items] : [];
  const item = items[itemIndex];
  if (!item) {
    return NextResponse.json({ message: "Pieza no encontrada." }, { status: 404 });
  }

  if (!isOfficeRole(session.role) && item.assignedEmployeeId !== session.employeeId) {
    return NextResponse.json(
      { message: "Solo puedes actualizar las piezas que tienes asignadas." },
      { status: 403 }
    );
  }

  items[itemIndex] = {
    ...item,
    status,
    statusUpdatedAt: new Date().toISOString(),
    statusUpdatedBy: session.employeeId,
  };

  await projectRef.update({
    items,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true, status });
}
