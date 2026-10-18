export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Método no permitido"
    });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  const environment = process.env.MP_ENVIRONMENT;

  if (!accessToken || environment !== "test") {
    return res.status(500).json({
      ok: false,
      error: "Mercado Pago no está configurado en modo de prueba"
    });
  }

  try {
    const { title, amount, folio } = req.body || {};

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof folio !== "string" ||
      !folio.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        ok: false,
        error: "Faltan datos válidos para crear el pago"
      });
    }

    const response = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items: [
            {
              title: title.trim().slice(0, 150),
              quantity: 1,
              currency_id: "MXN",
              unit_price: Math.round(amount * 100) / 100
            }
          ],
          external_reference: folio.trim(),
          back_urls: {
            success: "https://cet-web-prueba.vercel.app/",
            failure: "https://cet-web-prueba.vercel.app/",
            pending: "https://cet-web-prueba.vercel.app/"
          },
          auto_return: "approved"
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Mercado Pago rechazó la solicitud:", response.status);
      return res.status(502).json({
        ok: false,
        error: "No se pudo crear el enlace de pago"
      });
    }

    return res.status(200).json({
      ok: true,
      folio: folio.trim(),
      paymentUrl: data.sandbox_init_point || data.init_point
    });
  } catch (error) {
    console.error("Error creando preferencia de pago:", error.message);

    return res.status(500).json({
      ok: false,
      error: "Error interno al preparar el pago"
    });
  }
}
