import { randomUUID } from "node:crypto";

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
    const { name, people, visitDate } = req.body || {};

    const cleanName =
      typeof name === "string" ? name.trim() : "";

    const peopleCount = Number(people);

    // Validar nombre
    if (
      cleanName.length < 3 ||
      cleanName.length > 100
    ) {
      return res.status(400).json({
        ok: false,
        error: "Escribe tu nombre completo"
      });
    }

    // Validar número de personas
    if (
      !Number.isInteger(peopleCount) ||
      peopleCount < 1 ||
      peopleCount > 10
    ) {
      return res.status(400).json({
        ok: false,
        error: "El número de personas debe estar entre 1 y 10"
      });
    }

    // Validar fecha de visita en formato YYYY-MM-DD
    if (
      typeof visitDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(visitDate)
    ) {
      return res.status(400).json({
        ok: false,
        error: "Selecciona una fecha de visita válida"
      });
    }

    const [year, month, day] = visitDate
      .split("-")
      .map(Number);

    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return res.status(400).json({
        ok: false,
        error: "La fecha de visita no es válida"
      });
    }

    // No aceptar fechas anteriores al día actual en UTC
    const now = new Date();
    const todayUTC = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ));

    if (date < todayUTC) {
      return res.status(400).json({
        ok: false,
        error: "La fecha de visita debe ser hoy o posterior"
      });
    }

    // El servidor determina el precio: $100 MXN por persona
    const amount = peopleCount * 100;

    // Referencia única para identificar este intento de pago
    const reference = `CET-${randomUUID()}`;

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
              title: "Anticipo Experiencia Básica Casa Tortuga",
              quantity: 1,
              currency_id: "MXN",
              unit_price: amount
            }
          ],
          external_reference: reference,
          metadata: {
            customer_name: cleanName,
            people: peopleCount,
            visit_date: visitDate,
            experience: "Casa Tortuga - Básica"
          },
          back_urls: {
            success: "https://cet-web-prueba.vercel.app/casa-tortuga.html",
            failure: "https://cet-web-prueba.vercel.app/casa-tortuga.html",
            pending: "https://cet-web-prueba.vercel.app/casa-tortuga.html"
          },
          auto_return: "approved"
        })
      }
    );

    const data = await response.json();
    console.log("Respuesta de Mercado Pago:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error(
  "Mercado Pago rechazó la solicitud:",
  response.status,
  JSON.stringify(data, null, 2)
);

      return res.status(502).json({
        ok: false,
        error: "No se pudo crear el enlace de pago de prueba"
      });
    }

    const paymentUrl = data.sandbox_init_point;

    if (
      typeof paymentUrl !== "string" ||
      !paymentUrl.startsWith("https://")
    ) {
      console.error(
        "Mercado Pago no devolvió una URL de prueba válida"
      );

      return res.status(502).json({
        ok: false,
        error: "Mercado Pago no devolvió el enlace de prueba esperado"
      });
    }

    return res.status(200).json({
      ok: true,
      reference,
      people: peopleCount,
      amount,
      currency: "MXN",
      paymentUrl
    });
  } catch (error) {
    console.error(
      "Error creando preferencia de pago:",
      error.message
    );

    return res.status(500).json({
      ok: false,
      error: "Error interno al preparar el pago de prueba"
    });
  }
}
