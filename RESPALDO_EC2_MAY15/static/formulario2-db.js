// formulario2-db.js

window.BASE_URL = window.BASE_URL || window.location.origin;

function enviarDatosABaseDeDatos(jsonFinal) {
  if (!jsonFinal || !jsonFinal.ORDERNUMBER) {
    console.warn("⛔ No hay datos válidos para enviar a la base de datos.");
    return;
  }

  // 📦 LOG COMPLETO DEL JSON
  console.log("📤 JSON completo que se enviará al backend:", jsonFinal);

  // 🔍 Validar campos vacíos por pallet (F12)
  if (Array.isArray(jsonFinal.PALLETS)) {
    jsonFinal.PALLETS.forEach((pallet, index) => {
      console.group(`📦 PALLET ${index + 1} - Validación de campos`);
      Object.entries(pallet).forEach(([key, value]) => {
        if (
          value === undefined ||
          value === null ||
          value === "" ||
          (typeof value === "string" && value.trim() === "")
        ) {
          console.warn(`⚠️ Campo vacío: ${key}`);
        }
      });
      console.groupEnd();
    });
  }

  // 📤 Enviar datos al backend
  fetch(`${BASE_URL}/api/guardar-inspeccion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(jsonFinal)
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success" || data.message?.includes("guardada")) {
        console.log("✅ Datos guardados en base de datos correctamente.");
      } else {
        console.warn("⚠️ Hubo un problema al guardar los datos:", data.message || data.error);
      }
    })
    .catch(err => {
      console.error("❌ Error al enviar datos a la base de datos:", err);
    });
}

