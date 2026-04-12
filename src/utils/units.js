export const CM_PER_METER = 100;
export const LEGACY_METERS_THRESHOLD = 10;
export const DEFAULT_DIMENSION_CM = 100;

export const toNumber = (value, fallback = 0) => {
  const num = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return Number.isFinite(num) ? num : fallback;
};

export const cmToMeters = (cm) => toNumber(cm) / CM_PER_METER;

export const m2FromCmDimensions = (heightCm, widthCm) => {
  return cmToMeters(heightCm) * cmToMeters(widthCm);
};

export const dimensionsCmToMeters = (dimensions) => ({
  heightInMeters: cmToMeters(dimensions?.height),
  widthInMeters: cmToMeters(dimensions?.width),
});

const shouldMigrateMetersToCm = (height, width, threshold = LEGACY_METERS_THRESHOLD) => {
  if (height <= 0 || width <= 0) return false;
  return height <= threshold && width <= threshold;
};

export const normalizeLegacyDimensionsToCm = (dimensions, threshold = LEGACY_METERS_THRESHOLD) => {
  if (!dimensions || typeof dimensions !== "object") return dimensions;

  const height = toNumber(dimensions.height, NaN);
  const width = toNumber(dimensions.width, NaN);

  if (!Number.isFinite(height) || !Number.isFinite(width)) return dimensions;

  if (dimensions.unit === "m" || shouldMigrateMetersToCm(height, width, threshold)) {
    return {
      ...dimensions,
      height: Math.round(height * CM_PER_METER * 100) / 100,
      width: Math.round(width * CM_PER_METER * 100) / 100,
      unit: "cm",
    };
  }

  return {
    ...dimensions,
    height,
    width,
    unit: dimensions.unit || "cm",
  };
};
