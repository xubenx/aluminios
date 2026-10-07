/**
 * Studio de dibujo tecnico 2D.
 *
 * Un "drawing" es la plantilla vectorial de un modelo. Se guarda como JSON
 * pequeno dentro del documento `models`, no como imagen. Las posiciones de las
 * anotaciones y divisiones se guardan como fracciones (0..1) para que escalen
 * con las medidas; los espesores y tamanos se guardan en cm para que no escalen.
 *
 * Todas las coordenadas de salida de las funciones de geometria estan en cm,
 * de modo que el renderer puede usar un <svg viewBox="0 0 W H"> directo.
 */

export const DRAWING_VERSION = 1;
export const DEFAULT_PROFILE_CM = 5;
export const DEFAULT_ARC_RISE = 0.2;

export const ELEMENT_TYPES = ["divider", "bars", "hinge", "text", "arrow", "dimension"];
export const SHAPES = ["rect", "arch"];

const num = (value, fallback = 0) => {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : fallback;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

let idCounter = 0;
export const makeElementId = (prefix = "el") => {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
};

export const createEmptyDrawing = (widthCm = 100, heightCm = 100) => ({
  version: DRAWING_VERSION,
  baseDimension: {
    height: num(heightCm, 100),
    width: num(widthCm, 100),
    unit: "cm",
  },
  profile: DEFAULT_PROFILE_CM,
  shape: "rect",
  arcRise: DEFAULT_ARC_RISE,
  // Opciones que se eligen en cada medicion / pieza
  viewSide: "inside", // inside = vista dentro, outside = vista fuera, none = no aplica
  opensTo: "inside", // inside = abre dentro, outside = abre fuera, none = no aplica
  screen: false, // mosquitero (rejilla #)
  screenPanels: [], // indices de paneles con mosquitero; vacio = todos
  elements: [],
});

export const hasDrawing = (drawing) =>
  !!drawing && Array.isArray(drawing.elements);

const sanitizeElement = (el) => {
  if (!el || typeof el !== "object") return null;
  switch (el.type) {
    case "divider": {
      const from = clamp(num(el.from, 0), 0, 1);
      const to = clamp(num(el.to, 1), 0, 1);
      return {
        id: el.id || makeElementId("div"),
        type: "divider",
        axis: el.axis === "h" ? "h" : "v",
        position: clamp(num(el.position, 0.5), 0, 1),
        // Extension a lo largo de la division (0..1). Por defecto cruza todo el claro.
        from: Math.min(from, to),
        to: Math.max(from, to),
      };
    }
    case "bars":
      return {
        id: el.id || makeElementId("bars"),
        type: "bars",
        axis: el.axis === "h" ? "h" : "v",
        count: clamp(Math.round(num(el.count, 3)), 1, 60),
        panel: Math.max(0, Math.round(num(el.panel, 0))),
      };
    case "hinge":
      return {
        id: el.id || makeElementId("hinge"),
        type: "hinge",
        panel: Math.max(0, Math.round(num(el.panel, 0))),
        side: ["left", "right", "top", "bottom"].includes(el.side) ? el.side : "left",
        direction: el.direction === "out" ? "out" : "in",
      };
    case "text":
      return {
        id: el.id || makeElementId("txt"),
        type: "text",
        x: clamp(num(el.x, 0.5), -0.5, 1.5),
        y: clamp(num(el.y, 0.5), -0.5, 1.5),
        text: String(el.text ?? "Texto"),
        size: clamp(num(el.size, 6), 1, 100),
        // Interlineado y ancho del cuadro de texto (0 = sin ajuste de linea)
        lineGap: clamp(num(el.lineGap, 1.3), 0.8, 3),
        boxWidth: clamp(num(el.boxWidth, 0), 0, 1),
        // Texto "en vivo": si es "width"/"height" el valor mostrado se resuelve
        // con las medidas reales en cada render (no se congela el numero).
        auto: el.auto === "width" || el.auto === "height" ? el.auto : null,
      };
    case "arrow":
      return {
        id: el.id || makeElementId("arrow"),
        type: "arrow",
        x1: clamp(num(el.x1, 0.2), -0.5, 1.5),
        y1: clamp(num(el.y1, 0.2), -0.5, 1.5),
        x2: clamp(num(el.x2, 0.8), -0.5, 1.5),
        y2: clamp(num(el.y2, 0.2), -0.5, 1.5),
      };
    case "dimension": {
      const rawValue = el.value;
      const hasCoords =
        el.x1 != null || el.y1 != null || el.x2 != null || el.y2 != null;
      let x1;
      let y1;
      let x2;
      let y2;
      if (hasCoords) {
        x1 = clamp(num(el.x1, 0), -0.5, 1.5);
        y1 = clamp(num(el.y1, 0), -0.5, 1.5);
        x2 = clamp(num(el.x2, 1), -0.5, 1.5);
        y2 = clamp(num(el.y2, 0), -0.5, 1.5);
      } else if (el.axis === "v") {
        // Compatibilidad con cotas antiguas de eje
        x1 = x2 = -0.06;
        y1 = 0;
        y2 = 1;
      } else {
        y1 = y2 = 1.06;
        x1 = 0;
        x2 = 1;
      }
      return {
        id: el.id || makeElementId("dim"),
        type: "dimension",
        // Cota libre: va de un punto (x1,y1) a otro (x2,y2), en fracciones del claro.
        x1,
        y1,
        x2,
        y2,
        // Valor mostrado opcional: si se define, se muestra en lugar de la distancia
        // (ajuste por milimetros sin alterar formula ni tamano).
        value: rawValue == null || rawValue === "" ? "" : String(rawValue),
        size: clamp(num(el.size, 0), 0, 60),
      };
    }
    default:
      return null;
  }
};

export const sanitizeDrawing = (drawing) => {
  if (!drawing || typeof drawing !== "object") return null;
  const base = drawing.baseDimension || {};
  return {
    version: DRAWING_VERSION,
    baseDimension: {
      height: num(base.height, 100),
      width: num(base.width, 100),
      unit: "cm",
    },
    profile: clamp(num(drawing.profile, DEFAULT_PROFILE_CM), 0, 100),
    shape: drawing.shape === "arch" ? "arch" : "rect",
    arcRise: clamp(num(drawing.arcRise, DEFAULT_ARC_RISE), 0, 0.5),
    viewSide: ["inside", "outside", "none"].includes(drawing.viewSide) ? drawing.viewSide : "inside",
    opensTo: ["inside", "outside", "none"].includes(drawing.opensTo) ? drawing.opensTo : "inside",
    screen: Boolean(drawing.screen),
    screenPanels: Array.isArray(drawing.screenPanels)
      ? [...new Set(drawing.screenPanels.map((v) => Math.max(0, Math.round(num(v, 0)))))]
      : [],
    elements: Array.isArray(drawing.elements)
      ? drawing.elements.map(sanitizeElement).filter(Boolean)
      : [],
  };
};

/** Altura de la curva (sagita) en cm para una forma en arco. */
export const computeRise = (drawing, widthCm, heightCm) => {
  const height = num(heightCm, num(drawing?.baseDimension?.height, 100)) || 1;
  const frac = clamp(num(drawing?.arcRise, DEFAULT_ARC_RISE), 0, 0.5);
  return frac * height;
};

export const isArch = (drawing) => drawing?.shape === "arch";

/** Contorno exterior del dibujo (marco) como path SVG en cm. */
export const buildOuterPath = (drawing, widthCm, heightCm) => {
  const W = num(widthCm, num(drawing?.baseDimension?.width, 100)) || 1;
  const H = num(heightCm, num(drawing?.baseDimension?.height, 100)) || 1;
  const rise = isArch(drawing) ? computeRise(drawing, W, H) : 0;
  if (rise <= 0.1) return `M 0 0 H ${W} V ${H} H 0 Z`;
  return `M 0 ${rise} A ${W / 2} ${rise} 0 0 1 ${W} ${rise} V ${H} H 0 Z`;
};

/** Contorno interior del dibujo (claro) como path SVG en cm. */
export const buildInnerPath = (drawing, widthCm, heightCm) => {
  const W = num(widthCm, num(drawing?.baseDimension?.width, 100)) || 1;
  const H = num(heightCm, num(drawing?.baseDimension?.height, 100)) || 1;
  const p = clamp(num(drawing?.profile, DEFAULT_PROFILE_CM), 0, Math.min(W, H) / 2);
  const rise = isArch(drawing) ? computeRise(drawing, W, H) : 0;
  const left = p;
  const right = Math.max(W - p, left + 0.1);
  const bottom = Math.max(H - p, p + 0.1);
  if (rise <= 0.1) {
    return `M ${left} ${p} H ${right} V ${bottom} H ${left} Z`;
  }
  const rx = Math.max(W / 2 - p, 0.1);
  const ry = Math.max(rise - p, 0.1);
  const spring = Math.min(rise, bottom);
  return `M ${left} ${spring} A ${rx} ${ry} 0 0 1 ${right} ${spring} V ${bottom} H ${left} Z`;
};

/** Una division cruza todo el claro si su extension es 0..1. */
export const isFullSpanDivider = (el) => {
  const from = num(el?.from, 0);
  const to = num(el?.to, 1);
  return from <= 0.001 && to >= 0.999;
};

/**
 * Devuelve la linea (en cm) que representa una division dentro del claro,
 * respetando su extension (from..to a lo largo del eje).
 */
export const computeDividerLine = (el, widthCm, heightCm, profileCm) => {
  const W = num(widthCm, 0);
  const H = num(heightCm, 0);
  const p = clamp(num(profileCm, 0), 0, Math.min(W, H) / 2);
  const x0 = p;
  const y0 = p;
  const innerW = Math.max(W - 2 * p, 0);
  const innerH = Math.max(H - 2 * p, 0);
  const from = clamp(num(el?.from, 0), 0, 1);
  const to = clamp(num(el?.to, 1), 0, 1);
  if (el?.axis === "h") {
    const y = y0 + innerH * clamp(num(el?.position, 0.5), 0, 1);
    return {
      x1: x0 + innerW * from,
      y1: y,
      x2: x0 + innerW * to,
      y2: y,
    };
  }
  const x = x0 + innerW * clamp(num(el?.position, 0.5), 0, 1);
  return {
    x1: x,
    y1: y0 + innerH * from,
    x2: x,
    y2: y0 + innerH * to,
  };
};

/**
 * Divide el claro interior (descontando el marco) usando las divisiones
 * verticales/horizontales. Devuelve los paneles en cm, en orden fila a fila.
 */
export const computePanels = (drawing, widthCm, heightCm) => {
  const d = drawing || {};
  const width = num(widthCm, num(d.baseDimension?.width, 100)) || 1;
  const height = num(heightCm, num(d.baseDimension?.height, 100)) || 1;
  const profile = clamp(num(d.profile, DEFAULT_PROFILE_CM), 0, Math.min(width, height) / 2);
  const x0 = profile;
  const y0 = profile;
  const innerW = Math.max(width - 2 * profile, 0);
  const innerH = Math.max(height - 2 * profile, 0);

  const elements = Array.isArray(d.elements) ? d.elements : [];
  // Solo las divisiones que cruzan todo el claro generan paneles; las parciales
  // se dibujan como lineas dentro de la seccion, sin dividir la rejilla.
  const vDivs = elements
    .filter((e) => e.type === "divider" && e.axis === "v" && isFullSpanDivider(e))
    .map((e) => clamp(num(e.position, 0.5), 0, 1))
    .sort((a, b) => a - b);
  const hDivs = elements
    .filter((e) => e.type === "divider" && e.axis === "h" && isFullSpanDivider(e))
    .map((e) => clamp(num(e.position, 0.5), 0, 1))
    .sort((a, b) => a - b);

  const xs = [0, ...vDivs, 1];
  const ys = [0, ...hDivs, 1];

  const panels = [];
  let index = 0;
  for (let row = 0; row < ys.length - 1; row += 1) {
    for (let col = 0; col < xs.length - 1; col += 1) {
      panels.push({
        index,
        row,
        col,
        x: x0 + xs[col] * innerW,
        y: y0 + ys[row] * innerH,
        w: (xs[col + 1] - xs[col]) * innerW,
        h: (ys[row + 1] - ys[row]) * innerH,
      });
      index += 1;
    }
  }
  return panels;
};

export const getPanelByIndex = (panels, index) =>
  (panels || []).find((p) => p.index === index) || panels?.[0] || null;

/** Devuelve las lineas de barrotes (cm) dentro de un panel. */
export const computeBars = (element, panel) => {
  if (!panel || !element) return [];
  const count = clamp(Math.round(num(element.count, 3)), 1, 60);
  const lines = [];
  if (element.axis === "h") {
    for (let k = 1; k <= count; k += 1) {
      const y = panel.y + (panel.h * k) / (count + 1);
      lines.push({ x1: panel.x, y1: y, x2: panel.x + panel.w, y2: y });
    }
  } else {
    for (let k = 1; k <= count; k += 1) {
      const x = panel.x + (panel.w * k) / (count + 1);
      lines.push({ x1: x, y1: panel.y, x2: x, y2: panel.y + panel.h });
    }
  }
  return lines;
};

/** Simbolo de apertura de hoja (dos lineas + arco) para un panel. */
export const computeHinge = (element, panel) => {
  if (!panel || !element) return null;
  const r = Math.min(panel.w, panel.h) * 0.6;
  const { x, y, w, h } = panel;
  let pivot;
  let p1;
  let p2;
  switch (element.side) {
    case "right":
      pivot = { x: x + w, y: y + h };
      p1 = { x: x + w, y: y + h - r };
      p2 = { x: x + w - r, y: y + h };
      break;
    case "top":
      pivot = { x, y };
      p1 = { x: x + r, y };
      p2 = { x, y: y + r };
      break;
    case "bottom":
      pivot = { x: x + w, y: y + h };
      p1 = { x: x + w - r, y: y + h };
      p2 = { x: x + w, y: y + h - r };
      break;
    case "left":
    default:
      pivot = { x, y: y + h };
      p1 = { x, y: y + h - r };
      p2 = { x: x + r, y: y + h };
      break;
  }
  const sweep = element.direction === "out" ? 0 : 1;
  return {
    pivot,
    p1,
    p2,
    r,
    path: `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 ${sweep} ${p2.x} ${p2.y}`,
  };
};

/** Formatea una cota en cm sin decimales innecesarios. */
export const formatCota = (value) => {
  const n = num(value, 0);
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
};

/** Etiqueta de una cota: agrega " cm" cuando el valor es numerico. */
export const dimensionLabel = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return /^-?[0-9]+(\.[0-9]+)?$/.test(text) ? `${text} cm` : text;
};

