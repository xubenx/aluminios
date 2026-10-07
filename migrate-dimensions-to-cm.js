import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "./firebase.js";
import { normalizeLegacyDimensionsToCm } from "./src/utils/units.js";

const APPLY = process.argv.includes("--apply");

const normalizeProjectItems = (items = []) => {
  let changed = false;
  let changedItems = 0;

  const normalized = items.map((item) => {
    let next = item;
    let itemChanged = false;

    if (item?.dimensions) {
      const dims = normalizeLegacyDimensionsToCm(item.dimensions);
      if (
        dims.height !== item.dimensions.height ||
        dims.width !== item.dimensions.width ||
        (dims.unit || "cm") !== (item.dimensions.unit || "cm")
      ) {
        next = { ...next, dimensions: dims };
        changed = true;
        itemChanged = true;
      }
    }

    if (item?.itemData?.dimensions) {
      const dims = normalizeLegacyDimensionsToCm(item.itemData.dimensions);
      if (
        dims.height !== item.itemData.dimensions.height ||
        dims.width !== item.itemData.dimensions.width ||
        (dims.unit || "cm") !== (item.itemData.dimensions.unit || "cm")
      ) {
        next = {
          ...next,
          itemData: {
            ...item.itemData,
            dimensions: dims,
          },
        };
        changed = true;
        itemChanged = true;
      }
    }

    if (itemChanged) changedItems += 1;
    return next;
  });

  return { normalized, changed, changedItems };
};

async function migrateProjectDimensions() {
  const snapshot = await getDocs(collection(db, "projects"));
  const docs = snapshot.docs;
  let changedDocs = 0;
  let changedItemsTotal = 0;

  console.log(`Proyectos inspeccionados: ${docs.length}`);

  const batch = writeBatch(db);

  docs.forEach((projectDoc) => {
    const data = projectDoc.data();
    const { normalized, changed, changedItems } = normalizeProjectItems(data.items || []);
    if (!changed) return;

    changedDocs += 1;
    changedItemsTotal += changedItems;
    console.log(`- ${projectDoc.id}: ${changedItems} item(s) con dimensiones normalizadas`);

    if (APPLY) {
      batch.update(doc(db, "projects", projectDoc.id), {
        items: normalized,
      });
    }
  });

  if (APPLY && changedDocs > 0) {
    await batch.commit();
    console.log(`\nMigracion aplicada. Documentos actualizados: ${changedDocs}, items normalizados: ${changedItemsTotal}`);
  } else {
    console.log(`\nDry run. Documentos que cambiarian: ${changedDocs}, items a normalizar: ${changedItemsTotal}`);
    console.log("Para aplicar cambios: node migrate-dimensions-to-cm.js --apply");
  }
}

migrateProjectDimensions().catch((error) => {
  console.error("Error en migracion de dimensiones:", error);
  process.exit(1);
});
