import { supabase } from "./supabase.js";
export async function registrarComprobanteEnReserva(
  folio,
  telefono,
  storagePath
) {
  const recibidoEn = new Date().toISOString();

  const { data, error } = await supabase
    .from("reservas")
    .update({
      comprobante: storagePath,
      comprobante_recibido_en: recibidoEn,
      estado_pago: "comprobante_recibido",
      actualizado_en: recibidoEn
    })
    .eq("folio", folio)
    .eq("telefono_whatsapp", telefono)
    .eq("estado_pago", "pendiente")
    .is("comprobante", null)
    .select("id, folio")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "No se encontró una reserva pendiente compatible con el folio y teléfono."
    );
  }

  console.log("✅ Reserva actualizada:", data.folio);

  return data;
}

export async function confirmarPagoEnReserva(folio) {
  const confirmadoEn = new Date().toISOString();

  const { data, error } = await supabase
    .from("reservas")
    .update({
      estado_pago: "confirmado",
      pago_confirmado_en: confirmadoEn,
      actualizado_en: confirmadoEn
    })
    .eq("folio", folio)
    .eq("estado_pago", "comprobante_recibido")
    .not("comprobante", "is", null)
    .select(`
      id,
      folio,
      estado_pago,
      nombre_cliente,
      personas,
      fecha_visita,
      experiencia,
      total_mxn,
      anticipo_mxn,
      saldo_mxn,
      telefono_whatsapp,
      comprobante,
      voucher_estado
    `)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "No se encontró una reserva con comprobante pendiente de confirmación."
    );
  }

  console.log("🟢 Pago confirmado en Supabase:", data.folio);

  return data;
}

export async function registrarVoucherGenerado(
  folio,
  storagePath
) {
  const generadoEn = new Date().toISOString();

  const { data, error } = await supabase
    .from("reservas")
    .update({
      voucher_path: storagePath,
      voucher_estado: "generado",
      voucher_error: null,
      actualizado_en: generadoEn
    })
    .eq("folio", folio)
    .eq("estado_pago", "confirmado")
    .in("voucher_estado", ["pendiente", "error"])
    .select("id, folio, voucher_path, voucher_estado")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "No se pudo registrar el voucher. Verifica el pago y el estado actual."
    );
  }

  console.log("🎟️ Voucher registrado:", data.folio);

  return data;
}

export async function registrarVoucherEnviado(
  folio,
  messageId
) {
  if (!messageId) {
    throw new Error("Falta el identificador del mensaje de WhatsApp.");
  }

  const enviadoEn = new Date().toISOString();

  const { data, error } = await supabase
    .from("reservas")
    .update({
      voucher_estado: "enviado",
      voucher_message_id: messageId,
      voucher_enviado_en: enviadoEn,
      voucher_error: null,
      actualizado_en: enviadoEn
    })
    .eq("folio", folio)
    .eq("estado_pago", "confirmado")
    .eq("voucher_estado", "generado")
    .not("voucher_path", "is", null)
    .select("id, folio, voucher_estado, voucher_message_id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "No se pudo registrar el envío. Verifica el pago y el estado del voucher."
    );
  }

  console.log("📨 Voucher aceptado por WhatsApp:", data.folio);

  return data;
}
