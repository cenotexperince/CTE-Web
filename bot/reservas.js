
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
