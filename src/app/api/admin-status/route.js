import { NextResponse } from "next/server";
import { describeAdminCredentials, getAdminApp, getAdminDb, getAdminAuth } from "../../../lib/firebaseAdmin";

// Endpoint de diagnostico (solo lectura, no expone secretos).
// Uso: GET /api/admin-status
export async function GET() {
  const result = { credentials: describeAdminCredentials() };

  try {
    const app = getAdminApp();
    result.init = { ok: true, projectId: app.options.projectId || null };
  } catch (error) {
    result.init = { ok: false, error: String(error?.message || error) };
    return NextResponse.json(result, { status: 200 });
  }

  try {
    const snap = await getAdminDb().collection("employees").limit(1).get();
    result.firestore = { ok: true, employeesReadable: snap.size };
  } catch (error) {
    result.firestore = { ok: false, error: String(error?.message || error) };
  }

  try {
    const token = await getAdminAuth().createCustomToken("diagnostic-uid", { diagnostic: true });
    result.customToken = { ok: typeof token === "string" && token.length > 20 };
  } catch (error) {
    result.customToken = { ok: false, error: String(error?.message || error) };
  }

  return NextResponse.json(result, { status: 200 });
}
