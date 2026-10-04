import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

function generateVoucher(data, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 35, bottom: 35, left: 40, right: 40 }
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const pageWidth = 515;
    const left = 40;
    const right = 555;

    // Encabezado
    doc.roundedRect(left, 35, pageWidth, 100, 14)
      .lineWidth(1.5)
      .stroke("#222222");

    doc.font("Helvetica-Bold")
      .fontSize(23)
      .text("CENOTES", 65, 55);

    doc.fontSize(20)
      .text("CASA TORTUGA", 65, 83);

    doc.fontSize(12)
      .text("TULUM", 65, 109);

    // Folio
    doc.roundedRect(390, 52, 135, 65, 12).stroke();

    doc.fontSize(17)
      .text("FOLIO", 390, 62, {
        width: 135,
        align: "center"
      });

    doc.fontSize(14)
      .text(data.folio || "Pendiente", 390, 91, {
        width: 135,
        align: "center"
      });

    // Datos de la reserva
    doc.roundedRect(left, 155, pageWidth, 335, 12).stroke();

    function field(label, value, x, y, width) {
      doc.font("Helvetica-Bold")
        .fontSize(12)
        .text(label, x, y);

      doc.font("Helvetica")
        .fontSize(12)
        .text(value || "", x + 100, y, {
          width: width - 110
        });

      doc.moveTo(x + 100, y + 19)
        .lineTo(x + width, y + 19)
        .stroke("#555555");
    }

    field("Ubicación", data.location || "Casa Tortuga, Tulum", 60, 175, 470);
    field("Actividad", data.activity || "Experiencia Básica", 60, 215, 470);
    field("Vendedor", data.seller || "", 60, 255, 470);
    field("Cliente", data.name || "", 60, 295, 470);

    field("Fecha", data.date || "", 60, 335, 230);
    field("Pax", String(data.people || ""), 325, 335, 205);

    field("Precio", `$${data.price || 0} MXN`, 60, 375, 230);
    field("Total", `$${data.total || 0} MXN`, 325, 375, 205);

    field("Depósito", `$${data.deposit || 0} MXN`, 60, 415, 230);
    field("Balance", `$${data.balance || 0} MXN`, 325, 415, 205);

    field("Cajero", data.cashier || "", 60, 455, 470);

    // Aviso
    doc.rect(left, 500, pageWidth, 35).fill("#222222");

    doc.fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(13)
      .text("NO SE ACEPTAN CANCELACIONES NI REEMBOLSOS", left, 511, {
        width: pageWidth,
        align: "center"
      });

    // Espacio para mapa
    doc.fillColor("#222222");
    doc.roundedRect(left, 550, pageWidth, 125, 12).stroke();

   // Insertar mapa de Casa Tortuga
const mapPath = path.resolve("../img/mapa-casa-tortuga.png");

doc.image(mapPath, left - 20, 552, {
  fit: [pageWidth + 30, 120],
  align: "center",
  valign: "center"
});
    // Pie de página
    doc.roundedRect(left, 690, 270, 38, 8).stroke();

    doc.font("Helvetica")
      .fontSize(11)
      .text(`Tel. vendedor: ${data.phone || ""}`, 50, 703);

    doc.font("Helvetica-Bold")
      .fontSize(12)
      .text("VÁLIDO ÚNICAMENTE PARA", 325, 690, {
        width: 220,
        align: "center"
      });

    doc.fontSize(11)
      .text("CENOTES CASA TORTUGA TULUM", 325, 708, {
        width: 220,
        align: "center"
      });

    doc.end();

    stream.on("finish", () => resolve(outputPath));
    stream.on("error", reject);
  });
}

export { generateVoucher };