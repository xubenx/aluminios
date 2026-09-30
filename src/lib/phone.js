export function normalizeMxPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 12 && digits.startsWith("52")) return digits.slice(2);
  if (digits.length === 13 && digits.startsWith("521")) return digits.slice(3);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

export function whatsappUrl(phone, message) {
  const local = normalizeMxPhone(phone);
  const text = encodeURIComponent(message);
  if (local.length === 10) return `https://wa.me/52${local}?text=${text}`;
  return `https://wa.me/?text=${text}`;
}
