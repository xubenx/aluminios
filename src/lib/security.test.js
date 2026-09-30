import test from "node:test";
import assert from "node:assert/strict";
import { canAccessPath, homeForRole, isOfficeRole, statusesForRole } from "./roles.js";
import { authEmailForUsuario } from "./firebaseEmailAuth.js";
import { hasAdminCredentials } from "./firebaseAdmin.js";
import { hashPassword, verifyPassword } from "./password.js";
import { normalizeMxPhone, whatsappUrl } from "./phone.js";
import { rateLimit } from "./rateLimit.js";

test("los roles entran solo a sus rutas", () => {
  assert.equal(canAccessPath("admin", "/sistema/colaboradores"), true);
  assert.equal(canAccessPath("auxiliar", "/sistema/colaboradores"), false);
  assert.equal(canAccessPath("auxiliar", "/sistema/presupuestos"), true);
  assert.equal(canAccessPath("auxiliar", "/sistema/diario"), true);
  assert.equal(canAccessPath("colaborador", "/sistema/ordenes"), true);
  assert.equal(canAccessPath("colaborador", "/sistema/ordenes/detalle"), true);
  assert.equal(canAccessPath("colaborador", "/sistema"), false);
  assert.equal(canAccessPath("colaborador", "/sistema/clientes"), false);
  assert.equal(canAccessPath("colaborador", "/sistema/modelos/abc"), false);
  assert.equal(homeForRole("colaborador"), "/sistema/ordenes");
  assert.equal(homeForRole("auxiliar"), "/sistema");
  assert.equal(isOfficeRole("auxiliar"), true);
  assert.equal(isOfficeRole("colaborador"), false);
  assert.deepEqual(statusesForRole("colaborador"), ["pendiente", "enProceso", "instalado"]);
  assert.ok(statusesForRole("admin").includes("revisado"));
});

test("la contraseña se guarda como hash y se verifica", async () => {
  const hash = await hashPassword("taller-123");
  assert.equal(hash.startsWith("scrypt$"), true);
  assert.equal(hash.includes("taller-123"), false);
  assert.equal(await verifyPassword("taller-123", hash), true);
  assert.equal(await verifyPassword("otra", hash), false);
  assert.equal(await verifyPassword("taller-123", "texto-plano"), false);
});

test("el teléfono mexicano queda en 10 dígitos", () => {
  assert.equal(normalizeMxPhone("+52 477 123 4567"), "4771234567");
  assert.equal(normalizeMxPhone("5214771234567"), "4771234567");
  assert.equal(normalizeMxPhone("4771234567"), "4771234567");
  assert.equal(whatsappUrl("4771234567", "Hola"), "https://wa.me/524771234567?text=Hola");
});

test("el correo de acceso sale del usuario", () => {
  assert.equal(authEmailForUsuario("xubenx", "aluminios-88a45"), "xubenx@aluminios-88a45.firebaseapp.com");
  assert.equal(hasAdminCredentials(), false);
});

test("el límite de intentos bloquea el siguiente envío", () => {
  assert.equal(rateLimit("contact:test", 2, 60_000).ok, true);
  assert.equal(rateLimit("contact:test", 2, 60_000).ok, true);
  assert.equal(rateLimit("contact:test", 2, 60_000).ok, false);
});
