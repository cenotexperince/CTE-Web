import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// ----------------------------------------------------
// PRUEBA DEL SERVIDOR
// ----------------------------------------------------

app.get("/", (req, res) => {
  res.send("CET Bot funcionando 🌴🐢");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "CET Bot"
  });
});

// ----------------------------------------------------
// VERIFICACIÓN DEL WEBHOOK DE META
// ----------------------------------------------------

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const receivedToken = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("🔎 Intento de verificación:");
  console.log({
    mode: mode,
    receivedTokenLength: receivedToken?.length || 0,
    expectedTokenLength: VERIFY_TOKEN?.length || 0,
    tokenMatch: receivedToken === VERIFY_TOKEN,
    challengePresent: Boolean(challenge)
  });

  if (
    mode === "subscribe" &&
    receivedToken === VERIFY_TOKEN &&
    challenge
  ) {
    console.log("✅ Webhook verificado por Meta");
    return res.status(200).send(challenge);
  }

  console.log("❌ Falló la verificación del webhook");
  return res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {

  // Respondemos rápido a Meta para evitar reintentos.
  res.sendStatus(200);

  try {

    const body = req.body;

    console.log(
      "📩 Evento recibido:",
      JSON.stringify(body, null, 2)
    );

    const message =
      body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return;
    }

    const from = message.from;

    const text =
      message?.text?.body
        ?.trim()
        ?.toLowerCase();

    if (!text) {
      return;
    }

    console.log(`📱 Cliente: ${from}`);
    console.log(`💬 Mensaje: ${text}`);

    const reply = getReply(text);

    await sendWhatsAppMessage(from, reply);

  } catch (error) {

    console.error(
      "❌ Error procesando webhook:",
      error
    );

  }
});

// ----------------------------------------------------
// LÓGICA INICIAL DEL BOT
// ----------------------------------------------------

function getReply(text) {

  // Idioma inglés

  if (
    text === "english" ||
    text === "ingles" ||
    text === "inglés"
  ) {

    return `🌴 Hello! 😊

Thank you for contacting Cenotes Experience Tulum — CET.

We'll be happy to help you with your visit! 🐢💦

Please send us:

👤 Full name
👥 Number of guests
📅 Date of your visit

After that, we'll help you choose your experience.

🎥 Watch our experience:
https://cenotexperince.github.io/CTE-Web/video.html`;
  }

  // Idioma español

  if (
    text === "español" ||
    text === "espanol" ||
    text === "spanish"
  ) {

    return `🌴 ¡Hola! 😊

Gracias por comunicarte con Cenotes Experience Tulum — CET.

¡Con gusto te ayudamos con tu visita! 🐢💦

Por favor indícanos:

👤 Nombre y apellido
👥 Número de personas
📅 Fecha de visita

Después te ayudaremos a elegir tu experiencia.

🎥 Conoce nuestra experiencia:
https://cenotexperince.github.io/CTE-Web/video.html`;
  }

  // BASIC

  if (
    text === "1" ||
    text === "basic" ||
    text === "basico" ||
    text === "básico"
  ) {

    return `🐢 BASIC — CASA TORTUGA

✅ Recorrido guiado por 4 cenotes
🌊 2 abiertos + 2 tipo cueva
🦺 Chaleco salvavidas
👨‍🏫 Guía certificado

💰 $650 MXN por persona

Para continuar envíanos:

👤 Nombre y apellido
👥 Número de personas
📅 Fecha de visita`;
  }

  // SILVER

  if (
    text === "2" ||
    text === "silver"
  ) {

    return `✨ SILVER — CASA TORTUGA

✅ Recorrido por cenotes
🦺 Chaleco salvavidas
👨‍🏫 Guía certificado
🛶 Kayak
🌮 Buffet de tacos

💰 $1,200 MXN por persona`;
  }

  // GOLD

  if (
    text === "3" ||
    text === "gold"
  ) {

    return `⭐ GOLD — CASA TORTUGA

✅ Recorrido por cenotes
🦺 Chaleco salvavidas
👨‍🏫 Guía certificado
🛶 Kayak
🌮 Buffet de tacos
🧗 Tirolesa

💰 $1,500 MXN por persona`;
  }

  // Respuesta general

  return `🌴 CET — Cenotes Experience Tulum

Selecciona tu idioma:

🇲🇽 Escribe ESPAÑOL
🇺🇸 Type ENGLISH

Para Casa Tortuga también puedes responder:

1️⃣ Basic
2️⃣ Silver
3️⃣ Gold`;
}

// ----------------------------------------------------
// ENVIAR RESPUESTAS A WHATSAPP
// ----------------------------------------------------

async function sendWhatsAppMessage(to, message) {

  const url =
    `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Authorization":
        `Bearer ${WHATSAPP_TOKEN}`,

      "Content-Type":
        "application/json"
    },

    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,

      type: "text",

      text: {
        preview_url: true,
        body: message
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "❌ Error enviando mensaje:",
      data
    );
    return;
  }

  console.log(
    "✅ Mensaje enviado:",
    data
  );
}

// ----------------------------------------------------
// INICIAR SERVIDOR
// ----------------------------------------------------

app.listen(PORT, () => {

  console.log("");
  console.log("🌴 CET Bot iniciado");
  console.log(`🚀 Puerto: ${PORT}`);
  console.log(`🔗 Webhook: /webhook`);
  console.log("");

});