/**
 * Texto mostrado por un elemento `text`. Si el elemento es "en vivo"
 * (auto = "width"/"height") se resuelve con las medidas reales actuales,
 * de modo que el valor se actualiza solo cuando cambian W/H. Para textos
 * normales (auto ausente) devuelve el texto guardado.
 */
export const resolveTextValue = (element, widthCm, heightCm) => {
  if (element?.auto === "width") return dimensionLabel(formatCota(widthCm));
  if (element?.auto === "height") return dimensionLabel(formatCota(heightCm));
  return String(element?.text ?? "");
};

/** Distancia en cm entre los dos puntos de una cota libre. */
export const cotaDistanceCm = (element, widthCm, heightCm) => {
  const dx = (num(element?.x2, 0) - num(element?.x1, 0)) * num(widthCm, 0);
  const dy = (num(element?.y2, 0) - num(element?.y1, 0)) * num(heightCm, 0);
  return Math.sqrt(dx * dx + dy * dy);
};

/** Angulos permitidos para las cotas (rectas o a 30/45 grados). */
export const DIMENSION_ANGLES = [0, 30, 45, 90, 135, 150, 180, -150, -135, -90, -45, -30];

/**
 * Ajusta el segundo punto de una cota al angulo permitido mas cercano,
 * conservando la distancia. Con esto las cotas salen rectas por defecto.
 */
