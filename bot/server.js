import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const clientState = new Map();
const processedMessages = new Set();
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FOLIO_FILE = path.join(__dirname, "folio.json");

function getNextFolio() {
  let lastFolio = 0;

  if (fs.existsSync(FOLIO_FILE)) {
    const data = JSON.parse(
      fs.readFileSync(FOLIO_FILE, "utf8")
    );

    lastFolio = data.lastFolio || 0;
  }

  const nextFolio = lastFolio + 1;

  fs.writeFileSync(
    FOLIO_FILE,
    JSON.stringify({ lastFolio: nextFolio }, null, 2)
  );

  return `CT-${String(nextFolio).padStart(4, "0")}`;
}

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

    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

if (!message) {
  return;
}

if (processedMessages.has(message.id)) {
  console.log("🔁 Mensaje duplicado ignorado:", message.id);
  return;
}

processedMessages.add(message.id);

let from = message.from;

    if (from.startsWith("521")) {
       from = "52" + from.slice(3);
    }

    const rawText =
  message?.text?.body
    ?.trim();

const text = rawText?.toLowerCase();

    if (!text) {
      return;
    }

    console.log(`📱 Cliente: ${from}`);
    console.log(`💬 Mensaje: ${text}`);
    if (!clientState.has(from)) {
  clientState.set(from, {});
} 
   if (
  text.includes("experiencia básico") ||
  text.includes("experiencia basico")
) {
  clientState.get(from).experience = "BASIC";
  clientState.get(from).location = "CASA TORTUGA";
  clientState.get(from).language = "ES";
  clientState.get(from).step = "EXPERIENCE_SELECTED";

  console.log("🐢 Experiencia detectada: BASIC - CASA TORTUGA");
  console.log("🇲🇽 Idioma detectado: ESPAÑOL");
}

if (
  text.includes("basic experience") ||
  text.includes("basic") &&
  text.includes("casa tortuga")
) {
  clientState.get(from).experience = "BASIC";
  clientState.get(from).location = "CASA TORTUGA";
  clientState.get(from).language = "EN";
  clientState.get(from).step = "EXPERIENCE_SELECTED";

  console.log("🐢 Experience detected: BASIC - CASA TORTUGA");
  console.log("🇺🇸 Language detected: ENGLISH");
}
  console.log("🧠 Estado actual:", clientState.get(from));

    const reply = getReply(text, from, rawText);

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

