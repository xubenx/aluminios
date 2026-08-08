import { evaluate } from "mathjs";

/**
 * Funciones personalizadas disponibles en fórmulas de modelos.
 * UP(x)   → redondea hacia arriba (ceil). Ej: UP(1.2) = 2
 * DOWN(x) → redondea hacia abajo (floor). Ej: DOWN(1.8) = 1
 */
const FORMULA_FUNCTIONS = {
  UP: (x) => Math.ceil(Number(x) || 0),
  DOWN: (x) => Math.floor(Number(x) || 0),
};

/**
 * Evalúa una fórmula de modelo con variables (ALTO, ANCHO, PRECIO, TRAMO, …)
 * y funciones UP / DOWN.
 */
export function evaluateFormula(formula, variables = {}) {
  if (formula == null || formula === "") return 0;

  try {
    const result = evaluate(String(formula), {
      ...FORMULA_FUNCTIONS,
      ...variables,
    });
    const numeric =
      typeof result === "number" ? result : parseFloat(result);
    return Number.isFinite(numeric) ? numeric : 0;
  } catch (error) {
    console.error("Error evaluating formula:", error);
    return 0;
  }
}

export const FORMULA_HELP_TEXT =
  "Variables: ALTO, ANCHO, PRECIO, TRAMO. Funciones: UP(x) redondea arriba, DOWN(x) redondea abajo. Ej: UP((ALTO+ANCHO)*2/TRAMO)*PRECIO";