export const snapDimensionPoint = (
  x1,
  y1,
  x2,
  y2,
  widthCm,
  heightCm,
  candidates = DIMENSION_ANGLES
) => {
  const W = num(widthCm, 1) || 1;
  const H = num(heightCm, 1) || 1;
  const dx = (num(x2, 0) - num(x1, 0)) * W;
  const dy = (num(y2, 0) - num(y1, 0)) * H;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (!len) return { x: num(x2, 0), y: num(y2, 0) };
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  let best = candidates[0];
  let bestDiff = Infinity;
  for (const c of candidates) {
    const diff = Math.abs((((angle - c) % 360) + 540) % 360 - 180);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = c;
    }
  }
  const rad = (best * Math.PI) / 180;
  return {
    x: num(x1, 0) + (Math.cos(rad) * len) / W,
    y: num(y1, 0) + (Math.sin(rad) * len) / H,
  };
};

/** Crea las dos cotas por defecto (ancho abajo, alto a la izquierda). */
export const createDefaultDimensions = () => [
  { id: makeElementId("dim"), type: "dimension", x1: 0, y1: 1.06, x2: 1, y2: 1.06, value: "", size: 0 },
  { id: makeElementId("dim"), type: "dimension", x1: -0.06, y1: 0, x2: -0.06, y2: 1, value: "", size: 0 },
];

