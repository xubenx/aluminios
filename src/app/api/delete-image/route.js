import { NextResponse } from "next/server";
import { readSession, requireOffice } from "../../../lib/apiAuth";
import { getAdminBucket } from "../../../lib/firebaseAdmin";

function safeModelId(value) {
  return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "");
}

export async function DELETE(request) {
  try {
    const session = await readSession(request);
    const gate = requireOffice(session);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.message }, { status: gate.status });
    }

    const { searchParams } = new URL(request.url);
    const modelId = safeModelId(searchParams.get("modelId"));
    if (!modelId) {
      return NextResponse.json({ error: "ModelId is required" }, { status: 400 });
    }

    const bucket = getAdminBucket();
    const [files] = await bucket.getFiles({ prefix: `models/images/${modelId}.` });
    if (!files.length) {
      return NextResponse.json({ message: "Image not found in Firebase Storage", modelId }, { status: 404 });
    }

    await Promise.all(files.map((file) => file.delete()));
    return NextResponse.json({
      message: "Image deleted successfully from Firebase Storage",
      modelId,
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
