function normalizePhone(phone) {
  let digits = String(phone ?? "").replace(/\D/g, "");

  if (/^\d{10}$/.test(digits)) {
    digits = "52" + digits;
  }

  if (digits.startsWith("521") && digits.length === 13) {
    digits = "52" + digits.slice(3);
  }

  if (!/^52\d{10}$/.test(digits)) {
    throw new Error("Número mexicano inválido. Se requieren 10 dígitos.");
  }

  return digits;
}

console.log("Prueba 1:", normalizePhone("9981234567"));
console.log("Prueba 2:", normalizePhone("5219981234567"));
console.log("Prueba 3:", normalizePhone("529981234567"));