/**
 * Elimina cotas duplicadas que comparten exactamente los mismos extremos
 * (p. ej. varias cotas antiguas de eje que al migrarse quedan superpuestas).
 * Conserva el orden y prefiere la copia que tenga un valor definido.
 */
export const dedupeDimensions = (elements = []) => {
  const keyOf = (e) =>
    [e.x1, e.y1, e.x2, e.y2]
      .map((v) => Math.round(num(v, 0) * 10000) / 10000)
      .join(",");
  const chosen = new Map();
  for (const e of elements) {
    if (e.type !== "dimension") continue;
    const key = keyOf(e);
    const existing = chosen.get(key);
    if (!existing || ((!existing.value || existing.value === "") && e.value)) {
      chosen.set(key, e);
    }
  }
  const seen = new Set();
  const out = [];
  for (const e of elements) {
    if (e.type !== "dimension") {
      out.push(e);
      continue;
    }
    const key = keyOf(e);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(chosen.get(key));
  }
  return out;
};

/**
 * Asegura que un dibujo tenga cotas editables y sin duplicados: migra el
 * formato antiguo, elimina cotas superpuestas y, si no queda ninguna, agrega
 * las dos por defecto para que se puedan editar.
 */
export const ensureDimensionElements = (drawing) => {
  const d = sanitizeDrawing(drawing);
  if (!d) return d;
  let elements = dedupeDimensions(d.elements);
  if (!elements.some((e) => e.type === "dimension")) {
    elements = [...elements, ...createDefaultDimensions()];
  }
  return { ...d, elements };
};

