export const ROLES = ["admin", "auxiliar", "colaborador"];

export const ROLE_LABELS = {
  admin: "Administrador",
  auxiliar: "Auxiliar",
  colaborador: "Colaborador",
};

/**
 * admin: todo, incluidos colaboradores, borrados y pagos.
 * auxiliar: oficina. Cotiza, clientes, proyectos, diario, catálogo y órdenes.
 *   No administra cuentas ni roles.
 * colaborador: taller. Solo sus órdenes y el estado de sus piezas.
 */
const ROUTE_RULES = [
  { prefix: "/sistema/colaboradores", roles: ["admin"] },
  { prefix: "/sistema/diario", roles: ["admin", "auxiliar"] },
  { prefix: "/sistema/clientes", roles: ["admin", "auxiliar"] },
  { prefix: "/sistema/presupuestos", roles: ["admin", "auxiliar"] },
  { prefix: "/sistema/proyectos", roles: ["admin", "auxiliar"] },
  { prefix: "/sistema/recordatorios", roles: ["admin", "auxiliar"] },
  { prefix: "/sistema/calculadora-vidrios", roles: ["admin", "auxiliar"] },
  { prefix: "/sistema/modelos", roles: ["admin", "auxiliar"] },
  { prefix: "/sistema/colecciones", roles: ["admin", "auxiliar"] },
  { prefix: "/sistema/colecciones-materiales", roles: ["admin", "auxiliar"] },
  { prefix: "/sistema/materiales", roles: ["admin", "auxiliar"] },
  { prefix: "/sistema/colores", roles: ["admin", "auxiliar"] },
  { prefix: "/sistema/herrajes", roles: ["admin", "auxiliar"] },
  { prefix: "/sistema/vidrios", roles: ["admin", "auxiliar"] },
  { prefix: "/sistema/extras", roles: ["admin", "auxiliar"] },
  { prefix: "/sistema/ordenes", roles: ["admin", "auxiliar", "colaborador"] },
  { prefix: "/sistema", roles: ["admin", "auxiliar"] },
];

export function isRole(value) {
  return ROLES.includes(value);
}

export function isOfficeRole(role) {
  return role === "admin" || role === "auxiliar";
}

export function homeForRole(role) {
  return role === "colaborador" ? "/sistema/ordenes" : "/sistema";
}

export function canAccessPath(role, pathname) {
  if (!pathname || pathname === "/sistema/login") return true;
  const match = ROUTE_RULES.find(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)
  );
  if (!match) return false;
  return match.roles.includes(role);
}

export const WORKSHOP_STATUSES = ["pendiente", "enProceso", "instalado"];
export const OFFICE_STATUSES = [...WORKSHOP_STATUSES, "revisado"];

export function statusesForRole(role) {
  return role === "colaborador" ? WORKSHOP_STATUSES : OFFICE_STATUSES;
}
