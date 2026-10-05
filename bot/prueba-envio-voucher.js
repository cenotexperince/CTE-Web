import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// ⚠️ Aquí pondremos después el número que recibirá la prueba.
const TEST_TO = process.env.TEST_TO;

async function sendVoucherTest() {

  const filePath = "./voucher-prueba.pdf";
  const filename = "voucher-prueba.pdf";

  try {

    console.log("📄 Leyendo voucher...");

    const fileBuffer = fs.readFileSync(filePath);

    const formData = new FormData();

    formData.append(
      "messaging_product",
      "whatsapp"
    );

    formData.append(
      "file",
      new Blob([fileBuffer], {
        type: "application/pdf"
      }),
      filename
    );

    console.log("⬆️ Subiendo voucher a WhatsApp...");

    const uploadResponse = await fetch(
      `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/media`,
      {
        method: "POST",

        headers: {
          "Authorization":
            `Bearer ${WHATSAPP_TOKEN}`
        },

        body: formData
      }
    );

    const uploadData = await uploadResponse.json();

    if (!uploadResponse.ok) {

      console.error(
        "❌ Error subiendo voucher:",
        uploadData
      );

      return;
    }

    const mediaId = uploadData.id;

    console.log(
      "✅ Voucher subido. Media ID:",
      mediaId
    );

    console.log("📲 Enviando voucher por WhatsApp...");

    const sendResponse = await fetch(
      `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`,
      {
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

          to: TEST_TO,

          type: "document",

          document: {
            id: mediaId,
            filename: filename
          }

        })
      }
    );

    const sendData = await sendResponse.json();

    if (!sendResponse.ok) {

      console.error(
        "❌ Error enviando voucher:",
        sendData
      );

      return;
    }

    console.log(
      "🎉 VOUCHER ENVIADO CORRECTAMENTE:",
      sendData
    );

  } catch (error) {

    console.error(
      "❌ Error en la prueba:",
      error
    );

  }
}

sendVoucherTest();