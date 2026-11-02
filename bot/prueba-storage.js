
import { supabase } from "./supabase.js";

const testPath = "pruebas/TEST-CET-STORAGE.pdf";

// PDF mínimo de prueba, sin datos personales.
const pdf = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF",
  "utf8"
);

async function probarStorage() {
  console.log("🐢 Iniciando prueba de Storage CET...");

  const { data, error } = await supabase.storage
    .from("cet-documentos")
    .upload(testPath, pdf, {
      contentType: "application/pdf",
      upsert: false
    });

  if (error) {
    console.error("❌ Error al subir:", error.message);
    process.exitCode = 1;
    return;
  }

  console.log("✅ Archivo subido:", data.path);

  const { data: files, error: listError } = await supabase.storage
    .from("cet-documentos")
    .list("pruebas");

  if (listError || !files?.some(file => file.name === "TEST-CET-STORAGE.pdf")) {
    console.error("❌ No pudimos verificar el archivo:", listError);
    process.exitCode = 1;
    return;
  }

  console.log("✅ Archivo verificado en el bucket privado.");

  const { error: deleteError } = await supabase.storage
    .from("cet-documentos")
    .remove([testPath]);

  if (deleteError) {
    console.error("❌ No se pudo eliminar el archivo:", deleteError.message);
    process.exitCode = 1;
    return;
  }

  console.log("🧹 Archivo de prueba eliminado.");
  console.log("🎉 PRUEBA DE STORAGE CET COMPLETADA.");
}

probarStorage().catch(error => {
  console.error("❌ Error inesperado:", error);
  process.exitCode = 1;
});