function getReply(text, from, rawText) {

  const state = clientState.get(from) || {};
  const selectedExperience = state.experience;
  const selectedLocation = state.location;
// Experiencia seleccionada desde la página web
if (
  state.step === "EXPERIENCE_SELECTED" &&
  selectedExperience === "BASIC" &&
  selectedLocation === "CASA TORTUGA"
) {

  clientState.get(from).step = "NAME";

  if (state.language === "EN") {

    return `🐢 BASIC — CASA TORTUGA

✅ Guided tour through 4 cenotes
🌊 2 open cenotes + 2 cave cenotes
🦺 Life jacket
👨‍🏫 Certified guide

💰 $650 MXN per person

To continue with your reservation, please send us:

👤 Full name
👥 Number of guests
📅 Visit date`;

  }

  return `🐢 BASIC — CASA TORTUGA

✅ Recorrido guiado por 4 cenotes
🌊 2 abiertos + 2 tipo cueva
🦺 Chaleco salvavidas
👨‍🏫 Guía certificado

💰 $650 MXN por persona

Para continuar con tu reserva, envíanos:

👤 Nombre y apellido
👥 Número de personas
📅 Fecha de visita`;
}
// Capturar nombre y detectar datos completos
if (state.step === "NAME") {

  const combinedData = rawText.match(
    /^(.+?),\s*(\d+)\s*(?:personas?|pax)?\s*,\s*(.+)$/i
  );

  if (combinedData) {

    const name = combinedData[1].trim();
    const people = parseInt(combinedData[2], 10);
    const date = combinedData[3].trim();

    if (people < 1) {
      return `Por favor, indícanos un número válido de personas. 👥`;
    }

 clientState.get(from).name = name;
 clientState.get(from).people = people;
 clientState.get(from).date = date;

 clientState.get(from).step = "CONFIRMATION";
 if (state.language === "EN") {

  return `📋 Reservation summary:

👤 ${name}
👥 ${people} guests
📅 ${date}

Would you like to continue with your reservation? ✅

✅ YES — Confirm reservation
❌ NO — Cancel reservation`;

}

return `📋 Resumen de tu reserva:

👤 ${name}
👥 ${people} personas
📅 ${date}

¿Deseas continuar con tu reserva? ✅

✅ SÍ — Confirmar reserva
❌ NO — Cancelar`;
}
// Si solamente envía el nombre, continúa con el flujo normal
clientState.get(from).name = rawText;
clientState.get(from).step = "NUMBER_OF_PEOPLE";

return `¡Gracias, ${rawText}! 😊

¿Cuántas personas serán para tu visita? 👥`;
}
    // Capturar número de personas
  if (state.step === "NUMBER_OF_PEOPLE") {
    const people = parseInt(rawText, 10);

    if (isNaN(people) || people < 1) {
      return `Por favor, indícanos un número válido de personas. 👥`;
    }

    clientState.get(from).people = people;
    clientState.get(from).step = "DATE";

    return `¡Perfecto! Serán ${people} persona${people > 1 ? "s" : ""}. 👥

📅 ¿Cuál es la fecha en la que deseas visitar Casa Tortuga?`;
  }
      // Capturar fecha
  if (state.step === "DATE") {
    clientState.get(from).date = rawText;
    clientState.get(from).step = "CONFIRMATION";

    return `📅 Fecha de visita: ${rawText}

👤 ${clientState.get(from).name}
👥 ${clientState.get(from).people} personas

¿Deseas continuar con tu reserva? ✅`;
  }
    // Confirmar reserva
if (state.step === "CONFIRMATION") {

  if (
    text === "sí" ||
    text === "si" ||
    text === "yes"
  ) {

    const folio = getNextFolio();
    clientState.get(from).folio = folio;

    clientState.get(from).step = "COMPLETED";

    if (state.language === "EN") {
      return `🎉 Excellent!

Your reservation request has been confirmed. 🌴🐢

🆔 Folio: ${folio}

👤 ${clientState.get(from).name}
👥 ${clientState.get(from).people} guests
📅 ${clientState.get(from).date}

See you at Casa Tortuga! 💦🌴

Thank you for choosing Cenotes Experience Tulum!`;
    }

    return `🎉 ¡Excelente!

Tu solicitud de reserva ha sido confirmada. 🌴🐢

🆔 Folio: ${folio}

👤 ${clientState.get(from).name}
👥 ${clientState.get(from).people} personas
📅 ${clientState.get(from).date}

Nos vemos en Casa Tortuga. 💦🌴

¡Gracias por elegir Cenotes Experience Tulum!`;
  }

  if (text === "no") {

    clientState.get(from).step = "CANCELLED";

    if (state.language === "EN") {
      return `👍 No problem.

Your reservation request has been cancelled.`;
    }

    return `👍 No hay problema.

Tu solicitud de reserva ha sido cancelada.`;
  }

  if (state.language === "EN") {
    return `Please reply:

✅ YES — Confirm reservation

❌ NO — Cancel reservation`;
  }

  return `Por favor responde:

✅ SÍ — Confirmar reserva

❌ NO — Cancelar`;
}

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
        if (
      selectedExperience === "BASIC" &&
      selectedLocation === "CASA TORTUGA"
    ) {
       clientState.get(from).step = "EXPERIENCE_SELECTED";

            return `🇲🇽 ¡Perfecto! Continuaremos en español. 😊

🐢 Vemos que estás interesado en la Experiencia Básico de Casa Tortuga.

Con gusto te ayudaremos a continuar con tu reserva. 🌴💦

Por favor indícanos:

👤 Nombre y apellido
👥 Número de personas
📅 Fecha de visita`;
    }
  return `  
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

    if (state.language === "EN") {

  return `🐢 BASIC — CASA TORTUGA

✅ Guided tour through 4 cenotes
🌊 2 open cenotes + 2 cave cenotes
🦺 Life jacket
👨‍🏫 Certified guide

💰 $650 MXN per person

To continue with your reservation, please send us:

👤 Full name
👥 Number of guests
📅 Visit date`;

}

return `🐢 BASIC — CASA TORTUGA

✅ Recorrido guiado por 4 cenotes
🌊 2 abiertos + 2 tipo cueva
🦺 Chaleco salvavidas
👨‍🏫 Guía certificado

💰 $650 MXN por persona

Para continuar con tu reserva, envíanos:

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
// ------------------------------------------------------------
// WEBHOOK DE 2CHAT - MENSAJES WABA RECIBIDOS
// ------------------------------------------------------------

app.post("/webhook/2chat", async (req, res) => {
  // Respondemos inmediatamente a 2Chat
  res.sendStatus(200);

  try {
    console.log("📨 Evento recibido desde 2Chat:");
    console.log(JSON.stringify(req.body, null, 2));

    const event = req.body;

    // Solo procesamos mensajes recibidos de clientes
    if (event.sent_by !== "user") {
      console.log("ℹ️ Evento ignorado: no viene de un cliente");
      return;
    }

    const from = event.remote_phone_number;
    const message = event.message?.text?.trim();

    if (!from || !message) {
      console.log("⚠️ Evento sin teléfono o sin texto");
      return;
    }

    console.log("📱 Cliente:", from);
    console.log("💬 Mensaje:", message.toLowerCase());

    // Por ahora solo probamos recepción
    if (message.toLowerCase() === "english") {
      console.log("✅ ENGLISH recibido correctamente desde 2Chat");
    }

  } catch (error) {
    console.error("❌ Error procesando webhook de 2Chat:", error);
  }
});
// ----------------------------------------------------
// INICIAR SERVIDOR
// ----------------------------------------------------

app.listen(PORT, "0.0.0.0", () => {

  console.log("");
  console.log("🌴 CET Bot iniciado");
  console.log(`🚀 Puerto: ${PORT}`);
  console.log(`🔗 Webhook: /webhook`);
  console.log("");

});
