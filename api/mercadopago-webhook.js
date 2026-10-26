export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Método no permitido"
    });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;

  if (!accessToken) {
    console.error("Falta MP_ACCESS_TOKEN");
    return res.status(500).json({ ok: false });
  }

  try {
    const paymentId =
      req.query?.["data.id"] ||
      req.query?.id ||
      req.body?.data?.id;

    if (!paymentId || !/^\d+$/.test(String(paymentId))) {
      return res.status(400).json({
        ok: false,
        error: "Notificación sin ID de pago válido"
      });
    }

    const respuesta = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const pago = await respuesta.json();

    if (!respuesta.ok) {
  console.error(
    "No se pudo consultar el pago:",
    respuesta.status
  );

  if (respuesta.status === 404) {
    return res.status(200).json({
      ok: true,
      ignored: true,
      reason: "Pago no encontrado"
    });
  }

  return res.status(502).json({ ok: false });
}
    console.log("Notificación de Mercado Pago:", {
      paymentId: pago.id,
      status: pago.status,
      externalReference: pago.external_reference,
      amount: pago.transaction_amount,
      currency: pago.currency_id
    });

    // Solo consultamos y registramos el estado.
    // Aún no creamos reservas ni comprobantes aquí.
    return res.status(200).json({
      ok: true,
      paymentStatus: pago.status
    });
  } catch (error) {
    console.error(
      "Error al verificar notificación:",
      error.message
    );

    return res.status(500).json({ ok: false });
  }
}
