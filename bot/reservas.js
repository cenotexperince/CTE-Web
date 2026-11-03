
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
