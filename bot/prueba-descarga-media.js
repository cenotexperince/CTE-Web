import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

// 🔴 MEDIA ID DE LA IMAGEN DE PRUEBA
const MEDIA_ID = "2578890529289551";

// Archivo donde guardaremos la imagen descargada
const OUTPUT_PATH = path.resolve("./comprobantes/prueba-comprobante.jpg");

async function downloadWhatsAppMedia(mediaId, outputPath) {
  try {
    console.log("⬇️ Obteniendo información del archivo...");
    console.log("🆔 Media ID:", mediaId);

    // 1. Obtener la URL temporal del archivo
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v25.0/${mediaId}`,
      {
        headers: {
          "Authorization": `Bearer ${WHATSAPP_TOKEN}`
        }
      }
    );

    const mediaData = await mediaResponse.json();

    if (!mediaResponse.ok) {
      console.error("❌ Error obteniendo media:", mediaData);
      return null;
    }

    console.log("✅ Información del archivo obtenida");
    console.log("📄 Tipo:", mediaData.mime_type);

    // 2. Descargar el archivo real
    const fileResponse = await fetch(mediaData.url, {
      headers: {
        "Authorization": `Bearer ${WHATSAPP_TOKEN}`
      }
    });

    if (!fileResponse.ok) {
      console.error(
        "❌ Error descargando archivo:",
        fileResponse.status,
        await fileResponse.text()
      );
      return null;
    }

    // 3. Convertir a Buffer
    const arrayBuffer = await fileResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Crear carpeta si no existe
    const directory = path.dirname(outputPath);

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // 5. Guardar archivo
    fs.writeFileSync(outputPath, buffer);

    console.log("✅ Archivo descargado correctamente");
    console.log("📁 Guardado en:", outputPath);
    console.log("📦 Tamaño:", buffer.length, "bytes");

    return outputPath;

  } catch (error) {
    console.error("❌ Error descargando media:", error);
    return null;
  }
}

await downloadWhatsAppMedia(MEDIA_ID, OUTPUT_PATH);