import dotenv from "dotenv";
import { getAdminDb, getAdminBucket } from "../src/lib/firebaseAdmin.js";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ path: ".env", quiet: true });

const APPLY = process.argv.includes("--apply");
const EXTENSIONS = ["png", "jpg", "jpeg", "webp"];

function buildDownloadUrl(bucketName, path) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media`;
}

async function findExistingImage(bucket, modelId) {
  for (const ext of EXTENSIONS) {
    const path = `models/images/${modelId}.${ext}`;
    const [exists] = await bucket.file(path).exists();
    if (exists) {
      return { path, url: buildDownloadUrl(bucket.name, path) };
    }
  }
  return null;
}

async function main() {
  const db = getAdminDb();
  const bucket = getAdminBucket();
  const snap = await db.collection("models").get();

  console.log(`Modelos inspeccionados: ${snap.size}`);

  let alreadySet = 0;
  let resolved = 0;
  let missing = 0;
  let updated = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.imageUrl) {
      alreadySet += 1;
      continue;
    }

    const found = await findExistingImage(bucket, doc.id);
    if (!found) {
      missing += 1;
      console.log(`- ${doc.id}: sin imagen en Storage`);
      continue;
    }

    resolved += 1;
    console.log(`- ${doc.id}: ${found.path}`);
    if (APPLY) {
      await doc.ref.update({ imageUrl: found.url });
      updated += 1;
    }
  }

  console.log("");
  console.log(`Con imageUrl previo: ${alreadySet}`);
  console.log(`Resueltos en Storage: ${resolved}`);
  console.log(`Sin imagen: ${missing}`);
  console.log(`Total con imageUrl: ${alreadySet + resolved}`);

  if (APPLY) {
    console.log(`Actualizados: ${updated}`);
  } else {
    console.log("Dry run. Para aplicar: node --env-file=.env scripts/backfill-model-imageurl.mjs --apply");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
