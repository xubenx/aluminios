import dotenv from "dotenv";
import { getAdminDb } from "../src/lib/firebaseAdmin.js";
import { sanitizeDrawing, dedupeDimensions } from "../src/utils/drawing.js";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ path: ".env", quiet: true });

const APPLY = process.argv.includes("--apply");

async function main() {
  const db = getAdminDb();
  const snap = await db.collection("models").get();
  let changed = 0;
  let removedTotal = 0;

  console.log(`Modelos inspeccionados: ${snap.size}`);

  for (const doc of snap.docs) {
    const drawing = doc.data().drawing;
    if (!drawing) continue;
    const clean = sanitizeDrawing(drawing);
    if (!clean) continue;
    const deduped = dedupeDimensions(clean.elements);
    const removed = clean.elements.length - deduped.length;
    if (removed <= 0) continue;

    changed += 1;
    removedTotal += removed;
    console.log(`- ${doc.id}: ${removed} cota(s) duplicada(s) eliminada(s)`);

    if (APPLY) {
      await doc.ref.update({ drawing: { ...clean, elements: deduped } });
    }
  }

  if (APPLY && changed > 0) {
    console.log(`\nMigracion aplicada. Modelos actualizados: ${changed}, cotas eliminadas: ${removedTotal}`);
  } else {
    console.log(`\nDry run. Modelos que cambiarian: ${changed}, cotas a eliminar: ${removedTotal}`);
    console.log("Para aplicar cambios: node scripts/dedupe-drawings.mjs --apply");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
