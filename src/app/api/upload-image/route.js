import { NextResponse } from "next/server";
import { readSession, requireOffice } from "../../../lib/apiAuth";
import { getAdminBucket } from "../../../lib/firebaseAdmin";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function safeModelId(value) {
  return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "");
}

function safeExtension(filename) {
  const raw = String(filename || "").split(".").pop() || "png";
  const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  return clean || "png";
}

export async function POST(request) {
  try {
    const session = await readSession(request);
    const gate = requireOffice(session);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.message }, { status: gate.status });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const modelId = safeModelId(formData.get("modelId"));

    if (!file || !modelId) {
      return NextResponse.json({ error: "File and modelId are required" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
    }

    const path = `models/images/${modelId}.${safeExtension(file.name)}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const bucket = getAdminBucket();
    await bucket.file(path).save(buffer, {
      metadata: { contentType: file.type },
      resumable: false,
    });

    const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media`;
    return NextResponse.json({
      message: "Image uploaded successfully to Firebase Storage",
      downloadURL,
      modelId,
    });
  } catch (error) {
    console.error("Error uploading image to Firebase Storage:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