/**
 * Valor mostrado por una cota: prioriza el override transitorio de la vista,
 * luego el valor guardado en el elemento y por ultimo la medida real.
 */
export const resolveDimensionValue = (element, autoValue, valueOverrides) => {
  const override = valueOverrides?.[element?.id];
  if (override != null && override !== "") return String(override);
  if (element?.value != null && element.value !== "") return String(element.value);
  return formatCota(autoValue);
};

/**
 * Caja de dibujo (viewBox) que incluye el marco y todas las anotaciones,
 * de modo que el texto y las cotas puedan quedar fuera del contorno sin recortarse.
 */
export const computeViewBox = (drawing, widthCm, heightCm, valueOverrides) => {
  const d = drawing || {};
  const W = num(widthCm, num(d.baseDimension?.width, 100)) || 1;
  const H = num(heightCm, num(d.baseDimension?.height, 100)) || 1;
  const base = Math.max(10, Math.max(W, H) * 0.1);
  let minX = -base;
  let minY = -base;
  let maxX = W + base;
  let maxY = H + base;

  const pad = (x, y, p = 0) => {
    minX = Math.min(minX, x - p);
    minY = Math.min(minY, y - p);
    maxX = Math.max(maxX, x + p);
    maxY = Math.max(maxY, y + p);
  };

  (d.elements || []).forEach((e) => {
    if (e.type === "text") {
      const size = num(e.size, 6);
      const width = resolveTextValue(e, W, H).length * size * 0.65;
      const cx = e.x * W;
      const cy = e.y * H;
      // El texto se ancla a la izquierda y se dibuja sobre la linea base.
      minX = Math.min(minX, cx - size);
      minY = Math.min(minY, cy - size);
      maxX = Math.max(maxX, cx + width + size);
      maxY = Math.max(maxY, cy + size * 0.3);
    } else if (e.type === "arrow") {
      pad(e.x1 * W, e.y1 * H, 2);
      pad(e.x2 * W, e.y2 * H, 2);
    } else if (e.type === "dimension") {
      const size = num(e.size, 0) || Math.max(4, base * 0.34);
      const ax = e.x1 * W;
      const ay = e.y1 * H;
      const bx = e.x2 * W;
      const by = e.y2 * H;
      const labelLen = dimensionLabel(
        resolveDimensionValue(e, cotaDistanceCm(e, W, H), valueOverrides)
      ).length;
      const labelPad = (labelLen * size * 0.65) / 2;
      pad(ax, ay, size + 2);
      pad(bx, by, size + 2);
      pad((ax + bx) / 2, (ay + by) / 2, Math.max(size, labelPad));
    }
  });

  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
};

/** Convierte un punto del espacio SVG (cm) a un objeto {x,y} en cm. */
export const svgPointToCm = (svgEl, clientX, clientY) => {
  if (!svgEl) return { x: 0, y: 0 };
  const rect = svgEl.getBoundingClientRect();
  const viewBox = svgEl.viewBox?.baseVal;
  if (!viewBox || !rect.width || !rect.height) return { x: 0, y: 0 };
  const scaleX = viewBox.width / rect.width;
  const scaleY = viewBox.height / rect.height;
  return {
    x: viewBox.x + (clientX - rect.left) * scaleX,
    y: viewBox.y + (clientY - rect.top) * scaleY,
  };
};
