import { getAdminAuth } from "./firebaseAdmin";
import { isOfficeRole, isRole } from "./roles";

export async function readSession(request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    const role = decoded.role;
    if (!isRole(role)) return null;
    return {
      uid: decoded.uid,
      role,
      usuario: decoded.usuario || "",
      name: decoded.name || "",
      employeeId: decoded.employeeId || decoded.uid,
    };
  } catch {
    return null;
  }
}

export function requireSession(session) {
  if (!session) {
    return { ok: false, status: 401, message: "Sesión no válida." };
  }
  return { ok: true };
}

export function requireOffice(session) {
  const base = requireSession(session);
  if (!base.ok) return base;
  if (!isOfficeRole(session.role)) {
    return { ok: false, status: 403, message: "No tienes permiso para esta acción." };
  }
  return { ok: true };
}

export function requireAdmin(session) {
  const base = requireSession(session);
  if (!base.ok) return base;
  if (session.role !== "admin") {
    return { ok: false, status: 403, message: "Solo un administrador puede hacer esto." };
  }
  return { ok: true };
}
