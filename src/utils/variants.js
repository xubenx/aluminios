/**
 * Equivalencias de modelos entre lineas (colecciones).
 *
 * Un mismo producto (ej. "Corrediza 2 hojas") puede existir en varias lineas
 * ("Linea 2", "Linea 3"). Los modelos que comparten el mismo `variantKey`
 * se consideran el mismo producto en distintas lineas.
 *
 * La linea de cada modelo se deriva de las colecciones (`modelCollections`),
 * que guardan `modelIds`.
 */

let counter = 0;
export const makeVariantKey = () => {
  counter += 1;
  return `var_${Date.now().toString(36)}_${counter}`;
};

/** Devuelve el modelo agrupado por variantKey -> [modelos]. */
export const groupModelsByVariant = (models = [], { includeSingletons = false } = {}) => {
  const groups = new Map();
  models.forEach((model) => {
    const key = model?.variantKey;
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(model);
  });
  if (includeSingletons) return groups;
  // Solo grupos con mas de un modelo tienen equivalencia real.
  const filtered = new Map();
  groups.forEach((list, key) => {
    if (list.length > 1) filtered.set(key, list);
  });
  return filtered;
};

/** Mapa modelId -> variantKey (solo modelos con clave). */
export const buildModelVariantIndex = (models = []) => {
  const index = new Map();
  models.forEach((m) => {
    if (m?.variantKey) index.set(m.id, m.variantKey);
  });
  return index;
};

/**
 * Mapa variantKey -> { [collectionId]: model }.
 * Sirve para, dado un modelo, encontrar su equivalente en otra linea.
 */
export const buildVariantMap = (models = [], collections = []) => {
  const collectionByModel = new Map();
  collections.forEach((col) => {
    (col.modelIds || []).forEach((id) => {
      if (!collectionByModel.has(id)) collectionByModel.set(id, col.id);
    });
  });

  const map = new Map();
  models.forEach((model) => {
    const key = model?.variantKey;
    if (!key) return;
    if (!map.has(key)) map.set(key, { key, byCollection: {}, models: [] });
    const entry = map.get(key);
    entry.models.push(model);
    const collectionId = collectionByModel.get(model.id);
    if (collectionId && !entry.byCollection[collectionId]) {
      entry.byCollection[collectionId] = model;
    }
  });
  return map;
};

/** Dado un modelo, devuelve las lineas (colecciones) donde tiene equivalente. */
export const getModelLines = (model, models, collections) => {
  const key = model?.variantKey;
  if (!key) return [];
  const variantMap = buildVariantMap(models, collections);
  const entry = variantMap.get(key);
  if (!entry) return [];
  const colById = new Map(collections.map((c) => [c.id, c]));
  return Object.entries(entry.byCollection).map(([collectionId, variantModel]) => ({
    collectionId,
    collectionName: colById.get(collectionId)?.name || "Sin linea",
    model: variantModel,
  }));
};

/**
 * Asigna un variantKey a un conjunto de modelos. Reutiliza la clave existente
 * si alguno ya la tiene para no separar grupos ya enlazados.
 */
export const resolveVariantKey = (models = []) => {
  const existing = models.map((m) => m?.variantKey).find(Boolean);
  return existing || makeVariantKey();
};

export const buildCollectionByModel = (collections = []) => {
  const map = new Map();
  collections.forEach((col) => {
    (col.modelIds || []).forEach((id) => {
      if (!map.has(id)) map.set(id, col.id);
    });
  });
  return map;
};

export const buildCollectionMap = (collections = []) =>
  new Map(collections.map((c) => [c.id, c]));
